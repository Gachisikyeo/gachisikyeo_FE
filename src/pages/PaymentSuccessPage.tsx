// 상품 결제 완료 페이지
// src/pages/PaymentSuccessPage.tsx
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { getAuthUser, type AuthUser } from "../auth/authStorage";
import Logo from "../assets/logo2.png";

import "./PaymentSuccessPage.css";

type PaymentState = {
  orderNo?: string;
  productName?: string;
  totalPrice?: number;

  buyerName?: string;

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

// 사진처럼 0,000원 형태도 자연스럽게 나오게(1000 미만일 때만 0,xxx)
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

  const orderNo = useMemo(() => state.orderNo ?? genOrderNo(), [state.orderNo]);

  const productName = state.productName ?? "상품명";
  const totalPrice = state.totalPrice ?? 0;

  const buyerName = state.buyerName ?? user.nickName ?? user.name ?? "구매자";

  const handleGoOrderDetail = () => {
    const order: MyOrder = {
      orderId: orderNo,
      status: "IN_PROGRESS",
      productName,
      totalPrice,
      quantity: 1, 
      eachPrice: totalPrice, 
      shippingFee: 0,
    };

    saveMyOrder(order);

    navigate(`/mypage/orders/${orderNo}`, { state: { order } });
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

          <div className="payment-success__message">
            결제가 정상적으로 완료되었습니다.
          </div>

          <div className="payment-success__infoCard">
            <div className="payment-success__row">
              <div className="payment-success__label">주문번호</div>
              <div className="payment-success__value">{orderNo}</div>
            </div>

            <div className="payment-success__row">
              <div className="payment-success__label">상품명</div>
              <div className="payment-success__value">{productName}</div>
            </div>

            <div className="payment-success__row">
              <div className="payment-success__label">결제 금액</div>
              <div className="payment-success__value">
                {formatWonPhotoStyle(totalPrice)}
              </div>
            </div>

            <div className="payment-success__row">
              <div className="payment-success__label">구매자명</div>
              <div className="payment-success__value">{buyerName}</div>
            </div>
          </div>

          <div className="payment-success__buttons">
            <button
              type="button"
              className="payment-success__btn"
              onClick={handleGoOrderDetail}
            >
              주문상세보기
            </button>

            <button
              type="button"
              className="payment-success__btn"
              onClick={() => navigate("/")}
            >
              메인페이지로
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
