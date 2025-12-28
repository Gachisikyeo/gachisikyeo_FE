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
import {
  getGroupPurchasesByProductId,
  getProductById,
  logout,
  type GroupPurchaseListItem,
  type ProductCategory,
  type ProductDetailDto,
} from "../api/api";

import { CiDeliveryTruck } from "react-icons/ci";
import "./ProductDetailPage.css";

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

function formatCategoryLabel(category?: ProductCategory) {
  if (!category) return "-";
  if (category === "FOOD") return "식품";
  if (category === "NON_FOOD") return "비식품";
  if (category === "CLOTHES") return "의류";
  return String(category);
}

function normalizeProductDetail(raw: any, pid: number, fallbackCategory?: ProductCategory): ProductDetailDto {
  const category = (raw?.category ?? raw?.productCategory ?? raw?.categoryType ?? fallbackCategory) as ProductCategory | undefined;
  const storeName =
    raw?.storeName ??
    raw?.marketName ??
    raw?.sellerStoreName ??
    raw?.seller?.storeName ??
    raw?.businessInfo?.storeName;

  return {
    id: Number(raw?.id ?? raw?.productId ?? pid),
    category,
    productName: String(raw?.productName ?? raw?.name ?? ""),
    price: Number(raw?.price ?? 0),
    stockQuantity: raw?.stockQuantity ?? raw?.stock,
    unitQuantity: raw?.unitQuantity ?? raw?.packCount,
    unitPrice: raw?.unitPrice,
    imageUrl: raw?.imageUrl ?? raw?.thumbnailUrl,
    storeName: storeName ? String(storeName) : undefined,
    descriptionTitle: raw?.descriptionTitle ?? raw?.description_title,
    description: raw?.description ?? raw?.detailDescription ?? raw?.content,
  };
}

function isOpenGp(gp: GroupPurchaseListItem) {
  const status = (gp as any)?.status;
  if (status) return String(status).toUpperCase() === "OPEN";

  const end = new Date(gp.groupEndAt).getTime();
  if (!Number.isFinite(end)) return true;
  return end > Date.now();
} //공구마감처리함

