// src/pages/PopularPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { logout } from "../api/api";

import G1 from "../assets/ex/G1.png";
import G2 from "../assets/ex/G2.png";
import G3 from "../assets/ex/G3.png";
import G4 from "../assets/ex/G4.png";

const base: Product[] = [
  { id: 1, title: "상하키친 포크카레 170g 12팩", imageUrl: G1, minOrderQty: 3, singlePurchasePrice: 16000, priceFrom: 4000 },
  { id: 2, title: "핫타임 핫팩 군용 200매", imageUrl: G2, minOrderQty: 10, singlePurchasePrice: 64000, priceFrom: 3200 },
  { id: 3, title: "샤인머스켓 4kg (4송이)", imageUrl: G3, minOrderQty: 1, singlePurchasePrice: 20000, priceFrom: 5000 },
  { id: 4, title: "아침의 쑥떡 40개입", imageUrl: G4, minOrderQty: 5, singlePurchasePrice: 56000, priceFrom: 7000 },
];

function PopularPage() {
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

export default PopularPage;
