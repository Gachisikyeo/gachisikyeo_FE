// 상품 주문 상세 페이지
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getMypageCompletedDetail, logout, type CompletedGroupPurchaseDetailDto } from "../api/api";

import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";
import "./OrderDetailPage.css";

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

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const user: AuthUser = useMemo(() => getAuthUser(), []);
  const [detail, setDetail] = useState<CompletedGroupPurchaseDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getAuthUser();
    if (!u.isLoggedIn) {
      navigate("/", { replace: true });
      return;
    }

    const participationId = Number(orderId);
    if (!orderId || Number.isNaN(participationId)) {
      setDetail(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await getMypageCompletedDetail(participationId);
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
  }, [navigate, orderId]);

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

  if (loading && !detail) {
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

  if (!detail) {
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

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout">
        <div className="mypageWrap">
          <div className="mypage__sectionTitle">주문내역</div>

          <button type="button" className="mypage__orderCard orderDetail__card" disabled>
            <div className="mypage__thumb" aria-hidden>
              {detail.imageUrl ? <img src={detail.imageUrl} alt={detail.productName} /> : null}
            </div>

            <div className="mypage__orderInfo">
              <div className="mypage__productName">{detail.productName}</div>

              <div className="mypage__payAmount">
                <span className="mypage__payLabel">결제 금액</span>
                <span className="mypage__payValue">{formatWonPhotoStyle(detail.paymentAmount)}</span>
              </div>

              <div className="mypage__metaRow">
                <span>총 수량 : {String(detail.quantity).padStart(2, "0")}개</span>
                <span>개당 가격 : {formatWonPhotoStyle(detail.unitPrice)}</span>
              </div>

              <div className="mypage__line">
                <IoLocationOutline className="mypage__miniIcon" />
                {detail.pickupLocation || "공구 장소 지정"}
              </div>
              <div className="mypage__line">
                <IoTimeOutline className="mypage__miniIcon" />
                {detail.pickupTime || "공구 시간 지정"}
              </div>
            </div>
          </button>

          <section className="orderDetail__infoBox">
            <InfoRow label="주문번호" value={String(detail.orderNumber)} />
            <InfoRow label="구매자명" value={detail.buyerName} />
            <InfoRow label="총대 닉네임" value={detail.leaderNickname} />
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
