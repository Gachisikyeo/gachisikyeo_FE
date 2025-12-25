
// // src/api/api.ts
// import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
// import { clearAuth, getAccessToken, getRefreshToken, saveTokens } from "../auth/authStorage";

// export type ApiResponseTemplate<T> = {
//   status: number;
//   success: boolean;
//   message: string;
//   data: T;
// };

// export type LoginResponseData = {
//   accessToken: string;
//   refreshToken: string;

//   id: number;
//   email: string;
//   name: string;
//   nickName: string;
//   role: string;
//   authProvider: string;
//   userType: "BUYER" | "SELLER";
//   lawDong?: {
//     id: number;
//     lawCode?: string;
//     sido: string;
//     sigungu: string;
//     dong: string;
//   };
// };

// // ✅ 서버 기본값(스웨거 서버)
// const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN as string) || "https://gachisikyeo.duckdns.org";

// /**
//  * ✅ baseURL 결정 규칙
//  * - VITE_API_BASE_URL이 "정의되어 있으면" 그 값을 그대로 사용
//  *   - ""(빈 문자열)이면 → 프록시 모드 (상대경로로 호출)
//  *   - "https://..."면 → 해당 서버로 직접 호출
//  * - 아예 정의가 없으면 → 기본으로 배포 서버(API_ORIGIN)로 직접 호출
//  */
// const ENV_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
// const baseURL = ENV_BASE !== undefined ? ENV_BASE : API_ORIGIN;

// const api = axios.create({
//   baseURL,
//   headers: { "Content-Type": "application/json" },
// });

// const plain = axios.create({
//   baseURL,
//   headers: { "Content-Type": "application/json" },
// });

// const multipartApi = axios.create({
//   baseURL,
// });

// api.interceptors.request.use((config) => {
//   const token = getAccessToken();
//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// multipartApi.interceptors.request.use((config) => {
//   const token = getAccessToken();
//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// let isRefreshing = false;
// let refreshQueue: Array<(token: string | null) => void> = [];

// function flushQueue(token: string | null) {
//   refreshQueue.forEach((cb) => cb(token));
//   refreshQueue = [];
// }

// async function refreshAccessToken(): Promise<string> {
//   const refreshToken = getRefreshToken();
//   if (!refreshToken) throw new Error("No refreshToken");

//   const res = await plain.post<ApiResponseTemplate<{ accessToken: string; refreshToken: string }>>("/auth/refresh", {
//     refreshToken,
//   });

//   if (!res.data.success) throw new Error(res.data.message);

//   saveTokens(res.data.data.accessToken, res.data.data.refreshToken);
//   return res.data.data.accessToken;
// }

// api.interceptors.response.use(
//   (res) => res,
//   async (error: AxiosError) => {
//     const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
//     if (!original) return Promise.reject(error);

//     const url = original.url ?? "";
//     const isAuthEndpoint =
//       url.includes("/auth/login") ||
//       url.includes("/auth/refresh") ||
//       url.includes("/auth/signup") ||
//       url.includes("/auth/oauth2/signup");

