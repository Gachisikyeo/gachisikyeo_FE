// src/pages/NonFoodPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { logout } from "../api/api";

import G2 from "../assets/ex/G2.png";
import G5 from "../assets/ex/G5.png";
import G7 from "../assets/ex/G7.png";

const base: Product[] = [
  { id: 2, title: "핫타임 핫팩 군용 200매", imageUrl: G2, minOrderQty: 10, singlePurchasePrice: 64000, priceFrom: 3200 },
  { id: 5, title: "카누 미니 마일드 로스트 아메리카노", imageUrl: G5, minOrderQty: 20, singlePurchasePrice: 27000, priceFrom: 5400 },
  { id: 7, title: "코카콜라 제로 캔 350ml 24개입", imageUrl: G7, minOrderQty: 6, singlePurchasePrice: 21000, priceFrom: 5250 },
];

function NonFoodPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" });
      navigate("/");
    }
  };

  const products = useMemo(() => {
    const expanded = Array.from({ length: 20 }, (_, i) => {
      const p = base[i % base.length];
      return { ...p, id: p.id * 100 + i };
    });
    return expanded.sort((a, b) => a.priceFrom - b.priceFrom);
  }, []);

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
        <ProductSection title="" products={products} onClickViewMore={() => {}} />
      </main>
    </div>
  );
}

export default NonFoodPage;
