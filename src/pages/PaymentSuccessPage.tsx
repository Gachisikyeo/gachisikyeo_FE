// 상품 결제 완료 페이지
import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { getAuthUser, type AuthUser } from "../auth/authStorage";
import Logo from "../assets/logo2.png";

import { confirmParticipationPayment } from "../api/api";

import "./PaymentSuccessPage.css";

type PaymentState = {
  orderNo?: string;
  groupPurchaseId?: number;
  participationId?: number;

  productName?: string;
  totalPrice?: number;

  buyerName?: string;

  buyQuantity?: number;
  eachPrice?: number;

  pickupLocation?: string;
  pickupAt?: string;

  paymentMethod?: "NAVER" | "KAKAO";
};

type MyOrder = {
  orderId: string;
  status: "COMPLETED" | "IN_PROGRESS";

  productName: string;

  totalPrice: number;
  quantity: number;
  eachPrice: number;
  shippingFee: number;

  groupPurchaseId?: number;
  participationId?: number;

  buyerName?: string;

  pickupLocation?: string;
  pickupAt?: string;
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

function saveMyOrder(order: MyOrder) {
  const prev = safeParse<MyOrder[]>(localStorage.getItem(LS_KEY), []);
  const next = [order, ...prev.filter((o) => o.orderId !== order.orderId)];
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

function genOrderNo() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const tail = String(d.getTime()).slice(-2);
  return `${yyyy}${mm}${dd}${tail}`;
}

function formatWonPhotoStyle(value: number) {
  if (value < 0) return `${value.toLocaleString("ko-KR")}원`;

  if (value < 1000) {
    return `0,${String(value).padStart(3, "0")}원`;
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user: AuthUser = useMemo(() => getAuthUser(), []);

  const state = (location.state ?? {}) as PaymentState;

  const orderNo = useMemo(() => {
    if (typeof state.groupPurchaseId === "number" && state.groupPurchaseId > 0) return String(state.groupPurchaseId);
    return state.orderNo ?? genOrderNo();
  }, [state.groupPurchaseId, state.orderNo]);

  const productName = state.productName ?? "상품명";
  const totalPrice = state.totalPrice ?? 0;

  const buyerName = state.buyerName ?? user.nickName ?? user.name ?? "구매자";

  const quantity = useMemo(() => {
    const q = Number(state.buyQuantity ?? 1);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }, [state.buyQuantity]);

  const eachPrice = useMemo(() => {
    const ep = Number(state.eachPrice);
    if (Number.isFinite(ep) && ep > 0) return ep;
    return quantity > 0 ? Math.round(totalPrice / quantity) : totalPrice;
  }, [quantity, state.eachPrice, totalPrice]);

  const confirmedRef = useRef(false);
  const [confirming, setConfirming] = useState(false);

  const confirmPaymentIfNeeded = async () => {
    const participationId = Number(state.participationId);

    if (!Number.isFinite(participationId) || participationId <= 0) return true;
    if (confirmedRef.current) return true;
    if (confirming) return false;

    setConfirming(true);
    try {
      await confirmParticipationPayment(participationId);
      confirmedRef.current = true;
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "결제 확정에 실패했어 ㅠㅠ";
      alert(msg);
      return false;
    } finally {
      setConfirming(false);
    }
  };

  const handleGoOrderDetail = async () => {
    const ok = await confirmPaymentIfNeeded();
    if (!ok) return;

    const participationId =
      typeof state.participationId === "number" && state.participationId > 0 ? state.participationId : undefined;

    const orderIdForRoute = participationId ? String(participationId) : orderNo;

    const order: MyOrder = {
      orderId: orderIdForRoute,
      status: "COMPLETED",
      productName,
      totalPrice,
      quantity,
      eachPrice,
      shippingFee: 0,
      groupPurchaseId: typeof state.groupPurchaseId === "number" ? state.groupPurchaseId : undefined,
      participationId,
      buyerName,
      pickupLocation: state.pickupLocation,
      pickupAt: state.pickupAt,
    };

    saveMyOrder(order);

    navigate(`/mypage/orders/${orderIdForRoute}`, { state: { order } });
  };

  const handleGoHome = async () => {
    const ok = await confirmPaymentIfNeeded();
    if (!ok) return;
    navigate("/");
  };

  return (
    <div>
      <Header user={user} onLogout={() => navigate("/")} />
      <CategoryNav user={user} />

      <main className="app-layout payment-success">
        <section className="payment-success__panel">
          <div className="successLogo">
            <img src={Logo} alt="같이시켜 로고" />
          </div>

          <div className="payment-success__message">결제가 정상적으로 완료되었습니다.</div>

          <div className="payment-success__card">
            <div className="payment-success__row">
              <span className="payment-success__label">주문번호</span>
              <span className="payment-success__value">{orderNo}</span>
            </div>

            <div className="payment-success__row">
              <span className="payment-success__label">주문상품</span>
              <span className="payment-success__value">{productName}</span>
            </div>

            <div className="payment-success__row">
              <span className="payment-success__label">결제금액</span>
              <span className="payment-success__value payment-success__value--price">
                {formatWonPhotoStyle(totalPrice)}
              </span>
            </div>

            <div className="payment-success__row">
              <span className="payment-success__label">구매자</span>
              <span className="payment-success__value">{buyerName}</span>
            </div>
          </div>

          <div className="payment-success__buttons">
            <button type="button" className="payment-success__btn" onClick={handleGoOrderDetail} disabled={confirming}>
              주문상세 보기
            </button>
            <button
              type="button"
              className="payment-success__btn payment-success__btn--primary"
              onClick={handleGoHome}
              disabled={confirming}
            >
              홈으로
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
