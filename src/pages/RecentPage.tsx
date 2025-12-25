// src/pages/RecentPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { logout } from "../api/api";

import G5 from "../assets/ex/G5.png";
import G6 from "../assets/ex/G6.png";
import G7 from "../assets/ex/G7.png";
import G8 from "../assets/ex/G8.png";

const base: Product[] = [
  { id: 5, title: "카누 미니 마일드 로스트 아메리카노", imageUrl: G5, minOrderQty: 20, singlePurchasePrice: 27000, priceFrom: 5400 },
  { id: 6, title: "소화가 잘되는 우유 190ml 48팩", imageUrl: G6, minOrderQty: 6, singlePurchasePrice: 38000, priceFrom: 4750 },
  { id: 7, title: "코카콜라 제로 캔 350ml 24개입", imageUrl: G7, minOrderQty: 6, singlePurchasePrice: 21000, priceFrom: 5250 },
  { id: 8, title: "햇반 황금 백미 210g 36개", imageUrl: G8, minOrderQty: 6, singlePurchasePrice: 36300, priceFrom: 6050 },
];

function RecentPage() {
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
    return expanded.sort((a, b) => b.id - a.id);
  }, []);

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
        <ProductSection title="" products={products} onClickViewMore={() => {}} showMinOrderQty />
      </main>
    </div>
  );
}

export default RecentPage;