export default function ProductDetailPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();
  const { productId } = useParams();

  const pid = useMemo(() => Number(productId), [productId]);

  const location = useLocation();
  const fallbackProduct = (location.state as any)?.product as Product | undefined;
  const fallbackCategory = (location.state as any)?.category as ProductCategory | undefined;

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
    const beUnitPrice = Number((product as any).unitPrice ?? 0);
    if (beUnitPrice > 0) return Math.round(beUnitPrice);
    const count = Math.max(1, Number(product.unitQuantity ?? 1));
    return Math.round(Number(product.price ?? 0) / count);
  }, [product]);

  const sellerName = useMemo(() => {
    return (product as any)?.storeName ?? (product as any)?.marketName ?? "-";
  }, [product]);

  const openGroupPurchases = useMemo(() => {
    return [...groupPurchases]
      .filter(isOpenGp)
      .sort((a, b) => {
        const ta = new Date(a.groupEndAt ?? 0).getTime();
        const tb = new Date(b.groupEndAt ?? 0).getTime();
        return ta - tb;
      });
  }, [groupPurchases]);

  const previewGroupPurchases = useMemo(() => openGroupPurchases.slice(0, 3), [openGroupPurchases]);

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

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const reloadGroupPurchases = async () => {
    try {
      const gpRes = await getGroupPurchasesByProductId(pid);
      setGroupPurchases(gpRes.data.data ?? []);
    } catch (e) {
      console.error("groupPurchases load failed:", e);
      setGroupPurchases([]);
    }
  };

  useEffect(() => {
    if (!pid || Number.isNaN(pid)) return;

    const load = async () => {
      setIsLoading(true);

      await reloadGroupPurchases();

      try {
        const prodRes = await getProductById(pid);
        const raw = prodRes.data.data as any;
        setProduct(raw ? normalizeProductDetail(raw, pid, fallbackCategory) : null);
      } catch (e) {
        console.warn("product detail api failed -> fallback to route state:", e);

        if (fallbackProduct) {
          setProduct({
            id: fallbackProduct.id,
            category: (fallbackCategory ?? "FOOD") as ProductCategory,
            productName: fallbackProduct.title,
            price: fallbackProduct.singlePurchasePrice,
            stockQuantity: 0,
            unitQuantity: 1,
            imageUrl: fallbackProduct.imageUrl,
            storeName: undefined,
            descriptionTitle: undefined,
            description: undefined,
          });
        } else {
          setProduct(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [pid, fallbackProduct, fallbackCategory]);

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
              <div className="product-detail__seller">판매자 {sellerName}</div>

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
                  <span className="product-detail__metaValue">{formatCategoryLabel(product?.category)}</span>
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
              {previewGroupPurchases.length === 0 && <div className="product-detail__emptyGp">진행중인 공구가 없어요</div>}

              {previewGroupPurchases.map((gp) => {
                const gpId = (gp as any).groupPurchaseId ?? gp.id;

                const current = Number(gp.currentQuantity ?? 0);
                const target = Number(gp.targetQuantity ?? 0);
                const participantsRaw = (gp as any).totalParticipation ?? (gp as any).total_participation;
                const participants = Number(participantsRaw ?? 0);
                const host = gp.hostNickName ?? (gp as any).userNickName ?? "-";
                const regionLabel = (gp as any).dong ?? gp.regionName ?? "-";

                return (
                  <button key={gpId} type="button" className="gp-row" onClick={() => handleClickJoin(gp)}>
                    <div className="gp-row__left">
                      <div className="gp-row__host">{host}</div>
                      <div className="gp-row__status">모집중</div>
                    </div>

                    <div className="gp-row__cols">
                      <div className="gp-row__col gp-row__progress">
                        <span className="gp-row__numBlue">{String(current).padStart(2, "0")}</span>
                        <span className="gp-row__numBlack"> / {String(target).padStart(2, "0")}</span>
                      </div>
                      <div className="gp-row__col gp-row__participants">
                        <span className="gp-row__numBlue">{participants}</span>
                        <span className="gp-row__participantsLabel">명 참가중</span>
                      </div>
                      <div className="gp-row__col gp-row__deadline">{formatDeadline(gp.groupEndAt)}</div>
                      <div className="gp-row__col gp-row__region">{regionLabel}</div>
                    </div>
                  </button>
                );
              })}

              <button type="button" className="gp-row gp-row--create" onClick={handleOpenCreateGroupPurchase}>
                새 공구 추가하기
              </button>
            </div>

            <div className="product-detail__gpFooter">
              <button
                type="button"
                className="product-detail__moreBtn"
                onClick={() => navigate(`/products/${pid}/group-purchases`)}
              >
                진행중인 공구 더보기 &gt;
              </button>
            </div>
          </section>

          <section className="product-detail__descSection">
            <h2 className="product-detail__descTitle">{product?.descriptionTitle?.trim() || "상품 설명"}</h2>
            <p className="product-detail__descText">{product?.description?.trim() || "상품 설명이 없습니다."}</p>
            <div className="product-detail__descImages" />
          </section>
        </div>
      </main>

      {product && (
        <GPCreateModal
          isOpen={isCreateOpen}
          onClose={async () => {
            setIsCreateOpen(false);
            await reloadGroupPurchases();
          }}
          productId={product.id}
          productName={product.productName}
          packagePrice={product.price}
          packCount={product.unitQuantity ?? 12}
          user={user}
          onPaid={(payload: { productId: number; productName: string; totalPrice: number; groupPurchaseId: number }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";
            const orderNo = String(payload.groupPurchaseId);

            navigate("/payment/success", {
              state: {
                orderNo,
                groupPurchaseId: payload.groupPurchaseId,
                buyerName,
                productId: payload.productId,
                productName: payload.productName,
                totalPrice: payload.totalPrice,
              },
            });
          }}
        />
      )}

      {isJoinOpen && product && selectedGp && (
        <GPJoinModal
          isOpen={isJoinOpen}
          onClose={async () => {
            setIsJoinOpen(false);
            setSelectedGp(null);
            await reloadGroupPurchases();
          }}
          user={user}
          groupPurchase={selectedGp}
          productId={product.id}
          productName={product.productName}
          packagePrice={product.price}
          packCount={product.unitQuantity ?? 1}
          onPaid={(payload: {
            productId: number;
            productName: string;
            totalPrice: number;
            buyQuantity: number;
            paymentMethod: "NAVER" | "KAKAO";
            groupPurchaseId: number;
            participationId?: number;
            buyerContact?: string;
          }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";
            const orderNo = String(payload.groupPurchaseId);

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
                participationId: payload.participationId,
                buyerContact: payload.buyerContact,
              },
            });
          }}
        />
      )}
    </div>
  );
}
