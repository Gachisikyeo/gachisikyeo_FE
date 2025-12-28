// src/pages/PopularPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getPopularProducts, logout, type PopularProductResponse } from "../api/api";

function toCardProduct(p: PopularProductResponse): Product {
  const unitPrice =
    (p as any).unitPrice ??
    ((p as any).unitQuantity ? Math.ceil(p.price / (p as any).unitQuantity) : p.price);

  return {
    id: p.productId,
    title: p.productName,
    imageUrl: p.imageUrl,
    minOrderQty: 1,
    singlePurchasePrice: p.price,
    priceFrom: unitPrice,
  };
}

function PopularPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await getPopularProducts({ page: 0, size: 12 });
        const items = res.data.data.items ?? [];
        setProducts(items.map(toCardProduct));
      } catch (e) {
        console.error("popular products fetch failed:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

  const handleClickProduct = (product: Product) => {
    navigate(`/products/${product.id}`, { state: { product } });
  };

  const sorted = useMemo(() => [...products].sort((a, b) => a.priceFrom - b.priceFrom), [products]);

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
        <ProductSection
          title=""
          products={sorted}
          onClickViewMore={() => {}}
          onClickProduct={handleClickProduct}
        />
        {loading && <div style={{ padding: "16px" }}>불러오는 중...</div>}
      </main>
    </div>
  );
}

export default PopularPage;
