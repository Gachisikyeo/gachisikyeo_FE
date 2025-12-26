// 판매자 진입 페이지
// src/pages/seller/SellerEntry.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getAuthUser } from "../../auth/authStorage";
import { getMyBusinessInfo } from "../../api/api";

function SellerEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const user = getAuthUser();

      if (!user.isLoggedIn || user.userType !== "SELLER") {
        navigate("/", { replace: true });
        return;
      }

      try {
        await getMyBusinessInfo();
        navigate("/seller/dashboard", { replace: true });
      } catch (e: any) {
        const status = e?.response?.status;

        if (status === 404) {
          navigate("/seller/auth", { replace: true });
          return;
        }

        if (status === 401 || status === 403) {
          navigate("/", { replace: true });
          return;
        }

        navigate("/seller/auth", { replace: true });
      }
    };

    run();
  }, [navigate]);

  return null;
}

export default SellerEntry;
