// 토큰/유저 저장/조회/초기화 전담 파일

export type UserType = "GUEST" | "BUYER" | "SELLER";

export type LawDong = {
  id: number;
  lawCode?: string;
  sido: string;
  sigungu: string;
  dong: string;
};

export type AuthUser = {
  isLoggedIn: boolean;
  userType: UserType;

  id?: number;
  email?: string;
  name?: string;
  nickName?: string;
  role?: string;
  authProvider?: string;

  lawDong?: LawDong;

  marketName?: string;
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";
const OAUTH2_SIGNUP_TOKEN_KEY = "oauth2SignupToken";

const LEGACY_LOCAL_KEYS = [
  "devUserRole",
  "userType",
  "signup_nickName",
  "sellerBusinessInfoData",
  "sellerBusinessInfoRegistered",
  "gachi_my_orders_v1",
];

function removeLocalKeys(keys: string[]) {
  try {
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
  }
}

function cleanupLegacyOnLoginSave() {
  removeLocalKeys(["devUserRole", "userType", "signup_nickName"]);
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  cleanupLegacyOnLoginSave();
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
  }
}

export function saveAuthUser(user: AuthUser) {
  cleanupLegacyOnLoginSave();
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
  }
}

export function getAuthUser(): AuthUser {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return { isLoggedIn: false, userType: "GUEST" };
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.isLoggedIn) return { isLoggedIn: false, userType: "GUEST" };
    return parsed;
  } catch {
    return { isLoggedIn: false, userType: "GUEST" };
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    removeLocalKeys(LEGACY_LOCAL_KEYS);
  } catch {
  }

  clearOAuth2SignupToken();
}

export function setOAuth2signupToken(token: string) {
  setOAuth2SignupToken(token);
}

export function setOAuth2SignupToken(token: string) {
  try {
    sessionStorage.setItem(OAUTH2_SIGNUP_TOKEN_KEY, token);
  } catch {
  }
}

export function getOAuth2SignupToken(): string | null {
  try {
    return sessionStorage.getItem(OAUTH2_SIGNUP_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearOAuth2SignupToken() {
  try {
    sessionStorage.removeItem(OAUTH2_SIGNUP_TOKEN_KEY);
  } catch {
  }
}
function decodeJwtPayload(token: string): any | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function pickUserTypeFromPayload(payload: any): UserType {
  const candidates = [
    payload?.userType,
    payload?.role,
    payload?.roles,
    payload?.Role,
    payload?.authorities,
  ];

  const s = candidates
    .flatMap((v: any) => (Array.isArray(v) ? v : [v]))
    .filter((v: any) => v != null)
    .map((v: any) => String(v).toUpperCase())
    .join(",");

  if (s.includes("SELLER")) return "SELLER";
  if (s.includes("BUYER")) return "BUYER";
  if (s.includes("USER")) return "BUYER";
  return "BUYER";
}

export function initAuthFromOAuthRedirect(): boolean {
  try {
    const rawHash = window.location.hash?.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!rawHash) return false;

    const params = new URLSearchParams(rawHash);
    const accessToken = params.get("accessToken") ?? "";
    const refreshToken = params.get("refreshToken") ?? "";

    if (!accessToken && !refreshToken) return false;

    if (accessToken || refreshToken) {
      saveTokens(accessToken || getAccessToken() || "", refreshToken || getRefreshToken() || "");
    }

    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      const userType = pickUserTypeFromPayload(payload);
      const id = payload?.sub != null ? Number(payload.sub) : undefined;

      saveAuthUser({
        isLoggedIn: true,
        userType,
        id: Number.isFinite(id as number) ? (id as number) : undefined,
      });
    }

    window.history.replaceState({}, "", window.location.pathname + window.location.search);
    return true;
  } catch {
    return false;
  }
}
