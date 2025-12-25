// 
// src/pages/OAuth2Redirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearOAuth2SignupToken,
  saveAuthUser,
  saveTokens,
  setOAuth2SignupToken,
  type AuthUser,
} from "../auth/authStorage";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value)) as T;
    } catch {
      return null;
    }
  }
}

function getParam(name: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return searchParams.get(name) || hashParams.get(name);
}

type RedirectData = {
  accessToken?: string;
  refreshToken?: string;
  userType?: "BUYER" | "SELLER";
  nickName?: string;
  marketName?: string;
  role?: string;
  authProvider?: string;
  id?: number;
  email?: string;
  name?: string;
  lawDong?: {
    id: number;
    lawCode?: string;
    sido: string;
    sigungu: string;
    dong: string;
  };
};

export default function OAuth2Redirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const oauth2SignupToken = getParam("oauth2SignupToken");
    if (oauth2SignupToken) {
      setOAuth2SignupToken(oauth2SignupToken); // sessionStorage 저장
      navigate("/signup/google", { replace: true });
      return;
    }

    const dataObj = safeJsonParse<RedirectData>(getParam("data"));

    const accessToken =
      dataObj?.accessToken ?? getParam("accessToken") ?? getParam("token");
    const refreshToken =
      dataObj?.refreshToken ?? getParam("refreshToken");

    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken);
      clearOAuth2SignupToken(); 

      const userType = dataObj?.userType ?? (getParam("userType") as "BUYER" | "SELLER" | null);
      const nickName = dataObj?.nickName ?? getParam("nickName") ?? undefined;

      const finalUserType: "BUYER" | "SELLER" =
        userType === "SELLER" ? "SELLER" : "BUYER";

      const authUser: AuthUser = {
        isLoggedIn: true,
        userType: finalUserType,

        id: dataObj?.id,
        email: dataObj?.email,
        name: dataObj?.name,
        nickName,

        role: dataObj?.role,
        authProvider: dataObj?.authProvider,
        lawDong: dataObj?.lawDong,

        marketName: dataObj?.marketName,
      };

      saveAuthUser(authUser);

      const next = getParam("next") || "/";
      navigate(next, { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      구글 로그인 처리 중… 잠시만 기다려주세요
    </div>
  );
}
