// // src/pages/GoogleSignup.tsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FiUser } from "react-icons/fi";
// import { HiOutlineLocationMarker } from "react-icons/hi";

// import Logo from "../assets/logo2.png";
// import AddressModal from "../components/AddressModal";
// import { oauth2Signup } from "../api/api";
// import {
//   clearOAuth2SignupToken,
//   getOAuth2SignupToken,
//   saveAuthUser,
//   saveTokens,
//   setOAuth2SignupToken,
// } from "../auth/authStorage";

// import "./GoogleSignup.css";

// type UserType = "SELLER" | "BUYER" | null;

// function getParamFromSearchOrHash(key: string) {
//   const searchParams = new URLSearchParams(window.location.search);
//   const fromSearch = searchParams.get(key);

//   const hash = window.location.hash?.replace(/^#/, "") ?? "";
//   const hashParams = new URLSearchParams(hash);
//   const fromHash = hashParams.get(key);

//   return fromSearch ?? fromHash;
// }

// export default function GoogleSignup() {
//   const navigate = useNavigate();
//   const formRef = useRef<HTMLFormElement | null>(null);

//   const [userType, setUserType] = useState<UserType>(null);
//   const [nickName, setNickName] = useState("");

//   const [addressLabel, setAddressLabel] = useState("");
//   const [lawCode, setLawCode] = useState<string | null>(null);

//   const [isAddrOpen, setIsAddrOpen] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");

//   useEffect(() => {
//     const token = getParamFromSearchOrHash("oauth2SignupToken");
//     if (token) setOAuth2SignupToken(token);
//   }, []);

//   const canSubmit = useMemo(() => {
//     return userType !== null && nickName.trim().length > 0 && !!lawCode?.trim();
//   }, [userType, nickName, lawCode]);

//   const showMissingMsg = () => {
//     if (!userType) return setErrorMsg("판매자/구매자 중 하나를 선택하세요.");
//     if (!nickName.trim()) return setErrorMsg("닉네임을 입력하세요.");
//     if (!lawCode?.trim()) return setErrorMsg("지역을 선택하세요.");
//     setErrorMsg("");
//   };

//   const trySubmit = async () => {
//     showMissingMsg();
//     if (!canSubmit) return;

//     const ok = formRef.current?.reportValidity?.() ?? true;
//     if (!ok) return;

//     const oauth2SignupToken = getOAuth2SignupToken();
//     if (!oauth2SignupToken) {
//       setErrorMsg("oauth2SignupToken이 없어요. 구글 로그인부터 다시 해주세요.");
//       return;
//     }

//     try {
//       const res = await oauth2Signup({
//         oauth2SignupToken,
//         nickName: nickName.trim(),
//         userType: userType!,
//         lawDongId: lawCode!,
//       });

//       if (!res.data?.success) {
//         setErrorMsg(res.data?.message || "구글 회원가입에 실패했습니다.");
//         return;
//       }

//       const data = res.data.data;

//       saveTokens(data.accessToken, data.refreshToken);

//       saveAuthUser({
//         isLoggedIn: true,
//         userType: data.userType,
//         id: data.id,
//         email: data.email,
//         name: data.name,
//         nickName: data.nickName,
//         role: data.role,
//         authProvider: data.authProvider,
//         lawDong: data.lawDong,
//       });

//       clearOAuth2SignupToken();
//       navigate("/");
//     } catch (e: any) {
//       console.error(e);
//       setErrorMsg(e?.response?.data?.message || "구글 회원가입에 실패했습니다.");
//     }
//   };

//   return (
//     <div className="signupPage">
//       <div className="signupWrap">
//         <div className="signupLogo">
//           <img src={Logo} alt="같이시켜 로고" />
//         </div>

//         <h2 className="signupTitle">구글 회원가입</h2>

//         <div className="userTypeRow">
//           <label className="userTypeOption">
//             <input
//               type="checkbox"
//               checked={userType === "BUYER"}
//               onChange={(e) => {
//                 setUserType(e.target.checked ? "BUYER" : null);
//                 setErrorMsg("");
//               }}
//             />
//             <span>일반 구매자</span>
//           </label>

//           <label className="userTypeOption">
//             <input
//               type="checkbox"
//               checked={userType === "SELLER"}
//               onChange={(e) => {
//                 setUserType(e.target.checked ? "SELLER" : null);
//                 setErrorMsg("");
//               }}
//             />
//             <span>판매자</span>
//           </label>

//           <span className="userTypeSuffix">로 가입할게요.</span>
//         </div>

//         <form ref={formRef} className="signupForm" onSubmit={(e) => e.preventDefault()}>
//           <div className="inputRow">
//             <FiUser className="inputIcon" />
//             <input
//               type="text"
//               placeholder="닉네임"
//               value={nickName}
//               required
//               onChange={(e) => {
//                 setNickName(e.target.value);
//                 setErrorMsg("");
//               }}
//               autoComplete="nickname"
//             />
//           </div>

//           <div className="inputRow">
//             <HiOutlineLocationMarker className="inputIcon" />
//             <input
//               type="text"
//               placeholder="지역설정"
//               value={addressLabel}
//               readOnly
//               onClick={() => setIsAddrOpen(true)}
//             />
//           </div>

//           <AddressModal
//             isOpen={isAddrOpen}
//             onClose={() => setIsAddrOpen(false)}
//             onConfirm={(payload: any) => {
//               const code = payload?.lawCode ?? payload?.lawDongId;
//               setAddressLabel(payload?.label ?? "");
//               setLawCode(code != null ? String(code) : null);
//               setErrorMsg("");
//             }}
//           />

