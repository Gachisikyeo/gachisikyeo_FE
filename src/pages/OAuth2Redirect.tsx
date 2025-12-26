// 회원가입 및 로그인 후 구글 OAuth2 리다이렉트 처리 페이지
// src/pages/OAuth2Redirect.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuthUser, saveTokens, setOAuth2SignupToken } from "../auth/authStorage";

function getParamFromSearchOrHash(key: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const fromSearch = searchParams.get(key);

  const hash = window.location.hash?.replace(/^#/, "") ?? "";
  const hashParams = new URLSearchParams(hash);
  const fromHash = hashParams.get(key);

  return fromSearch ?? fromHash;
}

function base64UrlToBase64(input: string) {
  return input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(base64UrlToBase64(payload));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function OAuth2Redirect() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("구글 로그인 처리 중...");

  useEffect(() => {
    const oauth2SignupToken = getParamFromSearchOrHash("oauth2SignupToken");
    const accessToken = getParamFromSearchOrHash("accessToken");
    const refreshToken = getParamFromSearchOrHash("refreshToken");

    if (oauth2SignupToken) {
      setOAuth2SignupToken(oauth2SignupToken);

      window.history.replaceState({}, document.title, window.location.pathname);

      navigate("/signup/google");
      return;
    }

    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken);

      const payload = decodeJwtPayload(accessToken) ?? {};

      saveAuthUser({
        isLoggedIn: true,
        userType: payload.userType ?? "BUYER",
        id: payload.id ?? payload.userId,
        email: payload.email ?? payload.sub,
        name: payload.name,
        nickName: payload.nickName,
        role: payload.role,
        authProvider: payload.authProvider,
        lawDong: payload.lawDong,
        marketName: payload.marketName,
      });

      window.history.replaceState({}, document.title, window.location.pathname);
      navigate("/");
      return;
    }

    setMsg("구글 로그인 정보를 찾지 못함");
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>{msg}</p>
    </div>
  );
}
