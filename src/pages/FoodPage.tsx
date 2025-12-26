// // src/pages/FoodPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import CategoryNav from "../components/CategoryNav";
// import ProductSection from "../components/ProductSection";

// import type { Product } from "../components/ProductCard";
// import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
// import { logout } from "../api/api";

// import G1 from "../assets/ex/G1.png";
// import G3 from "../assets/ex/G3.png";
// import G4 from "../assets/ex/G4.png";
// import G6 from "../assets/ex/G6.png";
// import G8 from "../assets/ex/G8.png";

// const base: Product[] = [
//   { id: 1, title: "상하키친 포크카레 170g 12팩", imageUrl: G1, minOrderQty: 3, singlePurchasePrice: 16000, priceFrom: 4000 },
//   { id: 3, title: "샤인머스켓 4kg (4송이)", imageUrl: G3, minOrderQty: 1, singlePurchasePrice: 20000, priceFrom: 5000 },
//   { id: 4, title: "아침의 쑥떡 40개입", imageUrl: G4, minOrderQty: 5, singlePurchasePrice: 56000, priceFrom: 7000 },
//   { id: 6, title: "소화가 잘되는 우유 190ml 48팩", imageUrl: G6, minOrderQty: 6, singlePurchasePrice: 38000, priceFrom: 4750 },
//   { id: 8, title: "햇반 황금 백미 210g 36개", imageUrl: G8, minOrderQty: 6, singlePurchasePrice: 36300, priceFrom: 6050 },
// ];

// function FoodPage() {
//   const [user, setUser] = useState<AuthUser>(() => getAuthUser());
//   const navigate = useNavigate();

//   useEffect(() => {
//     setUser(getAuthUser());
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await logout();
//     } catch (e) {
//       console.error("logout failed:", e);
//     } finally {
//       clearAuth();
//       setUser({ isLoggedIn: false, userType: "GUEST" });
//       navigate("/");
//     }
//   };

//   const products = useMemo(() => {
//     const expanded = Array.from({ length: 20 }, (_, i) => {
//       const p = base[i % base.length];
//       return { ...p, id: p.id * 100 + i };
//     });
//     return expanded.sort((a, b) => a.priceFrom - b.priceFrom);
//   }, []);

//   return (
//     <div>
//       <Header user={user} onLogout={handleLogout} />
//       <CategoryNav user={user} />

//       <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
//         <ProductSection title="" products={products} onClickViewMore={() => {}} />
//       </main>
//     </div>
//   );
// }

// export default FoodPage;
// src/pages/FoodPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import ProductSection from "../components/ProductSection";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getProductsByCategory, logout, type ProductListResponse } from "../api/api";

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

export default function FoodPage() {
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
        const res = await getProductsByCategory("FOOD", {
          page: 0,
          size: 12,
          sortKey: "CREATED_AT",
          direction: "DESC",
        });

        const items = res.data.data.items ?? [];
        setProducts(items.map(toCardProduct));
      } catch (e) {
        console.error("food products fetch failed:", e);
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

  const sorted = useMemo(() => [...products].sort((a, b) => a.priceFrom - b.priceFrom), [products]);

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout page-list" style={{ paddingBottom: "40px" }}>
        <ProductSection title="" products={sorted} onClickViewMore={() => {}} />
        {loading && <div style={{ padding: "16px" }}>불러오는 중...</div>}
      </main>
    </div>
  );
}
