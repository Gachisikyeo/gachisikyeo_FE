// 판매자 진입 페이지
// src/pages/seller/SellerEntry.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getAuthUser } from "../../auth/authStorage";
import { getMyBusinessInfo } from "../../api/api";

const SELLER_BIZ_DONE_KEY = "sellerBusinessInfoRegistered";

function SellerEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const user = getAuthUser();

      if (!user?.isLoggedIn) {
        navigate("/", { replace: true });
        return;
      }

      if (user.userType !== "SELLER") {
        navigate("/", { replace: true });
        return;
      }

      try {
        const res = await getMyBusinessInfo();

        if (res?.data?.success && res.data.data?.id) {
          navigate("/seller/dashboard", { replace: true });
          return;
        }

        navigate("/seller/auth", { replace: true });
        return;
      } catch (e: any) {
        
        const isDone = localStorage.getItem(SELLER_BIZ_DONE_KEY) === "true";
        if (isDone) navigate("/seller/dashboard", { replace: true });
        else navigate("/seller/auth", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return null;
}

export default SellerEntry;
