// 메인페이지
// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/api";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import AdBanner from "../components/AdBanner";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";

import G1 from "../assets/ex/G1.png";
import G2 from "../assets/ex/G2.png";
import G3 from "../assets/ex/G3.png";
import G4 from "../assets/ex/G4.png";
import G5 from "../assets/ex/G5.png";
import G6 from "../assets/ex/G6.png";
import G7 from "../assets/ex/G7.png";
import G8 from "../assets/ex/G8.png";

// 현재 인기있는 상품
const popularProducts: Product[] = [
  { id: 1, title: "상하키친 포크카레 170g 12팩", imageUrl: G1, minOrderQty: 3, singlePurchasePrice: 16000, priceFrom: 4000 },
  { id: 2, title: "핫타임 핫팩 군용 200매", imageUrl: G2, minOrderQty: 10, singlePurchasePrice: 64000, priceFrom: 3200 },
  { id: 3, title: "샤인머스켓 4kg (4송이)", imageUrl: G3, minOrderQty: 1, singlePurchasePrice: 20000, priceFrom: 5000 },
  { id: 4, title: "아침의 쑥떡 40개입", imageUrl: G4, minOrderQty: 5, singlePurchasePrice: 56000, priceFrom: 7000 },
];

// 최근 올라온 공동구매 제안
const recentProducts: Product[] = [
  { id: 5, title: "카누 미니 마일드 로스트 아메리카노", imageUrl: G5, minOrderQty: 20, singlePurchasePrice: 27000, priceFrom: 5400 },
  { id: 6, title: "소화가 잘되는 우유 190ml 48팩", imageUrl: G6, minOrderQty: 6, singlePurchasePrice: 38000, priceFrom: 4750 },
  { id: 7, title: "코카콜라 제로 캔 350ml 24개입", imageUrl: G7, minOrderQty: 6, singlePurchasePrice: 21000, priceFrom: 5250 },
  { id: 8, title: "햇반 황금 백미 210g 36개", imageUrl: G8, minOrderQty: 6, singlePurchasePrice: 36300, priceFrom: 6050 },
];

function Home() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const handleClickPopularMore = () => navigate("/popular");
  const handleClickRecentMore = () => navigate("/recent");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("logout failed:", error);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" });
      navigate("/");
    }
  };

  const handleClickProduct = (product: Product) => {
    navigate(`/products/${product.id}`, { state: { product } }); 
  };


  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout" style={{ paddingBottom: "40px" }}>
        <AdBanner />

        <ProductSection
          title="현재 인기있는 상품"
          products={popularProducts}
          onClickViewMore={handleClickPopularMore}
          showMinOrderQty={false}
          onClickProduct={handleClickProduct}
        />

        <ProductSection
          title="최근 올라온 공동구매 제안"
          products={recentProducts}
          onClickViewMore={handleClickRecentMore}
          showMinOrderQty={true}
          onClickProduct={handleClickProduct}
          />
      </main>
    </div>
  );
  
}

export default Home;
