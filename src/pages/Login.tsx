// src/pages/Login.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "./Login.css";
import Logo from "../assets/logo.png";


export default function Login() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isEmailFilled = email.trim().length > 0;
  const ispasswordFilled = password.trim().length > 0;

  const canLogin = useMemo(() => isEmailFilled && ispasswordFilled, [isEmailFilled, ispasswordFilled]);

  const showMissingMsg = () => {
    if (!isEmailFilled && !ispasswordFilled) setErrorMsg("이메일과 비밀번호를 입력하세요.");
    else if (!isEmailFilled) setErrorMsg("이메일을 입력하세요.");
    else if (!ispasswordFilled) setErrorMsg("비밀번호를 입력하세요.");
    else setErrorMsg("");
  };

  const tryLogin = () => {
    // 빈칸이면 빨간 에러 문구
    showMissingMsg();
    if (!canLogin) return;

    // 메일 형식 틀리면 경고
    const ok = formRef.current?.reportValidity?.() ?? true;
    if (!ok) return;

    setErrorMsg("");
    navigate("/");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tryLogin();
  };

  const onClickEmailSignup = () => {
  navigate("/signup/email");
  };

  const onClickGoogleLogin = () => {
  navigate("/signup/google");
  };

  return (
    <div className="loginPage">
      <div className="loginWrap">
        <div className="loginLogo">
          {Logo ? <img src={Logo} alt="같이시켜 로고" /> : 
          <div className="loginLogo__placeholder">같이시켜</div>}
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
            />
          </div>

          <div className="inputRow">
            <FiLock className="inputIcon" />
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => {
                setpassword(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="current-password"
            />
          </div>

          {errorMsg && <p className="loginError">{errorMsg}</p>}

          <div className="helperRow">
            <span>이메일로 가입하실 건가요?</span>
            <button type="button" className="emailSignupBtn" onClick={onClickEmailSignup}>
              이메일 회원가입
            </button>
          </div>

          <button
            type="button"
            className={`primaryBtn ${!canLogin ? "isDisabled" : ""}`}
            aria-disabled={!canLogin}
            onClick={tryLogin}
          >
            로그인
          </button>
        </form>
        

        <div className="snsArea">
          <div className="snsDivider">SNS 계정 간편 로그인</div>

          <button type="button" className="googleBtn" onClick={onClickGoogleLogin}>
            <FcGoogle className="googleIcon" />
            구글 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
