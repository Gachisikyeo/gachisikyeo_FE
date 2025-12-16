import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import AddressModal from "../components/AddressModal";

import "./GoogleSignup.css";
import Logo from "../assets/logo.png";

type UserType = "SELLER" | "BUYER" | null;

export default function GoogleSignup() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [userType, setUserType] = useState<UserType>(null);
  const [nickName, setNickName] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [lawDongId, setLawDongId] = useState<number | null>(null);

  const [isAddrOpen, setIsAddrOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return userType !== null && nickName.trim().length > 0 && lawDongId !== null;
  }, [userType, nickName, lawDongId]);

  const showMissingMsg = () => {
    if (!userType) return setErrorMsg("판매자/구매자 중 하나를 선택하세요.");
    if (!nickName.trim()) return setErrorMsg("닉네임을 입력하세요.");
    if (!lawDongId) return setErrorMsg("지역을 선택하세요.");
    setErrorMsg("");
  };

  const trySubmit = () => {
    showMissingMsg();
    if (!canSubmit) return;

    const ok = formRef.current?.reportValidity?.() ?? true;
    if (!ok) return;

    setErrorMsg("");

    
    localStorage.setItem("signup_nickName", nickName);
    navigate("/signup/success", { state: { nickName } });

  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trySubmit();
  };

  return (
    <div className="signupPage">
      <div className="signupWrap">
        <div className="signupLogo">
          <img src={Logo} alt="같이시켜 로고" />
        </div>

        <h2 className="signupTitle">구글로 가입하기</h2>

        <div className="userTypeRow">
          <button
            type="button"
            className={`userTypeBtn ${userType === "SELLER" ? "active" : ""}`}
            onClick={() => {
              setUserType("SELLER");
              setErrorMsg("");
            }}
          >
            판매자
          </button>
          <button
            type="button"
            className={`userTypeBtn ${userType === "BUYER" ? "active" : ""}`}
            onClick={() => {
              setUserType("BUYER");
              setErrorMsg("");
            }}
          >
            구매자
          </button>
          <span className="userTypeSuffix">예요.</span>
        </div>

        <form ref={formRef} className="signupForm" onSubmit={onSubmit}>
          <div className="inputRow">
            <FiUser className="inputIcon" />
            <input
              type="text"
              placeholder="닉네임"
              value={nickName}
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
            onConfirm={({ label, lawDongId }) => {
              setAddressLabel(label);
              setLawDongId(lawDongId);
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
            가입하기
          </button>
        </form>
      </div>
    </div>
  );
}