//           {errorMsg && <p className="signupError">{errorMsg}</p>}

//           <button
//             type="button"
//             className={`primaryBtn ${!canSubmit ? "isDisabled" : ""}`}
//             aria-disabled={!canSubmit}
//             onClick={trySubmit}
//           >
//             가입 완료
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";

import Logo from "../assets/logo2.png";
import AddressModal from "../components/AddressModal";
import { oauth2Signup } from "../api/api";
import {
  clearOAuth2SignupToken,
  getOAuth2SignupToken,
  saveAuthUser,
  saveTokens,
  setOAuth2SignupToken,
} from "../auth/authStorage";

import "./GoogleSignup.css";

type UserType = "SELLER" | "BUYER" | null;

function getParamFromSearchOrHash(key: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const fromSearch = searchParams.get(key);

  const hash = window.location.hash?.replace(/^#/, "") ?? "";
  const hashParams = new URLSearchParams(hash);
  const fromHash = hashParams.get(key);

  return fromSearch ?? fromHash;
}

export default function GoogleSignup() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [userType, setUserType] = useState<UserType>(null);
  const [nickName, setNickName] = useState("");

  const [addressLabel, setAddressLabel] = useState("");
  const [lawCode, setLawCode] = useState<string | null>(null);

  const [isAddrOpen, setIsAddrOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = getParamFromSearchOrHash("oauth2SignupToken");
    if (token) setOAuth2SignupToken(token);
  }, []);

  const canSubmit = useMemo(() => {
    return userType !== null && nickName.trim().length > 0 && !!lawCode?.trim();
  }, [userType, nickName, lawCode]);

  const showMissingMsg = () => {
    if (!userType) return setErrorMsg("판매자/구매자 중 하나를 선택하세요.");
    if (!nickName.trim()) return setErrorMsg("닉네임을 입력하세요.");
    if (!lawCode?.trim()) return setErrorMsg("지역을 선택하세요.");
    setErrorMsg("");
  };

  const trySubmit = async () => {
    showMissingMsg();
    if (!canSubmit) return;

    const ok = formRef.current?.reportValidity?.() ?? true;
    if (!ok) return;

    const oauth2SignupToken = getOAuth2SignupToken();
    if (!oauth2SignupToken) {
      setErrorMsg("oauth2SignupToken이 없어요. 구글 로그인부터 다시 해주세요.");
      return;
    }

    try {
      const res = await oauth2Signup({
        oauth2SignupToken,
        nickName: nickName.trim(),
        userType: userType!,
        lawDongId: lawCode!,
      });

      if (!res.data?.success) {
        setErrorMsg(res.data?.message || "구글 회원가입에 실패했습니다.");
        return;
      }

      const data = res.data.data;

      saveTokens(data.accessToken, data.refreshToken);

      saveAuthUser({
        isLoggedIn: true,
        userType: data.userType,
        id: data.id,
        email: data.email,
        name: data.name,
        nickName: data.nickName,
        role: data.role,
        authProvider: data.authProvider,
        lawDong: data.lawDong,
      });

      clearOAuth2SignupToken();
      navigate("/");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.response?.data?.message || "구글 회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="signupPage">
      <div className="signupWrap">
        <div className="signupLogo">
          <img src={Logo} alt="같이시켜 로고" />
        </div>

        <h2 className="signupTitle">구글 회원가입</h2>

        <div className="userTypeRow">
          <label className="userTypeOption">
            <input
              type="checkbox"
              checked={userType === "BUYER"}
              onChange={(e) => {
                setUserType(e.target.checked ? "BUYER" : null);
                setErrorMsg("");
              }}
            />
            <span>일반 구매자</span>
          </label>

          <label className="userTypeOption">
            <input
              type="checkbox"
              checked={userType === "SELLER"}
              onChange={(e) => {
                setUserType(e.target.checked ? "SELLER" : null);
                setErrorMsg("");
              }}
            />
            <span>판매자</span>
          </label>

          <span className="userTypeSuffix">로 가입할게요.</span>
        </div>

        <form ref={formRef} className="signupForm" onSubmit={(e) => e.preventDefault()}>
          <div className="inputRow">
            <FiUser className="inputIcon" />
            <input
              type="text"
              placeholder="닉네임"
              value={nickName}
              required
              onChange={(e) => {
                setNickName(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="nickname"
            />
          </div>

          <div className="inputRow">
            <HiOutlineLocationMarker className="inputIcon" />
            <input
              type="text"
              placeholder="지역설정"
              value={addressLabel}
              readOnly
              onClick={() => setIsAddrOpen(true)}
            />
          </div>

          <AddressModal
            isOpen={isAddrOpen}
            onClose={() => setIsAddrOpen(false)}
            onConfirm={(payload: any) => {
              const code = payload?.lawCode ?? payload?.lawDongId;
              setAddressLabel(payload?.label ?? "");
              setLawCode(code != null ? String(code) : null);
              setErrorMsg("");
            }}
          />

          {errorMsg && <p className="signupError">{errorMsg}</p>}

          <button
            type="button"
            className={`primaryBtn ${!canSubmit ? "isDisabled" : ""}`}
            aria-disabled={!canSubmit}
            onClick={trySubmit}
          >
            가입 완료
          </button>
        </form>
      </div>
    </div>
  );
}
