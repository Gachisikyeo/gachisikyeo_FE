// src/api/api.ts
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
// import { clearAuth, getAccessToken, getRefreshToken, saveTokens } from "../auth/authStorage";
import {
  clearAuth,
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  saveAuthUser,
  saveTokens,
} from "../auth/authStorage";


const API_ORIGIN = ((import.meta.env.VITE_API_ORIGIN as string) || "https://gachisikyeo.duckdns.org").replace(/\/+$/, "");
const ENV_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

const isDev = import.meta.env.DEV;

let baseURL = API_ORIGIN;

if (ENV_BASE !== undefined) {
  const trimmed = ENV_BASE.trim();
  if (trimmed === "") {
    baseURL = isDev ? "" : API_ORIGIN;
  } else {
    baseURL = trimmed.replace(/\/+$/, "");
  }
}

export type ApiResponseTemplate<T> = {
  status: number;
  success: boolean;
  message: string;
  data: T;
};

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;

  id: number;
  email: string;
  name: string;
  nickName: string;
  role: string;
  authProvider: string;
  userType: "BUYER" | "SELLER";
  lawDong?: {
    id: number;
    lawCode?: string;
    sido: string;
    sigungu: string;
    dong: string;
  };
  marketName?: string;
};

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const plain = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const multipartApi = axios.create({ baseURL });

function setAuthHeader(config: AxiosRequestConfig, token: string) {
  const headers = (config.headers ?? {}) as any;
  headers.Authorization = `Bearer ${token}`;
  config.headers = headers;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) setAuthHeader(config, token);
  return config;
});

multipartApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) setAuthHeader(config, token);
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refreshToken");

  const res = await plain.post<ApiResponseTemplate<{ accessToken: string; refreshToken: string }>>("/auth/refresh", {
    refreshToken,
  });

  if (!res.data.success) throw new Error(res.data.message);

  saveTokens(res.data.data.accessToken, res.data.data.refreshToken);
  return res.data.data.accessToken;
}

function isAuthEndpoint(url: string) {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/oauth2/signup")
  );
}

function isOAuthRedirectCors(error: AxiosError) {
  const anyErr = error as any;
  const responseURL: string | undefined = anyErr?.request?.responseURL || anyErr?.response?.request?.responseURL;

  if (typeof responseURL === "string") {
    if (responseURL.includes("accounts.google.com")) return true;
    if (responseURL.includes("/oauth2/authorization/")) return true;
  }

  const status = error.response?.status;
  if (status && [302, 303, 307, 308].includes(status)) return true;

  return false;
}

