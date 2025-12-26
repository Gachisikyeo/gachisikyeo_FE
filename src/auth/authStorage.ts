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
