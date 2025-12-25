// 판매자 가입 완료 페이지  
import { useNavigate } from "react-router-dom";
import "./SellerAuthCompletePage.css";
import Logo from "../../assets/logo2.png";

export default function SellerAuthCompletePage() {
  const navigate = useNavigate();

  return (
    <div className="successPage">
      <div className="successWrap">
        <div className="successLogo">
          <img src={Logo} alt="같이시켜 로고" />
        </div>

        <h2 className="successTitle">가입 신청이 완료되었습니다</h2>
        <p className="successSub">
          판매자 가입 신청이 성공적으로 접수되었습니다.<br />
          관리자 검토 후 최종 승인이 완료되면 이메일로 알려드리겠습니다.<br />
          (평일 기준 1~3일 소요)
        </p>

        <button type="button" className="successBtn" onClick={() => navigate("/seller/dashboard")}>
          완료
        </button>
      </div>
    </div>
  );
}
