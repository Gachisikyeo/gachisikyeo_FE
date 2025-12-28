// 상품 주문 상세 페이지
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getMypageCompletedDetail, logout, type CompletedGroupPurchaseDetailDto } from "../api/api";

import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";
import "./OrderDetailPage.css";

type MyOrder = {
  orderId: string;
  status: "COMPLETED" | "IN_PROGRESS";
  productName: string;
  totalPrice: number;
  quantity: number;
  eachPrice: number;
  shippingFee: number;
  buyerName?: string;
  pickupLocation?: string;
  pickupAt?: string;
  leaderNickname?: string;
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

function formatWonPhotoStyle(value: number) {
  if (value < 0) return `${value.toLocaleString("ko-KR")}원`;
  if (value < 1000) return `0,${String(value).padStart(3, "0")}원`;
  return `${value.toLocaleString("ko-KR")}원`;
}

function unwrapData<T>(res: any): T | null {
  const d = res?.data;
  if (!d) return null;
  if (typeof d === "object" && "data" in d) return (d as any).data as T;
  return d as T;
}

function formatPickupDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  let h = d.getHours();
  const m = d.getMinutes();

  const meridiem = h >= 12 ? "오후" : "오전";
  h = h % 12;
  if (h === 0) h = 12;

  if (m === 0) return `${yyyy}-${mm}-${dd} / ${meridiem} ${h}시`;
  return `${yyyy}-${mm}-${dd} / ${meridiem} ${h}시 ${m}분`;
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();

  const user: AuthUser = useMemo(() => getAuthUser(), []);
  const [detail, setDetail] = useState<CompletedGroupPurchaseDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const routeId = String(orderId ?? "").trim();

  const fallbackOrder: MyOrder | null = useMemo(() => {
    const fromState = (location.state as any)?.order as MyOrder | undefined;
    if (fromState && String(fromState.orderId) === routeId) return fromState;

    const list = safeParse<MyOrder[]>(localStorage.getItem(LS_KEY), []);
    const found = list.find((o) => String(o.orderId) === routeId);
    return found ?? null;
  }, [location.state, routeId]);

  useEffect(() => {
    const u = getAuthUser();
    if (!u.isLoggedIn) {
      navigate("/", { replace: true });
      return;
    }

    const n = Number(routeId);
    if (!routeId || Number.isNaN(n) || n <= 0) {
      setDetail(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await getMypageCompletedDetail(n);
        const d = unwrapData<CompletedGroupPurchaseDetailDto>(res);
        setDetail(d ?? null);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate, routeId]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  const myNick = useMemo(() => {
    return String((user as any).nickName ?? (user as any).name ?? "").trim();
  }, [user]);

  const leaderNickname = useMemo(() => {
    if (detail) {
      const raw = String((detail as any).leaderNickname ?? "").trim();
      const buyerName = String((detail as any).buyerName ?? "").trim();

      if (raw && raw !== "-" && raw.toLowerCase() !== "null") return raw;

      const myId = (user as any).userId ?? (user as any).id;
      const leaderId =
        (detail as any).leaderUserId ??
        (detail as any).hostUserId ??
        (detail as any).leaderId ??
        (detail as any).hostId;

      if (myNick && buyerName === myNick) return myNick;
      if (myNick && myId != null && leaderId != null && Number(myId) === Number(leaderId)) return myNick;
      if (buyerName) return buyerName;
      return myNick || "-";
    }

    const raw2 = String(fallbackOrder?.leaderNickname ?? "").trim();
    if (raw2 && raw2 !== "-" && raw2.toLowerCase() !== "null") return raw2;

    const buyer2 = String(fallbackOrder?.buyerName ?? "").trim();
    if (myNick && buyer2 === myNick) return myNick;

    return myNick || "-";
  }, [detail, fallbackOrder, myNick, user]);

  if (loading && !detail && !fallbackOrder) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />
        <main className="app-layout">
          <div className="mypageWrap">
            <div className="orderDetail__empty">불러오는 중이에요</div>
          </div>
        </main>
      </div>
    );
  }

  if (detail) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />

        <main className="app-layout">
          <div className="mypageWrap">
            <div className="mypage__sectionTitle">주문내역</div>

            <button type="button" className="mypage__orderCard orderDetail__card" disabled>
              <div className="mypage__thumb" aria-hidden>
                {(detail as any).imageUrl ? <img src={(detail as any).imageUrl} alt={(detail as any).productName} /> : null}
              </div>

              <div className="mypage__orderInfo">
                <div className="mypage__productName">{(detail as any).productName}</div>

                <div className="mypage__payAmount">
                  <span className="mypage__payLabel">결제 금액</span>
                  <span className="mypage__payValue">{formatWonPhotoStyle((detail as any).paymentAmount)}</span>
                </div>

                <div className="mypage__metaRow">
                  <span>총 수량 : {String((detail as any).quantity).padStart(2, "0")}개</span>
                  <span>개당 가격 : {formatWonPhotoStyle((detail as any).unitPrice)}</span>
                </div>

                <div className="mypage__line">
                  <IoLocationOutline className="mypage__miniIcon" />
                  {(detail as any).pickupLocation || "공구 장소 지정"}
                </div>
                <div className="mypage__line">
                  <IoTimeOutline className="mypage__miniIcon" />
                  {(detail as any).pickupTime || "공구 시간 지정"}
                </div>
              </div>
            </button>

            <section className="orderDetail__infoBox">
              <InfoRow label="주문번호" value={String((detail as any).orderNumber ?? routeId)} />
              <InfoRow label="구매자명" value={String((detail as any).buyerName ?? myNick ?? "구매자")} />
              <InfoRow label="총대 닉네임" value={leaderNickname || "-"} />
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (fallbackOrder) {
    const productName = fallbackOrder.productName ?? "상품명";
    const totalPrice = Number(fallbackOrder.totalPrice ?? 0);
    const quantity = Number(fallbackOrder.quantity ?? 1);
    const eachPrice = Number(fallbackOrder.eachPrice ?? (quantity > 0 ? Math.round(totalPrice / quantity) : totalPrice));

    const buyerName = String(fallbackOrder.buyerName ?? myNick ?? "구매자");
    const pickupLocation = String(fallbackOrder.pickupLocation ?? "공구 장소 지정");
    const pickupAtRaw = String(fallbackOrder.pickupAt ?? "");
    const pickupAt = pickupAtRaw ? formatPickupDateTime(pickupAtRaw) : "공구 시간 지정";

    return (
      <div>
        <Header user={user} onLogout={handleLogout} />
        <CategoryNav user={user} />

        <main className="app-layout">
          <div className="mypageWrap">
            <div className="mypage__sectionTitle">주문내역</div>

            <button type="button" className="mypage__orderCard orderDetail__card" disabled>
              <div className="mypage__thumb" aria-hidden />

              <div className="mypage__orderInfo">
                <div className="mypage__productName">{productName}</div>

                <div className="mypage__payAmount">
                  <span className="mypage__payLabel">결제 금액</span>
                  <span className="mypage__payValue">{formatWonPhotoStyle(totalPrice)}</span>
                </div>

                <div className="mypage__metaRow">
                  <span>총 수량 : {String(quantity).padStart(2, "0")}개</span>
                  <span>개당 가격 : {formatWonPhotoStyle(eachPrice)}</span>
                </div>

                <div className="mypage__line">
                  <IoLocationOutline className="mypage__miniIcon" />
                  {pickupLocation}
                </div>
                <div className="mypage__line">
                  <IoTimeOutline className="mypage__miniIcon" />
                  {pickupAt}
                </div>
              </div>
            </button>

            <section className="orderDetail__infoBox">
              <InfoRow label="주문번호" value={fallbackOrder.orderId || routeId} />
              <InfoRow label="구매자명" value={buyerName} />
              <InfoRow label="총대 닉네임" value={leaderNickname || "-"} />
            </section>
          </div>
        </main>
      </div>
    );
  }

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="orderDetail__row">
      <div className="orderDetail__label">{label}</div>
      <div className="orderDetail__value">{value}</div>
    </div>
  );
}
