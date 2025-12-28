// 메인페이지
// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPopularProducts, getProducts, logout, type ProductListResponse, type PopularProductResponse } from "../api/api";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import AdBanner from "../components/AdBanner";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
// import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { clearAuth, getAuthUser, initAuthFromOAuthRedirect, type AuthUser } from "../auth/authStorage";

import { getMypageProfile } from "../api/api";


function toCardProductFromList(p: ProductListResponse): Product {
  const unitPrice = p.unitPrice ?? (p.unitQuantity ? Math.ceil(p.price / p.unitQuantity) : p.price);

  return {
    id: p.id,
    title: p.productName,
    imageUrl: p.imageUrl,
    minOrderQty: 1,
    singlePurchasePrice: p.price,
    priceFrom: unitPrice,
  };
}

function toCardProductFromPopular(p: PopularProductResponse): Product {
  return {
    id: p.productId,
    title: p.productName,
    imageUrl: p.imageUrl,
    minOrderQty: 1,
    singlePurchasePrice: p.price,
    priceFrom: p.price,
  };
}

function Home() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();

  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // useEffect(() => {
  //   setUser(getAuthUser());
  // }, []);
  useEffect(() => {
    const initUser = async () => {
      const redirected = initAuthFromOAuthRedirect();

      const cur = getAuthUser();
      setUser(cur);

      if (cur.isLoggedIn && (redirected || !cur.nickName || !cur.lawDong?.dong)) {
        try {
          await getMypageProfile();
        } catch {}
        setUser(getAuthUser());
      }
    };

    initUser();
  }, []);



  useEffect(() => {
    const fetchPopular = async () => {
      setLoadingPopular(true);
      try {
        const res = await getPopularProducts({ page: 0, size: 4 });
        const items = res.data.data.items ?? [];
        setPopularProducts(items.map(toCardProductFromPopular));
      } catch (e) {
        console.error("popular products fetch failed:", e);
        setPopularProducts([]);
      } finally {
        setLoadingPopular(false);
      }
    };

    const fetchRecent = async () => {
      setLoadingRecent(true);
      try {
        const res = await getProducts({ page: 0, size: 4, sortKey: "CREATED_AT", direction: "DESC" });
        const items = res.data.data.items ?? [];
        setRecentProducts(items.map(toCardProductFromList));
      } catch (e) {
        console.error("recent products fetch failed:", e);
        setRecentProducts([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchPopular();
    fetchRecent();
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
        {loadingPopular && <div style={{ padding: "16px" }}>불러오는 중...</div>}

        <ProductSection
          title="최근 올라온 공동구매 제안"
          products={recentProducts}
          onClickViewMore={handleClickRecentMore}
          showMinOrderQty={true}
          onClickProduct={handleClickProduct}
        />
        {loadingRecent && <div style={{ padding: "16px" }}>불러오는 중...</div>}
      </main>
    </div>
  );
}

export default Home;