//     if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
//       original._retry = true;

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           refreshQueue.push((token) => {
//             if (!token) return reject(error);
//             original.headers = original.headers ?? {};
//             original.headers.Authorization = `Bearer ${token}`;
//             resolve(api(original));
//           });
//         });
//       }

//       isRefreshing = true;
//       try {
//         const newToken = await refreshAccessToken();
//         flushQueue(newToken);

//         original.headers = original.headers ?? {};
//         original.headers.Authorization = `Bearer ${newToken}`;
//         return api(original);
//       } catch (e) {
//         flushQueue(null);
//         clearAuth();
//         return Promise.reject(e);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// multipartApi.interceptors.response.use(
//   (res) => res,
//   async (error: AxiosError) => {
//     const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
//     if (!original) return Promise.reject(error);

//     const url = original.url ?? "";
//     const isAuthEndpoint =
//       url.includes("/auth/login") ||
//       url.includes("/auth/refresh") ||
//       url.includes("/auth/signup") ||
//       url.includes("/auth/oauth2/signup");

//     if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
//       original._retry = true;

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           refreshQueue.push((token) => {
//             if (!token) return reject(error);
//             original.headers = original.headers ?? {};
//             original.headers.Authorization = `Bearer ${token}`;
//             resolve(multipartApi(original));
//           });
//         });
//       }

//       isRefreshing = true;
//       try {
//         const newToken = await refreshAccessToken();
//         flushQueue(newToken);

//         original.headers = original.headers ?? {};
//         original.headers.Authorization = `Bearer ${newToken}`;
//         return multipartApi(original);
//       } catch (e) {
//         flushQueue(null);
//         clearAuth();
//         return Promise.reject(e);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// /** POST /auth/login */
// export const login = (data: { email: string; password: string }) => {
//   return api.post<ApiResponseTemplate<LoginResponseData>>("/auth/login", data);
// };

// /** POST /auth/signup */
// export const signup = (data: {
//   email: string;
//   password: string;
//   name: string;
//   nickName: string;
//   userType: "BUYER" | "SELLER";
//   lawDongId: number;
// }) => {
//   return api.post<ApiResponseTemplate<string>>("/auth/signup", data);
// };

// /** DELETE /auth/logout */
// export const logout = () => {
//   return api.delete<ApiResponseTemplate<string>>("/auth/logout");
// };

// /** POST /auth/oauth2/signup */
// export const oauth2Signup = (data: {
//   oauth2SignupToken: string;
//   nickName: string;
//   userType: "BUYER" | "SELLER";
//   lawDongId: number;
// }) => {
//   return api.post<ApiResponseTemplate<LoginResponseData>>("/auth/oauth2/signup", data);
// };

// /** 구글 로그인 시작 URL */
// export const getGoogleAuthorizationUrl = () => {
//   if (baseURL === "") return "/oauth2/authorization/google";
//   return `${baseURL}/oauth2/authorization/google`;
// };

// // ----------------------
// // ✅ LawDong (스웨거 기준)
// // ----------------------

// // GET /law-dong/sido : string[]
// export const getSidoList = () => {
//   return plain.get<ApiResponseTemplate<string[]>>("/law-dong/sido");
// };

// // GET /law-dong/sigungu?sido= : string[]
// export const getSigunguList = (sido: string) => {
//   return plain.get<ApiResponseTemplate<string[]>>("/law-dong/sigungu", { params: { sido } });
// };

// // GET /law-dong/dong?sido=&sigungu= : string[]  (스웨거가 리스트 string으로 줌):contentReference[oaicite:1]{index=1}
// export const getDongList = (sido: string, sigungu: string) => {
//   return plain.get<ApiResponseTemplate<string[]>>("/law-dong/dong", { params: { sido, sigungu } });
// };

// // GET /law-dong/resolve?sido=&sigungu=&dong= : LawDongDto (id 포함)
// export type LawDongDto = {
//   id: number;
//   lawCode?: string;
//   sido: string;
//   sigungu: string;
//   dong: string;
// };

// export const resolveLawDong = (sido: string, sigungu: string, dong: string) => {
//   return plain.get<ApiResponseTemplate<LawDongDto>>("/law-dong/resolve", {
//     params: { sido, sigungu, dong },
//   });
// };

// // ----------------------
// // ✅ BusinessInfo (판매자 사업자 등록)
// // ----------------------
// // 스웨거: POST /api/business-info (JWT 필요):contentReference[oaicite:2]{index=2}
// export type BusinessInfoRequest = {
//   businessNumber: string;
//   storeName: string;
//   ceoName: string;
//   address: string;
//   sellerTermsAgreed: boolean;
//   privacyPolicyAgreed: boolean;
//   electronicFinanceAgreed: boolean;
// };

// export type BusinessInfoResponse = {
//   id: number;
//   userId: number;
//   businessNumber: string;
//   storeName: string;
//   ceoName: string;
//   address: string;
// };

// export const createBusinessInfo = (data: BusinessInfoRequest) => {
//   return api.post<ApiResponseTemplate<BusinessInfoResponse>>("/api/business-info", data);
// };

// // ----------------------
// // ✅ Files (S3 업로드/삭제)
// // ----------------------
// // 스웨거: POST /files, DELETE /files:contentReference[oaicite:3]{index=3}
// export const uploadFiles = (files: File[]) => {
//   const form = new FormData();
//   files.forEach((f) => form.append("files", f));
//   return multipartApi.post<ApiResponseTemplate<string[]>>("/files", form, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// export const deleteFile = (fileName: string) => {
//   return api.delete<ApiResponseTemplate<string>>("/files", { params: { fileName } });
// };

// // ----------------------
// // ✅ Products / GroupPurchase (스웨거에 있는 것만)
// // ----------------------
// // POST /api/products:contentReference[oaicite:4]{index=4}
// export type ProductCategory = string;

// export type ProductCreateRequest = {
//   category: ProductCategory;
//   productName: string;
//   price: number;
//   stockQuantity: number;
//   unitQuantity: number;
//   imageUrl: string;
//   descriptionTitle: string;
//   description: string;
// };

// export const createProduct = (data: ProductCreateRequest) => {
//   return api.post<ApiResponseTemplate<any>>("/api/products", data);
// };

// // GET /api/products/{productId}/group-purchases, POST /api/products/{productId}/group-purchases:contentReference[oaicite:5]{index=5}
// export type GroupPurchaseListItem = {
//   id: number;
//   regionId?: number;
//   hostBuyQuantity?: number;
//   targetQuantity?: number;
//   minimumOrderUnit?: number;
//   groupEndAt?: string;
//   pickupLocation?: string;
//   pickupAt?: string;
//   pickupAfterEnd?: boolean;
//   // 백엔드가 더 내려줘도 안 깨지게
//   [key: string]: any;
// };

// export const getGroupPurchasesByProductId = (productId: number) => {
//   return plain.get<ApiResponseTemplate<GroupPurchaseListItem[]>>(`/api/products/${productId}/group-purchases`);
// };

// export type GroupPurchaseCreateRequest = {
//   regionId: number;
//   hostBuyQuantity: number;
//   targetQuantity: number;
//   minimumOrderUnit: number;
//   groupEndAt: string;
//   pickupLocation: string;
//   pickupAt: string;
//   pickupAfterEnd?: boolean;
// };

// export const createGroupPurchase = (productId: number, data: GroupPurchaseCreateRequest) => {
//   return api.post<ApiResponseTemplate<any>>(`/api/products/${productId}/group-purchases`, data);
// };

// export default api;
// src/api/api.ts
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { clearAuth, getAccessToken, getRefreshToken, saveTokens } from "../auth/authStorage";

/**
 * ✅ 배포/개발 모두 안전하게 동작하도록 baseURL을 정함
 * - 개발(dev): VITE_API_BASE_URL이 ""(빈문자)이면 상대경로 모드(= Vite proxy)
 * - 배포(prod): VITE_API_BASE_URL이 ""이더라도 API_ORIGIN으로 강제 (정적 호스팅엔 proxy가 없어서!)
 */
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

// 인증 필요 없는 요청용 (예: law-dong)
const plain = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// multipart (Content-Type은 브라우저가 boundary 포함해서 자동 설정하게 둠)
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

// ----------------------
// ✅ 401 자동 토큰 재발급 (refresh)
// ----------------------
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

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const url = String(original.url ?? "");

    if (status === 401 && !original._retry && !isAuthEndpoint(url)) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(error);
            setAuthHeader(original, token);
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        flushQueue(newToken);
        setAuthHeader(original, newToken);
        return api(original);
      } catch (e) {
        flushQueue(null);
        clearAuth();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

multipartApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const url = String(original.url ?? "");

    if (status === 401 && !original._retry && !isAuthEndpoint(url)) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(error);
            setAuthHeader(original, token);
            resolve(multipartApi(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        flushQueue(newToken);
        setAuthHeader(original, newToken);
        return multipartApi(original);
      } catch (e) {
        flushQueue(null);
        clearAuth();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ----------------------
// ✅ Auth (스웨거 기준)
// ----------------------

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
  lawDongId: number;
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
  lawDongId: number;
}) => {
  return plain.post<ApiResponseTemplate<LoginResponseData>>("/auth/oauth2/signup", data);
};

/** GET /oauth2/authorization/google (구글 로그인 시작 URL) */
export const getGoogleAuthorizationUrl = () => {
  if (baseURL === "") return "/oauth2/authorization/google"; // dev proxy 모드
  return `${baseURL}/oauth2/authorization/google`; // prod는 duckdns로 이동
};

// ----------------------
// ✅ LawDong (스웨거 기준)
// ----------------------

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

// ----------------------
// ✅ BusinessInfo (스웨거 기준) - SELLER 사업자 인증
// ----------------------

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

// ----------------------
// ✅ Files
// ----------------------

export const uploadFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  return multipartApi.post<ApiResponseTemplate<string[]>>("/files", formData);
};

export const deleteFile = (fileName: string) => {
  return api.delete<ApiResponseTemplate<any>>("/files", { params: { fileName } });
};

// ----------------------
// ✅ Products / GroupPurchase (스웨거 기준)
// ----------------------

export type ProductCategory = "FOOD" | "NON_FOOD" | "CLOTHES";

export type ProductDetailDto = {
  id: number;
  category: ProductCategory;
  productName: string;
  price: number;
  stockQuantity: number;
  unitQuantity: number;
  imageUrl: string;
  descriptionTitle?: string;
  description?: string;
};

export const getProductById = (productId: number) => {
  return plain.get<ApiResponseTemplate<ProductDetailDto>>(`/api/products/${productId}`);
};

export type GroupPurchaseListItem = {
  id: number;
  regionName?: string;
  hostNickName?: string;
  hostBuyQuantity: number;
  targetQuantity: number;
  minimumOrderUnit: number;
  groupEndAt: string;
  pickupLocation: string;
  pickupAt: string;
  pickupAfterEnd?: boolean;
  currentQuantity?: number;
};

export const getGroupPurchasesByProductId = (productId: number) => {
  return plain.get<ApiResponseTemplate<GroupPurchaseListItem[]>>(`/api/products/${productId}/group-purchases`);
};

export type ProductCreateRequest = {
  category: ProductCategory;
  productName: string;
  price: number;
  stockQuantity: number;
  unitQuantity: number;
  imageUrl: string;
  descriptionTitle?: string;
  description?: string;
};

export const createProduct = (data: ProductCreateRequest) => {
  return api.post<ApiResponseTemplate<any>>("/api/products", data);
};

export type GroupPurchaseCreateRequest = {
  regionId: number;
  hostBuyQuantity: number;
  targetQuantity: number;
  minimumOrderUnit: number;
  groupEndAt: string;
  pickupLocation: string;
  pickupAt: string;
  pickupAfterEnd?: boolean;
};

export const createGroupPurchase = (productId: number, data: GroupPurchaseCreateRequest) => {
  return api.post<ApiResponseTemplate<any>>(`/api/products/${productId}/group-purchases`, data);
};

export default api;
