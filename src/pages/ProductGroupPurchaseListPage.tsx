// 상품 공구 목록 페이지
// 상품 공구 목록 페이지
// src/pages/ProductGroupPurchaseListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";

import GroupPurchaseCreateModal from "../components/GroupPurchaseCreateModal";
import GroupPurchaseJoinModal from "../components/GroupPurchaseJoinModal";

import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import * as API from "../api/api";

import "./ProductGroupPurchaseListPage.css";

// ✅ 이따 지우기
const USE_MOCK = true;

type ProductDetailDto = {
  id: number;
  productName?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string;
  unitQuantity?: number;
  category?: string;
  descriptionTitle?: string;
  description?: string;
  eachPrice?: number;
};

type GroupPurchaseListItem = {
  // 백엔드/기존 코드가 둘 중 뭘 주든 대응
  id?: number;
  groupPurchaseId?: number;

  regionId?: number;
  regionName?: string;
  hostUserId?: number;
  userNickName?: string;

  currentQuantity?: number;
  targetQuantity?: number;

  // 스웨거: groupEndAt
  groupEndAt?: string;

  status?: string;
};

function formatDeadline(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi} 마감`;
}

export default function ProductGroupPurchaseListPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();
  const { productId } = useParams();
  const pid = useMemo(() => Number(productId), [productId]);

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGp, setSelectedGp] = useState<GroupPurchaseListItem | null>(null);

  // ✅ 모달 Props에 onPaid가 없다고 뜨는 TS 충돌 방지(컴파일 에러 제거)
  const GPCreateModal = GroupPurchaseCreateModal as unknown as any;
  const GPJoinModal = GroupPurchaseJoinModal as unknown as any;

  // const eachPrice = useMemo(() => {
  //   if (!product) return 0;
  //   const fromBE = (product as any)?.eachPrice as number | undefined;
  //   if (typeof fromBE === "number" && fromBE > 0) return fromBE;

  //   const count = Math.max(1, Number(product.unitQuantity ?? 1));
  //   return Math.round(Number(product.price ?? 0) / count);
  // }, [product]);

  const handleLogout = async () => {
    try {
      const logoutFn = (API as any).logout as (() => Promise<any>) | undefined;
      if (logoutFn) await logoutFn();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" });
      navigate("/");
    }
  };

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const reloadGroupPurchases = async () => {
    try {
      // 스웨거: GET /api/products/{productId}/group-purchases
      const fn = (API as any).getGroupPurchasesByProductId as ((id: number) => Promise<any>) | undefined;
      if (!fn) {
        setGroupPurchases([]);
        return;
      }

      const gpRes = await fn(pid);
      setGroupPurchases(gpRes?.data?.data ?? []);
    } catch (e) {
      console.error("groupPurchases load failed:", e);
      setGroupPurchases([]);
    }
  };

  useEffect(() => {
    if (!pid || Number.isNaN(pid)) return;

    if (USE_MOCK) {
      setProduct({
        id: pid,
        productName: "상하키친 포크카레 170g 12팩",
        price: 12000,
        stockQuantity: 999,
        imageUrl: "",
        unitQuantity: 12,
        category: "FOOD",
        descriptionTitle: "",
        description: "",
      });

      setGroupPurchases([
        {
          id: 1,
          groupPurchaseId: 1,
          regionId: 1,
          regionName: "온수동",
          hostUserId: 1,
          userNickName: "닉네임",
          currentQuantity: 3,
          targetQuantity: 12,
          groupEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          status: "OPEN",
        },
        {
          id: 2,
          groupPurchaseId: 2,
          regionId: 1,
          regionName: "오류동",
          hostUserId: 2,
          userNickName: "총대왕",
          currentQuantity: 7,
          targetQuantity: 12,
          groupEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
          status: "OPEN",
        },
      ]);

      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      await reloadGroupPurchases();

      try {
        // 스웨거: GET /api/products/{id}
        const fn = (API as any).getProductById as ((id: number) => Promise<any>) | undefined;
        if (!fn) throw new Error("getProductById is not exported in api.ts");

        const prodRes = await fn(pid);
        setProduct(prodRes?.data?.data ?? null);
      } catch (e) {
        console.error("product detail load failed:", e);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [pid]);

  // 진행중만 보여주기(OPEN)
  const openGroupPurchases = useMemo(
    () => groupPurchases.filter((gp) => gp.status === "OPEN"),
    [groupPurchases]
  );

  const handleClickJoin = (gp: GroupPurchaseListItem) => {
    setSelectedGp(gp);
    setIsJoinOpen(true);
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />
        <main className="app-layout gpListPage">
          <div className="gpListPage__loading">불러오는 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout gpListPage">
        <div className="gpListPage__inner">
          <div className="gpListPage__topBar">
            <button type="button" className="gpListPage__createBtn" onClick={handleOpenCreate}>
              공구 만들기
            </button>
          </div>

          <div className="gpListPage__list">
            {openGroupPurchases.length === 0 && <div className="gpListPage__empty">진행중인 공구가 없어요</div>}

            {openGroupPurchases.map((gp) => {
              const gpId =
                (gp as any).groupPurchaseId ??
                (gp as any).id ??
                `${gp.regionName}-${gp.hostUserId}-${gp.groupEndAt}`;

              const current = Number(gp.currentQuantity ?? 0);
              const target = Number(gp.targetQuantity ?? 0);

              return (
                <button
                  key={gpId}
                  type="button"
                  className="gp-row"
                  onClick={() => handleClickJoin(gp)}
                >
                  <div className="gp-row__left">
                    <div className="gp-row__host">{gp.userNickName ?? "-"}</div>
                    <div className="gp-row__text">님의 공구 참여하기</div>
                  </div>

                  <div className="gp-row__cols">
                    <div className="gp-row__col gp-row__progress">
                      <span className="gp-row__numBlue">{String(current).padStart(2, "0")}</span>
                      <span className="gp-row__numBlack"> / {String(target).padStart(2, "0")}</span>
                    </div>

                    <div className="gp-row__col gp-row__participants">
                      <span className="gp-row__numBlue">{current}</span>
                      <span className="gp-row__participantsLabel">명 참가중</span>
                    </div>

                    <div className="gp-row__col gp-row__deadline">{formatDeadline(gp.groupEndAt)}</div>
                    <div className="gp-row__col gp-row__region">{gp.regionName ?? "-"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 공구 만들기 모달 */}
      {product && (
        <GPCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          productId={product.id}
          productName={product.productName}
          packagePrice={product.price}
          packCount={product.unitQuantity ?? 12}
          eachPriceFromBE={(product as any)?.eachPrice}
          user={user}
          // onPaid 타입 충돌 방지용 (결제완료 페이지 이동)
          onPaid={(payload: { productId: number; productName: string; totalPrice: number }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";
            const orderNo = `GP-${Date.now()}`;

            navigate("/payment/success", {
              state: {
                orderNo,
                buyerName,
                productId: payload.productId,
                productName: payload.productName,
                totalPrice: payload.totalPrice,
              },
            });
          }}
        />
      )}

      {/* 공구 참여 모달 */}
      {isJoinOpen && product && selectedGp && (
        <GPJoinModal
          isOpen={isJoinOpen}
          onClose={() => {
            setIsJoinOpen(false);
            setSelectedGp(null);
          }}
          user={user}
          groupPurchase={selectedGp}
          productId={product.id}
          productName={product.productName}
          packagePrice={product.price}
          packCount={product.unitQuantity ?? 1}
          eachPriceFromBE={(product as any)?.eachPrice as number | undefined}
        />
      )}
    </div>
  );
}
