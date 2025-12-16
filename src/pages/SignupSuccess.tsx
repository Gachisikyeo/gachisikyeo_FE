import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SignupSuccess.css";
import Logo from "../assets/logo.png";

type LocationState = {
  nickName?: string;
};

export default function SignupSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const nickName = useMemo(() => {
    const stateNick = (location.state as LocationState | null)?.nickName?.trim();
    if (stateNick) return stateNick;

    const stored = localStorage.getItem("signup_nickName")?.trim();
    if (stored) return stored;

    return "회원";
  }, [location.state]);

  return (
    <div className="successPage">
      <div className="successWrap">
        <div className="successLogo">
          <img src={Logo} alt="같이시켜 로고" />
        </div>

        <h2 className="successTitle">회원가입이 완료되었습니다</h2>
        <p className="successSub">
          <b className="successNick">{nickName}</b>님, 반갑습니다!
        </p>

        <button
          type="button"
          className="successBtn"
          onClick={() => navigate("/")}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
