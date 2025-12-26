// 판매자 대시보드 페이지
// src/pages/seller/SellerDashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import CategoryNav from "../../components/CategoryNav";

import { FiShoppingBag } from "react-icons/fi";
import { BsBarChartLineFill } from "react-icons/bs";

import "./SellerDashboardPage.css";
import { clearAuth, getAuthUser, type AuthUser } from "../../auth/authStorage";
import {
  getSellerDashboardProducts,
  getSellerMonthlySales,
  logout,
  type PageResponseSellerProductResponse,
} from "../../api/api";

type Props = {
  user?: AuthUser;
};

export default function SellerDashboardPage({ user: userProp }: Props) {
  const navigate = useNavigate();
  const user = userProp ?? getAuthUser();

  const [productsPage, setProductsPage] = useState<PageResponseSellerProductResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [monthlySalesAmount, setMonthlySalesAmount] = useState(0);
  const [loadingSales, setLoadingSales] = useState(false);

  const pageSize = 8;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  const formatWon = (n: number) => `${new Intl.NumberFormat("ko-KR").format(n)}원`;

  useEffect(() => {
    if (!user.isLoggedIn || user.userType !== "SELLER") {
      navigate("/", { replace: true });
      return;
    }

    const fetchSales = async () => {
      setLoadingSales(true);
      try {
        const now = new Date();
        const res = await getSellerMonthlySales({ year: now.getFullYear(), month: now.getMonth() + 1 });
        if (res.data.success) setMonthlySalesAmount(res.data.data.totalSalesAmount ?? 0);
      } catch (e) {
        console.error("monthly sales failed:", e);
      } finally {
        setLoadingSales(false);
      }
    };

    fetchSales();
  }, [navigate, user.isLoggedIn, user.userType]);

  useEffect(() => {
    if (!user.isLoggedIn || user.userType !== "SELLER") return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await getSellerDashboardProducts({
          page,
          size: pageSize,
          sortKey: "CREATED_AT",
          direction: "DESC",
        });

        if (!res.data.success) {
          console.error(res.data.message || "products fetch failed");
          setProductsPage({ items: [], page, size: pageSize, totalElements: 0, totalPages: 1, hasNext: false });
          return;
        }

        setProductsPage(res.data.data);
      } catch (e) {
        console.error("products fetch failed:", e);
        setProductsPage({ items: [], page, size: pageSize, totalElements: 0, totalPages: 1, hasNext: false });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [page, user.isLoggedIn, user.userType]);

  const totalProducts = productsPage?.totalElements ?? productsPage?.items.length ?? 0;
  const totalPages = Math.max(1, productsPage?.totalPages ?? 1);

  const pageItems = useMemo(() => productsPage?.items ?? [], [productsPage]);

  const handleGoCreate = () => {
    navigate("/seller/product/new");
  };

  return (
    <div className="sdPage">
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="sdMain">
        <div className="sdContainer">
          <h2 className="sdSectionTitle">판매 현황</h2>

          <div className="sdStatsGrid">
            <div className="sdStatCard">
              <div className="sdIconWrap">
                <FiShoppingBag size={44} />
              </div>
              <div className="sdStatLabel">총 상품 수</div>
              <div className="sdStatValue">{totalProducts}개</div>
            </div>

            <div className="sdStatCard">
              <div className="sdIconWrap sdIconWrap--sales">
                <BsBarChartLineFill size={44} />
              </div>
              <div className="sdStatLabel">이번 달 매출</div>
              <div className="sdStatValue sdStatValue--sales">
                {loadingSales ? "불러오는 중..." : formatWon(monthlySalesAmount)}
              </div>
            </div>
          </div>

          <div className="sdProductsHeader">
            <h2 className="sdSectionTitle sdSectionTitle--noMargin">상품관리</h2>
            <button type="button" className="sdCreateBtn" onClick={handleGoCreate}>
              상품 등록
            </button>
          </div>

          <div className="sdTableWrap">
            <table className="sdTable">
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>판매가</th>
                  <th>재고</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {loadingProducts ? (
                  <tr>
                    <td colSpan={4}>불러오는 중...</td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4}>등록된 상품이 없어요</td>
                  </tr>
                ) : (
                  pageItems.map((p) => (
                    <tr key={p.id}>
                      <td>{p.productName}</td>
                      <td>{new Intl.NumberFormat("ko-KR").format(p.price)}</td>
                      <td>{p.stockQuantity}</td>
                      <td>-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sdPagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`sdPageBtn ${n - 1 === page ? "is-active" : ""}`}
                onClick={() => setPage(n - 1)}
                disabled={loadingProducts}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
