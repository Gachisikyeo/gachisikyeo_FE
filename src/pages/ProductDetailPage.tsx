// 상품 상세 페이지
// src/pages/ProductDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";

import GroupPurchaseCreateModal from "../components/GroupPurchaseCreateModal";
import GroupPurchaseJoinModal from "../components/GroupPurchaseJoinModal";

import type { Product } from "../components/ProductCard";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import * as API from "../api/api";

import { CiDeliveryTruck } from "react-icons/ci";
import "./ProductDetailPage.css";

// 임시
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
  // 임시?
  eachPrice?: number;
};

type GroupPurchaseListItem = {
  id?: number;
  groupPurchaseId?: number;

  regionId?: number;
  regionName?: string;
  hostUserId?: number;
  userNickName?: string;

  currentQuantity?: number;
  targetQuantity?: number;

  groupEndAt?: string;
  status?: string;
};

function formatWon(value: number) {
  return value.toLocaleString("ko-KR");
}

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

export default function ProductDetailPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();
  const { productId } = useParams();

  const pid = useMemo(() => Number(productId), [productId]);

  const location = useLocation();
  const fallbackProduct = (location.state as any)?.product as Product | undefined;

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGp, setSelectedGp] = useState<GroupPurchaseListItem | null>(null);

  const GPCreateModal = GroupPurchaseCreateModal as unknown as any;
  const GPJoinModal = GroupPurchaseJoinModal as unknown as any;

  const eachPrice = useMemo(() => {
    if (!product) return 0;

    const fromBE = (product as any)?.eachPrice as number | undefined;
    if (typeof fromBE === "number" && fromBE > 0) return fromBE;

    const count = Math.max(1, Number(product.unitQuantity ?? 1));
    return Math.round(Number(product.price ?? 0) / count);
  }, [product]);

  const handleLogout = async () => {
    try {
      // API.logout가 있으면 호출 (없어도 앱 안 죽게)
      const logoutFn = (API as any).logout as (() => Promise<any>) | undefined;
      if (logoutFn) await logoutFn();
    } catch (error) {
      console.error("logout failed:", error);
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

    // 임시 mock
    if (USE_MOCK) {
      setProduct({
        id: pid,
        productName: "상하키친 포크카레 170g 12팩",
        price: 12000,
        stockQuantity: 999,
        imageUrl: "",
        unitQuantity: 12,
        category: "FOOD",
        descriptionTitle: "상품 설명 타이틀",
        description: "상세 설명이 들어갈 영역이야.",
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
          regionName: "온수동",
          hostUserId: 2,
          userNickName: "바보",
          currentQuantity: 7,
          targetQuantity: 12,
          groupEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
          status: "OPEN",
        },
        {
          id: 3,
          groupPurchaseId: 3,
          regionId: 2,
          regionName: "오류동",
          hostUserId: 3,
          userNickName: "총대왕",
          currentQuantity: 1,
          targetQuantity: 12,
          groupEndAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
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
        const fn = (API as any).getProductById as ((id: number) => Promise<any>) | undefined;
        if (!fn) throw new Error("getProductById is not exported in api.ts");

        const prodRes = await fn(pid);
        setProduct(prodRes?.data?.data ?? null);
      } catch (e) {
        console.warn("product detail api failed -> fallback to route state:", e);

        if (fallbackProduct) {
          setProduct({
            id: fallbackProduct.id,
            productName: fallbackProduct.title,
            price: fallbackProduct.singlePurchasePrice,
            stockQuantity: 0,
            imageUrl: fallbackProduct.imageUrl,
            unitQuantity: 1,
          });
        } else {
          setProduct(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [pid, fallbackProduct]);

  const handleOpenCreateGroupPurchase = () => {
    setIsCreateOpen(true);
  };

  const handleClickJoin = (gp: GroupPurchaseListItem) => {
    setSelectedGp(gp);
    setIsJoinOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />
        <main className="app-layout product-detail" style={{ paddingBottom: "40px" }}>
          <div className="product-detail__loading">불러오는 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout product-detail" style={{ paddingBottom: "40px" }}>
        <div className="product-detail__inner">
          <section className="product-detail__top">
            <div className="product-detail__imageBox">
              {product?.imageUrl ? (
                <img className="product-detail__image" src={product.imageUrl} alt={product.productName ?? "상품 이미지"} />
              ) : (
                <div className="product-detail__imagePlaceholder">상품 이미지</div>
              )}
            </div>

            <div className="product-detail__info">
              <div className="product-detail__seller">판매자 이름</div>

              <div className="product-detail__titleRow">
                <h1 className="product-detail__title">{product?.productName ?? "상품명"}</h1>
              </div>

              <div className="product-detail__price">
                {formatWon(eachPrice)}/{formatWon(product?.price ?? 0)}원
              </div>

              <div className="product-detail__metaCard">
                <div className="product-detail__metaLine">
                  <span className="product-detail__metaLabel">상품명</span>
                  <span className="product-detail__metaValue">{product?.productName ?? "-"}</span>
                </div>
                <div className="product-detail__metaLine">
                  <span className="product-detail__metaLabel">카테고리</span>
                  <span className="product-detail__metaValue">{product?.category ?? "-"}</span>
                </div>
                <div className="product-detail__metaLine">
                  <span className="product-detail__metaLabel">구성수량</span>
                  <span className="product-detail__metaValue">{product?.unitQuantity ?? 1}개</span>
                </div>

                <div className="product-detail__divider" />

                <div className="product-detail__shipping">
                  <div className="product-detail__shippingTitle">
                    <CiDeliveryTruck /> 배송비 무료
                  </div>
                  <div className="product-detail__shippingDesc">배송기간 2~3일 소요</div>
                </div>
              </div>
            </div>
          </section>

          <section className="product-detail__gpSection">
            <div className="product-detail__gpHeader">
              <h2 className="product-detail__gpTitle">진행중인 공구</h2>
            </div>

            <div className="product-detail__gpList">
              {groupPurchases.length === 0 && <div className="product-detail__emptyGp">진행중인 공구가 없어요</div>}

              {groupPurchases.map((gp) => {
                const gpId = (gp as any).groupPurchaseId ?? (gp as any).id ?? `${gp.regionName}-${gp.hostUserId}-${gp.groupEndAt}`;
                const current = Number(gp.currentQuantity ?? 0);
                const target = Number(gp.targetQuantity ?? 0);

                return (
                  <button key={gpId} type="button" className="gp-row" onClick={() => handleClickJoin(gp)}>
                    <div className="gp-row__left">
                      <div className="gp-row__host">{gp.userNickName ?? "-"}</div>
                      <div className="gp-row__status">{gp.status === "OPEN" ? "모집중" : "마감"}</div>
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

              <button type="button" className="gp-row gp-row--create" onClick={handleOpenCreateGroupPurchase}>
                새 공구 추가하기
              </button>
            </div>

            <div className="product-detail__gpFooter">
              <button type="button" className="product-detail__moreBtn" onClick={() => navigate(`/products/${pid}/group-purchases`)}>
                진행중인 공구 더보기 &gt;
              </button>
            </div>
          </section>

          <section className="product-detail__descSection">
            <h2 className="product-detail__descTitle">{product?.descriptionTitle ?? "상품 설명"}</h2>
            <p className="product-detail__descText">{product?.description ?? "상품 설명"}</p>

            <div className="product-detail__descImages">{/* 상세 이미지 영역 */}</div>
          </section>
        </div>
      </main>

      {/* 공구 등록 모달 */}
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
          onPaid={(payload: {
            productId: number;
            productName: string;
            totalPrice: number;
            buyQuantity?: number;
            paymentMethod?: string;
            groupPurchaseId?: number;
          }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";
            const orderNo = `GPJ-${Date.now()}`;

            navigate("/payment/success", {
              state: {
                orderNo,
                buyerName,
                productId: payload.productId,
                productName: payload.productName,
                totalPrice: payload.totalPrice,
                buyQuantity: payload.buyQuantity,
                paymentMethod: payload.paymentMethod,
                groupPurchaseId: payload.groupPurchaseId,
              },
            });
          }}
        />
      )}
    </div>
  );
}
