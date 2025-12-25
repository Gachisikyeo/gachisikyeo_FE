// 토큰/유저 저장/조회/초기화 전담 파일
// src/auth/authStorage.ts

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
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
  }
}

export function saveAuthUser(user: AuthUser) {
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
  } catch {
    // ignore
  }
}

export function setOAuth2SignupToken(token: string) {
  try {
    sessionStorage.setItem(OAUTH2_SIGNUP_TOKEN_KEY, token);
  } catch {
    // ignore
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
