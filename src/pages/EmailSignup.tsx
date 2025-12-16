// src/pages/EmailSignup.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import AddressModal from "../components/AddressModal";
import Terms1Modal from "../components/Terms1Modal";
import Terms2Modal from "../components/Terms2Modal";


import "./EmailSignup.css";

import Logo from "../assets/logo.png"; 

type userType = "SELLER" | "BUYER" | null;

export default function EmailSignup() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [userType, setuserType] = useState<userType>(null);

  const [email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  const [nickName, setnickName] = useState("");
  // const [lawDongId, setlawDongId] = useState("");

  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [isTerms1Open, setIsTerms1Open] = useState(false);
  const [isTerms2Open, setIsTerms2Open] = useState(false);


  const [errorMsg, setErrorMsg] = useState("");
  const [addressLabel, setAddressLabel] = useState(""); 
  const [lawDongId, setLawDongId] = useState<number | null>(null);
  const [isAddrOpen, setIsAddrOpen] = useState(false);
``

  const canSubmit = useMemo(() => {
    return (
      userType !== null &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      nickName.trim().length > 0 &&
      lawDongId !== null &&   
      agree1 &&
      agree2
    );
  }, [userType, email, password, nickName, lawDongId, agree1, agree2]);

  const showMissingMsg = () => {
    if (!userType) return setErrorMsg("판매자/구매자 중 하나를 선택하세요.");
    if (!email.trim()) return setErrorMsg("이메일을 입력하세요.");
    if (!password.trim()) return setErrorMsg("비밀번호를 입력하세요.");
    if (!nickName.trim()) return setErrorMsg("닉네임을 입력하세요.");
    if (!lawDongId) return setErrorMsg("지역을 선택하세요.");
    if (!agree1 || !agree2) return setErrorMsg("약관에 동의해주세요.");
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

        <h2 className="signupTitle">이메일로 가입하기</h2>

        <div className="userTypeRow">
          <button
            type="button"
            className={`userTypeBtn ${userType === "SELLER" ? "active" : ""}`}
            onClick={() => {
              setuserType("SELLER");
              setErrorMsg("");
            }}
          >
            판매자
          </button>
          <button
            type="button"
            className={`userTypeBtn ${userType === "BUYER" ? "active" : ""}`}
            onClick={() => {
              setuserType("BUYER");
              setErrorMsg("");
            }}
          >
            구매자
          </button>
          <span className="userTypeSuffix">예요.</span>
        </div>

        <form ref={formRef} className="signupForm" onSubmit={onSubmit}>
          <div className="inputRow">
            <FiMail className="inputIcon" />
            <input
              type="email"
              placeholder="이메일"
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
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setpassword(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="new-password"
            />
          </div>

          <div className="inputRow">
            <FiUser className="inputIcon" />
            <input
              type="text"
              placeholder="닉네임"
              value={nickName}
              onChange={(e) => {
                setnickName(e.target.value);
                setErrorMsg("");
              }}
              autoComplete="nickName"
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


          <div className="termsBox">
            <div className="termsTitle">약관동의</div>

            <div className="termsRow">
              <label className="termsLeft">
                <input
                  type="checkbox"
                  checked={agree1}
                  onChange={(e) => {
                    setAgree1(e.target.checked);
                    setErrorMsg("");
                  }}
                />
                <span>약관에 동의하십니까?</span>
              </label>
              <button
                type="button"
                className="termsViewBtn"
                onClick={() => setIsTerms1Open(true)}
              >
                내용보기
              </button>
            </div>

            <div className="termsRow">
              <label className="termsLeft">
                <input
                  type="checkbox"
                  checked={agree2}
                  onChange={(e) => {
                    setAgree2(e.target.checked);
                    setErrorMsg("");
                  }}
                />
                <span>약관에 동의하십니까?</span>
              </label>
              <button
                type="button"
                className="termsViewBtn"
                onClick={() => setIsTerms2Open(true)}
              >
                내용보기
              </button>
            </div>
          </div>
          <Terms1Modal isOpen={isTerms1Open} onClose={() => setIsTerms1Open(false)} />
          <Terms2Modal isOpen={isTerms2Open} onClose={() => setIsTerms2Open(false)} />


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
