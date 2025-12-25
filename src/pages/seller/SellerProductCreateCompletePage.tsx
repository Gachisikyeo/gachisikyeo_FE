// 판매자 상품 등록 완료 페이지
// src/pages/seller/SellerProductCreateCompletePage.tsx
import { useNavigate } from "react-router-dom";
import "./SellerAuthCompletePage.css";
import Logo from "../../assets/logo2.png";

export default function SellerProductCreateCompletePage() {
  const navigate = useNavigate();

  return (
    <div className="successPage">
      <div className="successWrap">
        <div className="successLogo">
          <img src={Logo} alt="같이시켜 로고" />
        </div>

        <h2 className="successTitle">상품이 정상적으로 등록되었습니다</h2>
        <p className="successSub">판매자 대시보드에서 상품을 확인해보세요</p>

        <button
          type="button"
          className="successBtn"
          onClick={() => navigate("/seller/dashboard")}
        >
          판매자 관리 페이지로
        </button>
      </div>
    </div>
  );
}
