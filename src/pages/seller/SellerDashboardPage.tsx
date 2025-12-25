// 판매자 대시보드 페이지
// src/pages/seller/SellerDashboardPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import CategoryNav from "../../components/CategoryNav";

import { FiShoppingBag } from "react-icons/fi";
import { BsBarChartLineFill } from "react-icons/bs";

import "./SellerDashboardPage.css";
import { clearAuth, getAuthUser, type AuthUser } from "../../auth/authStorage";
import { logout } from "../../api/api";

type Props = {
  user?: AuthUser; // App.tsx가 prop으로 넘겨도 되고, 안 넘겨도 됨
};

type ProductRow = {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
};

export default function SellerDashboardPage({ user: userProp }: Props) {
  const navigate = useNavigate();
  const user = userProp ?? getAuthUser();

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

  // 더미 데이터 (조회 API 생기면 교체)
  const products: ProductRow[] = useMemo(
    () => [
      { id: 1, name: "상품명1", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 2, name: "상품명2", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 3, name: "상품명3", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 4, name: "상품명4", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 5, name: "상품명5", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 6, name: "상품명6", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 7, name: "상품명7", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 8, name: "상품명8", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 9, name: "상품명9", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 10, name: "상품명10", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 11, name: "상품명11", price: 11000, stock: 23, createdAt: "2025.12.06" },
      { id: 12, name: "상품명12", price: 11000, stock: 23, createdAt: "2025.12.06" },
    ],
    []
  );

  const totalProducts = products.length;
  const monthlySales = 1926000;

  const formatWon = (n: number) => `${new Intl.NumberFormat("ko-KR").format(n)}원`;

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const [page, setPage] = useState(1);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [page, products]);

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
              <div className="sdStatValue sdStatValue--sales">{formatWon(monthlySales)}</div>
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
                {pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{new Intl.NumberFormat("ko-KR").format(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>{p.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sdPagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`sdPageBtn ${n === page ? "is-active" : ""}`}
                onClick={() => setPage(n)}
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
