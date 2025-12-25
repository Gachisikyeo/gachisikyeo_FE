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

    // ✅ 1) 신규 유저: oauth2SignupToken을 받고 구글 회원가입 페이지로 이동
    if (oauth2SignupToken) {
      setOAuth2SignupToken(oauth2SignupToken);

      // URL 토큰 흔적 제거
      window.history.replaceState({}, document.title, window.location.pathname);

      navigate("/signup/google");
      return;
    }

    // ✅ 2) 기존 유저: access/refresh 토큰 저장 후 홈으로
    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken);

      // 가능하면 accessToken(JWT)에서 유저 기본정보 뽑아서 저장 (백엔드가 user를 URL로 안 줘도 최소한 유지됨)
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

    // ✅ 둘 다 없으면 백엔드 리다이렉트 파라미터가 예상과 다른 것
    setMsg("구글 로그인 정보를 찾지 못했어 😭 백엔드 리다이렉트 파라미터를 확인해야 해.");
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>{msg}</p>
    </div>
  );
}
