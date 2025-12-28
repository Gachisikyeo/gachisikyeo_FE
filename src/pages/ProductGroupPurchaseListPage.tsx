// 상품 공구 목록 페이지
// src/pages/GroupPurchaseListPage.tsx
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

import "./ProductDetailPage.css";
import "./ProductGroupPurchaseListPage.css";

function getEndAtMillis(iso?: string) {
  if (!iso) return NaN;
  if (iso.includes("T")) return new Date(iso).getTime();

  const [y, m, d] = iso.split("-").map((v) => Number(v));
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function normalizeProductDetail(raw: any, pid: number, fallbackCategory?: ProductCategory): ProductDetailDto {
  const category = (raw?.category ?? raw?.productCategory ?? raw?.categoryType ?? fallbackCategory) as
    | ProductCategory
    | undefined;

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

  const end = getEndAtMillis((gp as any)?.groupEndAt);
  if (!Number.isFinite(end)) return true;
  return end > Date.now();
}

export default function GroupPurchaseListPage() {
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());
  const navigate = useNavigate();
  const { productId } = useParams();

  const pid = useMemo(() => Number(productId), [productId]);

  const location = useLocation();
  const fallbackProduct = (location.state as any)?.product as ProductDetailDto | Product | undefined;
  const fallbackCategory = (location.state as any)?.category as ProductCategory | undefined;
  const fallbackEachPrice = Number((location.state as any)?.eachPrice ?? 0);

  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGp, setSelectedGp] = useState<GroupPurchaseListItem | null>(null);

  const GPCreateModal = GroupPurchaseCreateModal as unknown as any;
  const GPJoinModal = GroupPurchaseJoinModal as unknown as any;

  const packCount = Number(product?.unitQuantity ?? 1);

  const eachPrice = useMemo(() => {
    if (!product) return 0;
    const beUnitPrice = Number((product as any).unitPrice ?? 0);
    if (beUnitPrice > 0) return Math.round(beUnitPrice);
    if (fallbackEachPrice > 0) return fallbackEachPrice;
    const count = Math.max(1, packCount);
    return Math.round(Number(product.price ?? 0) / count);
  }, [fallbackEachPrice, packCount, product]);

  const openGroupPurchases = useMemo(() => {
    return [...groupPurchases]
      .filter(isOpenGp)
      .sort((a, b) => {
        const ta = getEndAtMillis((a as any)?.groupEndAt);
        const tb = getEndAtMillis((b as any)?.groupEndAt);
        if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
        if (!Number.isFinite(ta)) return 1;
        if (!Number.isFinite(tb)) return -1;
        return ta - tb;
      });
  }, [groupPurchases]);

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
        if ((fallbackProduct as any)?.id) {
          const raw = fallbackProduct as any;
          if (typeof raw.productName === "string") {
            setProduct(normalizeProductDetail(raw, pid, fallbackCategory));
          } else {
            setProduct({
              id: Number(raw.id),
              category: (fallbackCategory ?? "FOOD") as ProductCategory,
              productName: String(raw.title ?? ""),
              price: Number(raw.singlePurchasePrice ?? 0),
              stockQuantity: 0,
              unitQuantity: 1,
              imageUrl: raw.imageUrl,
              storeName: undefined,
              descriptionTitle: undefined,
              description: undefined,
              unitPrice: undefined,
            });
          }
        } else {
          const prodRes = await getProductById(pid);
          const raw = prodRes.data.data as any;
          setProduct(raw ? normalizeProductDetail(raw, pid, fallbackCategory) : null);
        }
      } catch (e) {
        console.error("product load failed:", e);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [fallbackCategory, fallbackProduct, pid]);

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
          <section className="product-detail__gpSection gpListScope">
            <div
              className="product-detail__gpHeader gpListScope__header"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <button
                type="button"
                className="product-detail__moreBtn"
                onClick={() => navigate(`/products/${pid}`, { state: { product, category: product?.category } })}
                style={{ width: "auto" }}
              >
                &lt; 상품으로
              </button>
              <h2 className="product-detail__gpTitle gpListScope__title" style={{ margin: 0 }}>
                {product?.productName ?? "상품"} 공구
              </h2>
            </div>

            <div className="product-detail__gpList gpListScope__list">
              {openGroupPurchases.length === 0 && <div className="product-detail__emptyGp">진행중인 공구가 없어요</div>}

              {openGroupPurchases.map((gp) => {
                const gpId = Number((gp as any).groupPurchaseId ?? (gp as any).id);

                const current = Number((gp as any).currentQuantity ?? 0);
                const target = Number((gp as any).targetQuantity ?? 0);

                const participantsRaw = (gp as any).totalParticipation ?? (gp as any).total_participation;
                const participants = Number(participantsRaw ?? 0);

                const host = (gp as any).userNickName ?? (gp as any).hostNickName ?? (gp as any).hostName ?? "-";
                const regionLabel = (gp as any).dong ?? (gp as any).regionName ?? "-";

                return (
                  <button key={gpId} type="button" className="gp-row" onClick={() => handleClickJoin(gp)}>
                    <div className="gp-row__left">
                      <div className="gp-row__host">{host}</div>
                      <div className="gp-row__status">모집중</div>
                    </div>

                    <div className="gp-row__cols">
                      <div className="gp-row__col gp-row__progress">
                        <span className="gp-row__numBlue">{current.toLocaleString("ko-KR")}</span>
                        <span className="gp-row__numBlack"> / {target.toLocaleString("ko-KR")}</span>
                      </div>

                      <div className="gp-row__col gp-row__participants">
                        <span className="gp-row__numBlue">{participants.toLocaleString("ko-KR")}</span>
                        <span className="gp-row__participantsLabel">명 참가중</span>
                      </div>

                      <div className="gp-row__col gp-row__region">{regionLabel}</div>
                    </div>
                  </button>
                );
              })}

              <button type="button" className="gp-row gp-row--create" onClick={() => setIsCreateOpen(true)}>
                새 공구 추가하기
              </button>
            </div>
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
          packCount={packCount}
          user={user}
          onPaid={(payload: { productId: number; productName: string; totalPrice: number; groupPurchaseId: number }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";

            navigate("/payment/success", {
              state: {
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
          packCount={packCount}
          eachPriceFromBE={eachPrice}
          onPaid={(payload: {
            productId: number;
            productName: string;
            totalPrice: number;
            buyQuantity?: number;
            paymentMethod?: string;
            groupPurchaseId: number;
            participationId?: number;
            buyerContact?: string;
          }) => {
            const buyerName = user.nickName ?? user.name ?? "익명";

            navigate("/payment/success", {
              state: {
                groupPurchaseId: payload.groupPurchaseId,
                buyerName,
                productId: payload.productId,
                productName: payload.productName,
                totalPrice: payload.totalPrice,
                buyQuantity: payload.buyQuantity,
                paymentMethod: payload.paymentMethod,
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
