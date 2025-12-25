// // 
// // src/pages/OAuth2Redirect.tsx
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   clearOAuth2SignupToken,
//   saveAuthUser,
//   saveTokens,
//   setOAuth2SignupToken,
//   type AuthUser,
// } from "../auth/authStorage";

// function safeJsonParse<T>(value: string | null): T | null {
//   if (!value) return null;
//   try {
//     return JSON.parse(value) as T;
//   } catch {
//     try {
//       return JSON.parse(decodeURIComponent(value)) as T;
//     } catch {
//       return null;
//     }
//   }
// }

// function getParam(name: string) {
//   const searchParams = new URLSearchParams(window.location.search);
//   const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
//   return searchParams.get(name) || hashParams.get(name);
// }

// type RedirectData = {
//   accessToken?: string;
//   refreshToken?: string;
//   userType?: "BUYER" | "SELLER";
//   nickName?: string;
//   marketName?: string;
//   role?: string;
//   authProvider?: string;
//   id?: number;
//   email?: string;
//   name?: string;
//   lawDong?: {
//     id: number;
//     lawCode?: string;
//     sido: string;
//     sigungu: string;
//     dong: string;
//   };
// };

// export default function OAuth2Redirect() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const oauth2SignupToken = getParam("oauth2SignupToken");
//     if (oauth2SignupToken) {
//       setOAuth2SignupToken(oauth2SignupToken); // sessionStorage 저장
//       navigate("/signup/google", { replace: true });
//       return;
//     }

//     const dataObj = safeJsonParse<RedirectData>(getParam("data"));

//     const accessToken =
//       dataObj?.accessToken ?? getParam("accessToken") ?? getParam("token");
//     const refreshToken =
//       dataObj?.refreshToken ?? getParam("refreshToken");

//     if (accessToken && refreshToken) {
//       saveTokens(accessToken, refreshToken);
//       clearOAuth2SignupToken(); 

//       const userType = dataObj?.userType ?? (getParam("userType") as "BUYER" | "SELLER" | null);
//       const nickName = dataObj?.nickName ?? getParam("nickName") ?? undefined;

//       const finalUserType: "BUYER" | "SELLER" =
//         userType === "SELLER" ? "SELLER" : "BUYER";

//       const authUser: AuthUser = {
//         isLoggedIn: true,
//         userType: finalUserType,

//         id: dataObj?.id,
//         email: dataObj?.email,
//         name: dataObj?.name,
//         nickName,

//         role: dataObj?.role,
//         authProvider: dataObj?.authProvider,
//         lawDong: dataObj?.lawDong,

//         marketName: dataObj?.marketName,
//       };

//       saveAuthUser(authUser);

//       const next = getParam("next") || "/";
//       navigate(next, { replace: true });
//       return;
//     }

//     navigate("/login", { replace: true });
//   }, [navigate]);

//   return (
//     <div style={{ padding: 24 }}>
//       구글 로그인 처리 중… 잠시만 기다려주세요
//     </div>
//   );
// }
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
