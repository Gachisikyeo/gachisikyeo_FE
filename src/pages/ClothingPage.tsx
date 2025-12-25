// src/pages/ClothingPage.tsx
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
  { id: 101, title: "의류 샘플 1", imageUrl: G1, minOrderQty: 1, singlePurchasePrice: 15000, priceFrom: 7000 },
  { id: 102, title: "의류 샘플 2", imageUrl: G2, minOrderQty: 1, singlePurchasePrice: 20000, priceFrom: 9000 },
  { id: 103, title: "의류 샘플 3", imageUrl: G3, minOrderQty: 1, singlePurchasePrice: 30000, priceFrom: 12000 },
  { id: 104, title: "의류 샘플 4", imageUrl: G4, minOrderQty: 1, singlePurchasePrice: 10000, priceFrom: 5000 },
];

function ClothingPage() {
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

export default ClothingPage;
