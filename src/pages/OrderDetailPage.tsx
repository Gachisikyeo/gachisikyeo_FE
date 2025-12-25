// 상품 주문 상세 페이지
// src/pages/OrderDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { getAuthUser, type AuthUser, clearAuth } from "../auth/authStorage";
import * as API from "../api/api";

import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";
import "./OrderDetailPage.css";

type OrderStatus = "COMPLETED" | "IN_PROGRESS";

export type MyOrder = {
  orderId: string;
  status: OrderStatus;

  productName: string;
  totalPrice: number;
  quantity: number;
  eachPrice: number;

  productId?: number;
  groupPurchaseId?: number;

  orderNo?: string;
  hostNickName?: string;
};

type ProductDetailDto = {
  id: number;
  productName?: string;
  imageUrl?: string;
};

type GroupPurchaseListItem = {
  groupPurchaseId?: number;
  userNickName?: string;
};

const LS_KEY = "gachi_my_orders_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadOrders(): MyOrder[] {
  return safeParse<MyOrder[]>(localStorage.getItem(LS_KEY), []);
}

function formatWonPhotoStyle(value: number) {
  if (value < 0) return `${value.toLocaleString("ko-KR")}원`;
  if (value < 1000) return `0,${String(value).padStart(3, "0")}원`;
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();

  const user: AuthUser = useMemo(() => getAuthUser(), []);

  const stateOrder = (location.state as any)?.order as MyOrder | undefined;

  const [order, setOrder] = useState<MyOrder | null>(stateOrder ?? null);
  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [hostNick, setHostNick] = useState<string>("");

  useEffect(() => {
    if (order) return;
    if (!orderId) return;

    const list = loadOrders();
    const found = list.find((o) => o.orderId === orderId);
    if (found) setOrder(found);
  }, [order, orderId]);

  useEffect(() => {
    const run = async () => {
      if (!order?.productId) return;

      // ✅ 상품 정보 가져오기: GET /api/products/{id}
      try {
        const fn = (API as any).getProductById as ((id: number) => Promise<any>) | undefined;
        if (fn) {
          const prodRes = await fn(order.productId);
          setProduct(prodRes?.data?.data ?? null);
        } else {
          setProduct(null);
        }
      } catch (e) {
        console.error("getProductById failed:", e);
      }

      // ✅ 공구 목록에서 총대 닉네임 찾기: GET /api/products/{productId}/group-purchases
      try {
        const fn = (API as any).getGroupPurchasesByProductId as ((id: number) => Promise<any>) | undefined;
        if (!fn) {
          setHostNick("");
          return;
        }

        const gpRes = await fn(order.productId);
        const list = (gpRes?.data?.data ?? []) as GroupPurchaseListItem[];

        const picked: GroupPurchaseListItem | undefined =
          order.groupPurchaseId != null
            ? list.find((x) => x.groupPurchaseId === order.groupPurchaseId)
            : list[0];

        setHostNick(picked?.userNickName ?? "");
      } catch (e) {
        console.error("getGroupPurchasesByProductId failed:", e);
      }
    };

    run();
  }, [order?.productId, order?.groupPurchaseId]);

  const handleLogout = async () => {
    try {
      const logoutFn = (API as any).logout as (() => Promise<any>) | undefined;
      if (logoutFn) await logoutFn();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth(); // ✅ 토큰/유저정보 지워주기(다른 페이지랑 동일하게)
      navigate("/");
    }
  };

  if (!order) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />
        <main className="app-layout">
          <div className="mypageWrap">
            <div className="orderDetail__empty">주문 정보를 찾을 수 없어요</div>
          </div>
        </main>
      </div>
    );
  }

  const buyerNickName = (user as any).nickName ?? "구매자";
  const hostNickName = hostNick || order.hostNickName || "총대";
  const orderNo = order.orderNo || order.orderId;

  const productName = product?.productName ?? order.productName;
  const imageUrl = product?.imageUrl;

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout">
        <div className="mypageWrap">
          <div className="mypage__sectionTitle">주문내역</div>

          <button type="button" className="mypage__orderCard orderDetail__card" disabled>
            <div className="mypage__thumb" aria-hidden>
              {imageUrl ? <img src={imageUrl} alt={productName} /> : null}
            </div>

            <div className="mypage__orderInfo">
              <div className="mypage__productName">{productName}</div>

              <div className="mypage__payAmount">
                <span className="mypage__payLabel">결제 금액</span>
                <span className="mypage__payValue">{formatWonPhotoStyle(order.totalPrice)}</span>
              </div>

              <div className="mypage__metaRow">
                <span>총 수량 : {String(order.quantity).padStart(2, "0")}개</span>
                <span>개당 가격 : {formatWonPhotoStyle(order.eachPrice)}</span>
              </div>

              <div className="mypage__line">
                <IoLocationOutline className="mypage__miniIcon" />
                공구 장소 지정
              </div>
              <div className="mypage__line">
                <IoTimeOutline className="mypage__miniIcon" />
                공구 시간 지정
              </div>
            </div>
          </button>

          <section className="orderDetail__infoBox">
            <InfoRow label="주문번호" value={orderNo} />
            <InfoRow label="구매자명" value={buyerNickName} />
            <InfoRow label="총대 닉네임" value={hostNickName} />
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="orderDetail__row">
      <div className="orderDetail__label">{label}</div>
      <div className="orderDetail__value">{value}</div>
    </div>
  );
}
