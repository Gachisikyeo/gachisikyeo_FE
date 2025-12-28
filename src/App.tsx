// export default App;
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailSignup from "./pages/EmailSignup";
import GoogleSignup from "./pages/GoogleSignup";
import OAuth2Redirect from "./pages/OAuth2Redirect";
import SignupSuccess from "./pages/SignupSuccess";

import PopularPage from "./pages/PopularPage";
import RecentPage from "./pages/RecentPage";
import FoodPage from "./pages/FoodPage";
import NonFoodPage from "./pages/NonFoodPage";
import ClothingPage from "./pages/ClothingPage";

import SellerEntry from "./pages/seller/SellerEntry";
import SellerAuthPage from "./pages/seller/SellerAuthPage";
import SellerAuthCompletePage from "./pages/seller/SellerAuthCompletePage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import SellerProductCreatePage from "./pages/seller/SellerProductCreatePage";
import SellerProductCreateCompletePage from "./pages/seller/SellerProductCreateCompletePage";

import ProductDetailPage from "./pages/ProductDetailPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProductGroupPurchaseListPage from "./pages/ProductGroupPurchaseListPage";

import MyPage from "./pages/MyPage";
import OrderDetailPage from "./pages/OrderDetailPage";

import { getMypageProfile } from "./api/api";
import {
  getAuthUser,
  initAuthFromOAuthRedirect,
  saveAuthUser,
  type AuthUser,
  type UserType,
} from "./auth/authStorage";

import "./App.css";

function normalizeUserType(v: string | null | undefined, fallback: UserType): UserType {
  const s = String(v ?? "").toUpperCase();
  if (s === "SELLER") return "SELLER";
  if (s === "BUYER") return "BUYER";
  return fallback;
}

function App() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());

  useEffect(() => {
    initAuthFromOAuthRedirect();

    const current = getAuthUser();
    setUser(current);

    const needHydrate =
      current.isLoggedIn && (!current.nickName || !current.lawDong?.dong);

    if (!needHydrate) return;

    (async () => {
      try {
        const res = await getMypageProfile();
        if (!res.data.success) return;

        const profile = res.data.data;

        const next: AuthUser = {
          ...current,
          isLoggedIn: true,
          userType: normalizeUserType(profile.userType, current.userType),
          email: current.email ?? profile.email,
          nickName: current.nickName ?? profile.nickname,
          lawDong: profile.lawDong
            ? current.lawDong ?? { id: -1, sido: "", sigungu: "", dong: profile.lawDong }
            : current.lawDong,
        };

        saveAuthUser(next);
        setUser(next);
      } catch {}
    })();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/popular" element={<PopularPage />} />
      <Route path="/recent" element={<RecentPage />} />
      <Route path="/category/food" element={<FoodPage />} />
      <Route path="/category/non-food" element={<NonFoodPage />} />
      <Route path="/category/clothing" element={<ClothingPage />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup/email" element={<EmailSignup />} />
      <Route path="/signup/google" element={<GoogleSignup />} />
      <Route path="/signup/success" element={<SignupSuccess />} />
      <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

      <Route path="/seller" element={<SellerEntry />} />
      <Route path="/seller/auth" element={<SellerAuthPage />} />
      <Route path="/seller/auth/complete" element={<SellerAuthCompletePage />} />
      <Route path="/seller/dashboard" element={<SellerDashboardPage user={user} />} />
      <Route path="/seller/product/new" element={<SellerProductCreatePage />} />
      <Route path="/seller/product/complete" element={<SellerProductCreateCompletePage />} />

      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/products/:productId/group-purchases" element={<ProductGroupPurchaseListPage />} />

      <Route path="/mypage" element={<MyPage />} />
      <Route path="/mypage/orders/:orderId" element={<OrderDetailPage />} />
    </Routes>
  );
}

export default App;
