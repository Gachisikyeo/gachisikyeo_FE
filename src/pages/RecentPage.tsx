// src/pages/RecentPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getProducts, logout, type ProductListResponse } from "../api/api";

function toCardProduct(p: ProductListResponse): Product {
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

const PAGE_SIZE = 12;

function RecentPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const fetchPage = async (nextPage: number, append: boolean) => {
    const res = await getProducts({ page: nextPage, size: PAGE_SIZE, sortKey: "CREATED_AT", direction: "DESC" });
    const data = res.data.data;

    const items = (data?.items ?? []).map(toCardProduct);

    setHasNext(!!data?.hasNext);
    setTotalElements(typeof data?.totalElements === "number" ? data.totalElements : null);

    if (!append) {
      setProducts(items);
      return;
    }

    setProducts((prev) => {
      const next = [...prev];
      const existing = new Set(prev.map((p) => p.id));
      items.forEach((p) => {
        if (!existing.has(p.id)) next.push(p);
      });
      return next;
    });
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchPage(0, false);
        setPage(0);
      } catch (e) {
        console.error("recent products fetch failed:", e);
        setProducts([]);
        setHasNext(false);
        setTotalElements(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || loading || !hasNext) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      await fetchPage(nextPage, true);
      setPage(nextPage);
    } catch (e) {
      console.error("recent products load more failed:", e);
    } finally {
      setLoadingMore(false);
    }
  };

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

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
        <ProductSection title="" products={products} onClickViewMore={() => {}} onClickProduct={handleClickProduct} />

        {loading && <div style={{ padding: "16px" }}>불러오는 중...</div>}

        {!loading && products.length === 0 && <div style={{ padding: "16px" }}>상품이 없어요</div>}

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          {hasNext && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: "20px 14px",
                borderRadius: "10px",
                border: "1px  rgba(0,0,0,0.15)",
                background: "white",
                cursor: loadingMore ? "not-allowed" : "pointer",
              }}
            >
              {loadingMore ? "불러오는 중..." : "더보기"}
            </button>
          )}

          {totalElements !== null && (
            <div style={{ fontSize: "12px", opacity: 0.7 , marginTop: 10}}>
              {products.length}/{totalElements}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default RecentPage;
