// src/pages/Login.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "./Login.css";
import Logo from "../assets/logo2.png";
import { getGoogleAuthorizationUrl, login } from "../api/api";
import { saveAuthUser, saveTokens } from "../auth/authStorage";

export default function Login() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isEmailFilled = email.trim().length > 0;
  const isPasswordFilled = password.trim().length > 0;

  const canLogin = useMemo(
    () => isEmailFilled && isPasswordFilled,
    [isEmailFilled, isPasswordFilled]
  );

  const showMissingMsg = () => {
    if (!isEmailFilled && !isPasswordFilled)
      setErrorMsg("이메일과 비밀번호를 입력하세요.");
    else if (!isEmailFilled) setErrorMsg("이메일을 입력하세요.");
    else if (!isPasswordFilled) setErrorMsg("비밀번호를 입력하세요.");
    else setErrorMsg("");
  };

  const tryLogin = async () => {
    showMissingMsg();
    if (!canLogin) return;

    const ok = formRef.current?.reportValidity?.() ?? true;
    if (!ok) return;

    setErrorMsg("");

    try {
      const response = await login({ email, password });

      if (!response.data.success) {
        setErrorMsg(response.data.message || "로그인에 실패했습니다.");
        return;
      }

      const data = response.data.data;

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

      navigate("/");
    } catch (error) {
      console.error(error);
      setErrorMsg("로그인에 실패했습니다.");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tryLogin();
  };

  const onClickEmailSignup = () => {
    navigate("/signup/email");
  };

  const onClickGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = getGoogleAuthorizationUrl();
  };

  return (
    <div className="loginPage">
      <div className="loginWrap">
        <div className="loginLogo">
          {Logo ? (
            <img src={Logo} alt="같이시켜 로고" />
          ) : (
            <div className="loginLogo__placeholder">같이시켜</div>
          )}
        </div>

        <h2 className="loginTitle">로그인</h2>

        <form ref={formRef} className="loginForm" onSubmit={onSubmit}>
          <div className="inputRow">
            <FiMail className="inputIcon" />
            <input
              type="email"
              placeholder="ex)gachi09@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="inputRow">
            <FiLock className="inputIcon" />
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="current-password"
              required
            />
          </div>

          {errorMsg && <p className="loginError">{errorMsg}</p>}

          <div className="helperRow">
            <span>이메일로 가입하실 건가요?</span>
            <button
              type="button"
              className="emailSignupBtn"
              onClick={onClickEmailSignup}
            >
              이메일 회원가입
            </button>
          </div>

          <button
            type="button"
            className={`primaryBtn ${!canLogin ? "isDisabled" : ""}`}
            aria-disabled={!canLogin}
            onClick={tryLogin}
            disabled={!canLogin}
          >
            로그인
          </button>
        </form>

        <div className="snsArea">
          <div className="snsDivider">SNS 계정 간편 로그인</div>

          <button
            type="button"
            className="googleBtn"
            onClick={onClickGoogleLogin}
            disabled={isGoogleLoading}
            aria-disabled={isGoogleLoading}
          >
            <FcGoogle className="googleIcon" />
            {isGoogleLoading ? "구글 로그인 진행중..." : "구글 계정으로 로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}