async function handleAuthRefreshRetry(
  client: typeof api | typeof multipartApi,
  error: AxiosError,
  original: AxiosRequestConfig & { _retry?: boolean }
) {
  const status = error.response?.status;
  const url = String(original.url ?? "");

  const shouldTry = !original._retry && !isAuthEndpoint(url) && (status === 401 || isOAuthRedirectCors(error));
  if (!shouldTry) throw error;

  original._retry = true;

  if (isRefreshing) {
    return await new Promise((resolve, reject) => {
      refreshQueue.push((token) => {
        if (!token) return reject(error);
        setAuthHeader(original, token);
        resolve((client as any)(original));
      });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    flushQueue(newToken);
    setAuthHeader(original, newToken);
    return await (client as any)(original);
  } catch (e) {
    flushQueue(null);
    clearAuth();
    throw e;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    try {
      return await handleAuthRefreshRetry(api, error, original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

multipartApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    try {
      return await handleAuthRefreshRetry(multipartApi, error, original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

/** POST /auth/login */
export const login = (data: { email: string; password: string }) => {
  return api.post<ApiResponseTemplate<LoginResponseData>>("/auth/login", data);
};

/** POST /auth/signup */
export const signup = (data: {
  email: string;
  password: string;
  name: string;
  nickName: string;
  userType: "BUYER" | "SELLER";
  lawDongId: string | number;
}) => {
  return api.post<ApiResponseTemplate<any>>("/auth/signup", data);
};

/** DELETE /auth/logout */
export const logout = () => {
  return api.delete<ApiResponseTemplate<any>>("/auth/logout");
};

/** POST /auth/oauth2/signup */
export const oauth2Signup = (data: {
  oauth2SignupToken: string;
  nickName: string;
  userType: "BUYER" | "SELLER";
  lawDongId: string | number;
}) => {
  return plain.post<ApiResponseTemplate<LoginResponseData>>("/auth/oauth2/signup", data);
};

export const getGoogleAuthorizationUrl = () => {
  if (baseURL === "") return "/oauth2/authorization/google";
  return `${baseURL}/oauth2/authorization/google`;
};

export const getSidoList = () => {
  return plain.get<ApiResponseTemplate<string[]>>("/law-dong/sido");
};

export const getSigunguList = (sido: string) => {
  return plain.get<ApiResponseTemplate<string[]>>("/law-dong/sigungu", { params: { sido } });
};

export const getDongList = (sido: string, sigungu: string) => {
  return plain.get<ApiResponseTemplate<string[]>>("/law-dong/dong", { params: { sido, sigungu } });
};

export const resolveLawDong = (payload: { sido: string; sigungu: string; dong: string }) => {
  return plain.get<ApiResponseTemplate<{ id: number; lawCode?: string; sido: string; sigungu: string; dong: string }>>(
    "/law-dong/resolve",
    { params: payload }
  );
};

export type BusinessInfoRequest = {
  businessNumber: string;
  storeName: string;
  ceoName: string;
  address: string;
  sellerTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  electronicFinanceAgreed: boolean;
};

export type BusinessInfoResponse = {
  id: number;
  userId: number;
  businessNumber: string;
  storeName: string;
  ceoName: string;
  address: string;
};

export const createBusinessInfo = (data: BusinessInfoRequest) => {
  return api.post<ApiResponseTemplate<BusinessInfoResponse>>("/api/business-info", data);
};

export const getMyBusinessInfo = () => {
  return api.get<ApiResponseTemplate<BusinessInfoResponse>>("/api/business-info/me");
};

export const uploadFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  return multipartApi.post<ApiResponseTemplate<string[]>>("/files", formData);
};

export const deleteFile = (fileName: string) => {
  return api.delete<ApiResponseTemplate<any>>("/files", { params: { fileName } });
};

export type ProductCategory = "FOOD" | "NON_FOOD" | "CLOTHES";

export type ProductDetailDto = {
  id: number;
  category?: ProductCategory;
  productName: string;
  price: number;
  stockQuantity?: number;
  unitQuantity?: number;
  unitPrice?: number;
  imageUrl?: string;
  storeName?: string;
  descriptionTitle?: string;
  description?: string;
};

export const getProductById = (productId: number) => {
  return plain.get<ApiResponseTemplate<ProductDetailDto>>(`/api/products/${productId}`);
};
//여기부터
export type ProductSortKey = "CREATED_AT" | "VIEW_COUNT" | "PRICE";

export type ProductListResponse = {
  id: number;
  productName: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  unitQuantity: number;
  unitPrice: number;
};

export type PageSliceResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export const getProducts = (params?: {
  page?: number;
  size?: number;
  sortKey?: ProductSortKey;
  direction?: SortDirection;
}) => {
  return plain.get<ApiResponseTemplate<PageSliceResponse<ProductListResponse>>>("/api/products", { params });
};

export const getProductsByCategory = (
  category: ProductCategory,
  params?: {
    page?: number;
    size?: number;
    sortKey?: ProductSortKey;
    direction?: SortDirection;
  }
) => {
  return plain.get<ApiResponseTemplate<PageSliceResponse<ProductListResponse>>>("/api/products/category", {
    params: { category, ...(params ?? {}) },
  });
};

export type PopularProductResponse = {
  productId: number;
  productName: string;
  price: number;
  imageUrl: string;
  storeName?: string;
};

export const getPopularProducts = (params?: { page?: number; size?: number }) => {
  return plain.get<ApiResponseTemplate<PageSliceResponse<PopularProductResponse>>>("/api/products/popular", { params });
};

export type GroupPurchaseListItem = {
  id: number;
  regionName?: string;
  dong?: string;
  hostNickName?: string;
  hostBuyQuantity: number;
  targetQuantity: number;
  minimumOrderUnit: number;
  groupEndAt: string;
  pickupLocation: string;
  pickupAt: string;
  pickupAfterEnd?: boolean;
  groupPurchaseId?: number;
  hostUserId?: number;
  userNickName?: string;
  hostContact?: string;
  status?: string;
  currentQuantity?: number;
  total_participation?: number;
  totalParticipation?: number;

};

export const getGroupPurchasesByProductId = (productId: number) => {
  return plain.get<ApiResponseTemplate<GroupPurchaseListItem[]>>(`/api/products/${productId}/group-purchases`);
};

export type GroupPurchaseJoinDetailDto = {
  productName: string;
  targetQuantity: number;
  groupEndAt: string;
  pickupLocation: string;
  pickupAt: string;
  minimumOrderUnit: number;
};

export const getGroupPurchaseJoinDetail = (groupPurchaseId: number) => {
  return api.get<ApiResponseTemplate<GroupPurchaseJoinDetailDto>>(`/api/group-purchases/${groupPurchaseId}`);
};


export type ProductCreateRequest = {
  category: ProductCategory;
  productName: string;
  price: number;
  stockQuantity: number;
  unitQuantity: number;
  descriptionTitle?: string;
  description?: string;
};

export const createProduct = (data: ProductCreateRequest, image: File) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));
  formData.append("image", image);

  return multipartApi.post<ApiResponseTemplate<any>>("/api/products", formData);
};

export type GroupPurchaseCreateRequest = {
  hostBuyQuantity: number;
  targetQuantity: number;
  minimumOrderUnit: number;
  groupEndAt: string;

  deliveryLocation: string;
  pickupLocation: string;
  pickupAt: string;

  hostContact: string;
  pickupAfterEnd?: boolean;
};


export type CreateGroupPurchaseResponseDto = {
  groupPurchaseId: number;

  hostUserId: number;
  userNickName: string;
  hostContact: string;

  currentQuantity: number;
  targetQuantity: number;
  groupEndAt: string;
  regionId?: number;
  regionName?: string;
};

export const createGroupPurchase = (productId: number, data: GroupPurchaseCreateRequest) => {
  return api.post<ApiResponseTemplate<CreateGroupPurchaseResponseDto>>(`/api/products/${productId}/group-purchases`, data);
};

export type CreateParticipationRequestDto = {
  quantity: number;
  buyerContact: string;
};

export type CreateParticipationResponseDto = {
  participationId: number;
  participationStatus?: string;
  quantity: number;
  buyerContact: string;
  shareAmount?: number;
  createdAt?: string;

  groupPurchaseId: number;
  groupPurchaseStatus?: string;
  groupEndAt?: string;
  currentQuantity?: number;
  targetQuantity?: number;
  minimumOrderUnit?: number;

  productId?: number;
  productName?: string;
  unitPrice?: number;
  totalQuantity?: number;
};

export const createParticipation = (groupPurchaseId: number, data: CreateParticipationRequestDto) => {
  return api.post<ApiResponseTemplate<CreateParticipationResponseDto>>(
    `/api/group-purchases/${groupPurchaseId}/participations`,
    data
  );
};

export const getParticipationPaymentInfo = (participationId: number) => {
  return api.get<ApiResponseTemplate<any>>(`/api/participations/${participationId}`);
};

export const confirmParticipationPayment = (participationId: number) => {
  return api.post<ApiResponseTemplate<any>>(
    `/api/participations/${participationId}/payments/confirm`
  );
};


export type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type MyProfileResponseDto = {
  nickname: string;
  email: string;
  lawDong: string | null;
  userType: string;
};

export type SliceResponse<T> = {
  items: T[];
  page: number;
  size: number;
  hasNext: boolean;
};

export type MyParticipationGroupPurchaseDto = {
  participationId: number;
  groupPurchaseId: number;
  productName: string;
  imageUrl?: string;
  totalPrice: number;
  unitPrice: number;
  totalQuantity: number;
  myQuantity: number;
  myPaymentAmount: number;
  pickupLocation: string;
  pickupTime: string;
  groupPurchaseStatus: string;
};

export type MypageGroupPurchaseDto = MyParticipationGroupPurchaseDto;

export type MypageResponseDto = {
  nickname: string;
  email: string;
  lawDong?: string | null;
  userType: string;
  completedGroupPurchases?: PageResponse<MypageGroupPurchaseDto>;
  ongoingGroupPurchases?: PageResponse<MypageGroupPurchaseDto>;
};

export type CompletedGroupPurchaseDetailDto = {
  productName: string;
  imageUrl?: string;
  totalPrice: number;
  unitPrice: number;
  quantity: number;
  pickupLocation?: string;
  pickupTime?: string;
  orderNumber: number;
  buyerName: string;
  leaderNickname: string;
  paymentAmount: number;
};

// export const getMypageProfile = () => {
//   return api.get<ApiResponseTemplate<MyProfileResponseDto>>("/api/mypage/profile");
// };
export const getMypageProfile = async () => {
  const res = await api.get<any>("/api/mypage/profile");

  try {
    const raw = res.data;
    const p: MyProfileResponseDto | null = raw?.data ?? raw ?? null;

    if (p && typeof p === "object") {
      const cur = getAuthUser();
      if (cur.isLoggedIn) {
        const utRaw = String((p as any).userType ?? "");
        const utUpper = utRaw.toUpperCase();

        const nextUserType =
          utUpper.includes("SELLER") || utRaw.includes("판매")
            ? "SELLER"
            : utUpper.includes("BUYER") || utUpper.includes("USER") || utRaw.includes("구매")
            ? "BUYER"
            : cur.userType;

        const nickname = String((p as any).nickname ?? "").trim();
        const email = String((p as any).email ?? "").trim();
        const dong = (p as any).lawDong != null ? String((p as any).lawDong).trim() : "";

        const next = {
          ...cur,
          userType: nextUserType,
          email: cur.email && cur.email.trim() ? cur.email : email || cur.email,
          nickName: cur.nickName && cur.nickName.trim() ? cur.nickName : nickname || cur.nickName,
          lawDong:
            dong
              ? cur.lawDong ?? { id: -1, sido: "", sigungu: "", dong }
              : cur.lawDong,
        };

        saveAuthUser(next);
      }
    }
  } catch {}

  return res;
};



export const getMypageParticipationsOngoing = (params: { page?: number; size?: number }) => {
  return api.get<ApiResponseTemplate<SliceResponse<MyParticipationGroupPurchaseDto>>>(
    "/api/mypage/participations/ongoing",
    { params }
  );
};

export const getMypageParticipationsCompleted = (params: { page?: number; size?: number }) => {
  return api.get<ApiResponseTemplate<SliceResponse<MyParticipationGroupPurchaseDto>>>(
    "/api/mypage/participations/completed",
    { params }
  );
};

export const getMypageMain = async (params?: { completed?: boolean; ongoing?: boolean }) => {
  const wantCompleted = params?.completed ?? false;
  const wantOngoing = params?.ongoing ?? false;

  const [profileRes, completedRes, ongoingRes] = await Promise.all([
    getMypageProfile(),
    wantCompleted ? getMypageParticipationsCompleted({ page: 0, size: 3 }) : Promise.resolve(null),
    wantOngoing ? getMypageParticipationsOngoing({ page: 0, size: 3 }) : Promise.resolve(null),
  ]);

  const profile = profileRes.data.data;

  const completedItems = completedRes?.data.data.items ?? [];
  const ongoingItems = ongoingRes?.data.data.items ?? [];

  return {
    data: {
      nickname: profile.nickname,
      email: profile.email,
      lawDong: profile.lawDong,
      userType: profile.userType,
      completedGroupPurchases: wantCompleted
        ? ({ content: completedItems } as PageResponse<MypageGroupPurchaseDto>)
        : undefined,
      ongoingGroupPurchases: wantOngoing
        ? ({ content: ongoingItems } as PageResponse<MypageGroupPurchaseDto>)
        : undefined,
    } as MypageResponseDto,
  };
};

export const getMypageCompletedDetail = (participationId: number) => {
  return api.get<ApiResponseTemplate<CompletedGroupPurchaseDetailDto>>(`/api/mypage/completed/${participationId}`);
};

export type SellerDashboardResponse = {
  totalSoldQuantity: number;
};

export const getSellerTotalSoldQuantity = () => {
  return api.get<ApiResponseTemplate<SellerDashboardResponse>>("/api/seller/dashboard/sales");
};

export type SellerProductResponse = {
  productId: number;
  productName: string;
  price: number;
  stock: number;
  createdAt: string;
};

export type SellerProductSortKey = "CREATED_AT" | "PRICE" | "STOCK_QUANTITY";
export type SortDirection = "ASC" | "DESC";


export type PageResponseSellerProductResponse = {
  items: SellerProductResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};


export const getSellerDashboardProducts = (params?: {
  page?: number;
  size?: number;
  sortKey?: SellerProductSortKey;
  direction?: SortDirection;
}) => {
  return api.get<ApiResponseTemplate<PageResponseSellerProductResponse>>("/api/seller/dashboard/products", { params });
};

export type MonthlySalesResponse = {
  yearMonth: string;
  totalSalesAmount: number;
};

export const getSellerMonthlySales = (params: { year: number; month: number }) => {
  return api.get<ApiResponseTemplate<MonthlySalesResponse>>("/api/seller/dashboard/monthly-sales", { params });
};

export default api;
