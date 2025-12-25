// 마이페이지
// src/pages/MyPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { logout } from "../api/api";

import { LuUser } from "react-icons/lu";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";

type OrderStatus = "COMPLETED" | "IN_PROGRESS";

export type MyOrder = {
  orderId: string;
  status: OrderStatus;

  productName: string;

  totalPrice: number;
  quantity: number;
  eachPrice: number;
  shippingFee: number;

  pickupLocation?: string;
  pickupAt?: string;
};

const LS_KEY = "gachi_my_orders_v1";

// ✅ DEV TEMP START (임시로 마이페이지/주문내역을 바로 보기 위한 스위치)
const DEV_FORCE_VIEW = true;
// ✅ DEV TEMP END

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

function saveOrders(next: MyOrder[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

function formatWonPhotoStyle(value: number) {
  if (value < 0) return `${value.toLocaleString("ko-KR")}원`;
  if (value < 1000) return `0,${String(value).padStart(3, "0")}원`;
  return `${value.toLocaleString("ko-KR")}원`;
}

function ensureDevDummyOrdersOnce() {
  const current = loadOrders();
  if (current.length > 0) return;

  const dummy: MyOrder[] = [
    {
      orderId: "2025122401",
      status: "COMPLETED",
      productName: "상하키친 포크카레 170g 12팩",
      totalPrice: 12000, 
      quantity: 3,
      eachPrice: 1000,
      shippingFee: 0,
      pickupLocation: "온수동 ○○○ 앞",
      pickupAt: "12/27 18:00",
    },
    {
      orderId: "2025122402",
      status: "IN_PROGRESS",
      productName: "티아시아 마크니 커리 170g 12팩",
      totalPrice: 3000, // ✅ 결제금액
      quantity: 3,
      eachPrice: 250,
      shippingFee: 0,
      pickupLocation: "오류동 ○○○ 앞",
      pickupAt: "12/28 20:00",
    },
  ];

  saveOrders(dummy);
}

export default function MyPage() {
  const navigate = useNavigate();

  const realUser = useMemo<AuthUser>(() => getAuthUser(), []);
  const [user, setUser] = useState<AuthUser>(realUser);

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllParticipating, setShowAllParticipating] = useState(false);

  // ✅ DEV TEMP START (로그인 안 해도 BUYER로 보이게)
  const devUser: AuthUser = useMemo(
    () =>
      ({
        isLoggedIn: true,
        userType: "BUYER",
        name: "꿀단지",
        nickName: "꿀단지",
        email: "gaci09@gmail.com",
        lawDong: { sido: "서울특별시", sigungu: "구로구", dong: "온수동", lawDongId: 1 },
      } as any),
    []
  );
  const effectiveUser = DEV_FORCE_VIEW ? devUser : user;
  // ✅ DEV TEMP END

  useEffect(() => {
    setUser(getAuthUser());
    if (DEV_FORCE_VIEW) ensureDevDummyOrdersOnce();
    setOrders(loadOrders());
  }, []);

  // ✅ DEV TEMP START (DEV_FORCE_VIEW면 접근 제한 스킵)
  useEffect(() => {
    if (DEV_FORCE_VIEW) return;
    if (!user.isLoggedIn || user.userType !== "BUYER") {
      navigate("/", { replace: true });
    }
  }, [navigate, user.isLoggedIn, user.userType]);
  // ✅ DEV TEMP END

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" } as AuthUser);
      navigate("/");
    }
  };

  const nameValue = (effectiveUser as any).name ?? "사용자";
  const nickNameValue = (effectiveUser as any).nickName ?? "-";
  const emailValue = (effectiveUser as any).email ?? "-";
  const regionValue = (effectiveUser as any).lawDong?.dong ?? "위치 미설정";

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const participatingOrders = orders.filter((o) => o.status === "IN_PROGRESS");

  const visibleCompleted = showAllOrders ? completedOrders : completedOrders.slice(0, 1);
  const visibleParticipating = showAllParticipating
    ? participatingOrders
    : participatingOrders.slice(0, 1);

  return (
    <div>
      <Header user={effectiveUser} onLogout={handleLogout} />
      <CategoryNav user={effectiveUser} />

      <main className="app-layout">
        <div className="mypageWrap">
          {/* 상단 유저 정보 패널 */}
          <section className="mypage__userPanel">
            <div className="mypage__userGrid">
              {/* LEFT */}
              <div className="mypage__col mypage__col--leftShift">
                <div className="mypage__field">
                  <div className="mypage__label">이름</div>
                  <div className="mypage__value">
                    <LuUser className="mypage__icon" />
                    {nameValue}
                  </div>
                </div>

                <div className="mypage__field">
                  <div className="mypage__label">이메일</div>
                  <div className="mypage__value">
                    <MdOutlineEmail className="mypage__icon" />
                    {emailValue}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="mypage__col mypage__col--right mypage__col--rightShift">
                <div className="mypage__field">
                  <div className="mypage__label">닉네임</div>
                  <div className="mypage__value">
                    <LuUser className="mypage__icon" />
                    {nickNameValue}
                  </div>
                </div>

                <div className="mypage__field">
                  <div className="mypage__label">지역</div>
                  <div className="mypage__value">
                    <FaMapMarkerAlt className="mypage__icon" />
                    {regionValue}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 주문내역 */}
          <div className="mypage__sectionTitle">주문내역</div>

          <section className="mypage__list">
            {visibleCompleted.length === 0 ? (
              <div className="mypage__empty">주문내역이 아직 없어!</div>
            ) : (
              visibleCompleted.map((o) => (
                <OrderRow
                  key={o.orderId}
                  order={o}
                  onClick={() =>
                    navigate(`/mypage/orders/${o.orderId}`, { state: { order: o } })
                  }
                />
              ))
            )}

            {completedOrders.length > 1 && (
              <button
                type="button"
                className="mypage__moreBtn"
                onClick={() => setShowAllOrders((v) => !v)}
              >
                더보기 <span className={`mypage__chev ${showAllOrders ? "is-up" : ""}`}>⌄</span>
              </button>
            )}
          </section>

          {/* 참가중인 공구 */}
          <div className="mypage__sectionTitle mypage__sectionTitle--mt">참가중인 공구</div>

          <section className="mypage__list">
            {visibleParticipating.length === 0 ? (
              <div className="mypage__empty">참가중인 공구가 아직 없어요</div>
            ) : (
              visibleParticipating.map((o) => (
                <OrderRow
                  key={o.orderId}
                  order={o}
                  onClick={() =>
                    navigate(`/mypage/orders/${o.orderId}`, { state: { order: o } })
                  }
                />
              ))
            )}

            {participatingOrders.length > 1 && (
              <button
                type="button"
                className="mypage__moreBtn"
                onClick={() => setShowAllParticipating((v) => !v)}
              >
                더보기{" "}
                <span className={`mypage__chev ${showAllParticipating ? "is-up" : ""}`}>⌄</span>
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function OrderRow({ order, onClick }: { order: MyOrder; onClick: () => void }) {
  return (
    <button type="button" className="mypage__orderCard" onClick={onClick}>
      <div className="mypage__thumb" aria-hidden />

      <div className="mypage__orderInfo">
        <div className="mypage__productName">{order.productName}</div>

        <div className="mypage__payAmount">
          <span className="mypage__payLabel">결제 금액</span>
          <span className="mypage__payValue">{formatWonPhotoStyle(order.totalPrice)}</span>
        </div>

        <div className="mypage__metaRow">
          <span>총 수량 : {String(order.quantity).padStart(2, "0")}개</span>
          <span>개당 가격 : {formatWonPhotoStyle(order.eachPrice)}</span>
          {/* ✅ 배송비 제거 */}
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
  );
}
