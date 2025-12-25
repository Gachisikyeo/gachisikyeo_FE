// 판매자 진입 페이지
// src/pages/seller/SellerEntry.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SELLER_BIZ_DONE_KEY = "sellerBusinessInfoRegistered"; // mock key

function SellerEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    // TODO(백엔드 연동): GET /api/business-info/me 또는 GET /api/users/me 결과로 분기하기
    const isDone = localStorage.getItem(SELLER_BIZ_DONE_KEY) === "true";

    if (isDone) navigate("/seller/dashboard", { replace: true });
    else navigate("/seller/auth", { replace: true });
  }, [navigate]);

  return null;
}

export default SellerEntry;
