// 마이페이지
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import { getMypageMain, logout, type MypageGroupPurchaseDto, type PageResponse } from "../api/api";

import { LuUser } from "react-icons/lu";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";

function formatWonPhotoStyle(value: number) {
  if (value < 0) return `${value.toLocaleString("ko-KR")}원`;
  if (value < 1000) return `0,${String(value).padStart(3, "0")}원`;
  return `${value.toLocaleString("ko-KR")}원`;
}

type OrderRowItem = {
  id: string;
  productName: string;
  totalPrice: number;
  quantity: number;
  eachPrice: number;
  imageUrl?: string;
};

function toRowItem(dto: MypageGroupPurchaseDto): OrderRowItem {
  const id = String(dto.participationId ?? dto.groupPurchaseId);
  return {
    id,
    productName: dto.productName,
    totalPrice: dto.totalPrice,
    quantity: dto.quantity,
    eachPrice: dto.unitPrice,
    imageUrl: dto.imageUrl,
  };
}

export default function MyPage() {
  const navigate = useNavigate();
  const initialUser = useMemo<AuthUser>(() => getAuthUser(), []);
  const [user, setUser] = useState<AuthUser>(initialUser);

  const [profile, setProfile] = useState<{ nickname: string; email: string; lawDong: string | null } | null>(null);
  const [completedPage, setCompletedPage] = useState<PageResponse<MypageGroupPurchaseDto> | null>(null);
  const [ongoingPage, setOngoingPage] = useState<PageResponse<MypageGroupPurchaseDto> | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllParticipating, setShowAllParticipating] = useState(false);

  const fetchMypage = async (opts: { completed: boolean; ongoing: boolean }) => {
    setLoading(true);
    try {
      const res = await getMypageMain(opts);

      setProfile({
        nickname: res.data.nickname,
        email: res.data.email,
        lawDong: res.data.lawDong ?? null,
      });

      setCompletedPage(res.data.completedGroupPurchases ?? { content: [] });
      setOngoingPage(res.data.ongoingGroupPurchases ?? { content: [] });
    } catch (e) {
      console.error(e);
      setCompletedPage({ content: [] });
      setOngoingPage({ content: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getAuthUser();
    setUser(u);

    if (!(u as any).isLoggedIn) {
      navigate("/", { replace: true });
      return;
    }

    fetchMypage({ completed: false, ongoing: false });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" } as AuthUser);
      navigate("/");
    }
  };

  const nameValue = (user as any).name ?? "사용자";
  const nickNameValue = profile?.nickname ?? (user as any).nickName ?? "-";
  const emailValue = profile?.email ?? (user as any).email ?? "-";
  const regionValue = profile?.lawDong ?? (user as any).lawDong?.dong ?? "위치 미설정";

  const completedItems = (completedPage?.content ?? []).map(toRowItem);
  const ongoingItems = (ongoingPage?.content ?? []).map(toRowItem);

  const completedTotal = completedPage?.totalElements ?? completedItems.length;
  const ongoingTotal = ongoingPage?.totalElements ?? ongoingItems.length;

  const canToggleCompleted = completedTotal > 1;
  const canToggleOngoing = ongoingTotal > 1;

  const toggleCompleted = async () => {
    const next = !showAllOrders;
    setShowAllOrders(next);
    await fetchMypage({ completed: next, ongoing: showAllParticipating });
  };

  const toggleOngoing = async () => {
    const next = !showAllParticipating;
    setShowAllParticipating(next);
    await fetchMypage({ completed: showAllOrders, ongoing: next });
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout">
        <div className="mypageWrap">
          <section className="mypage__userPanel">
            <div className="mypage__userGrid">
              <div className="mypage__col mypage__col--left">
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

              <div className="mypage__col mypage__col--right">
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

          <div className="mypage__sectionTitle">주문내역</div>

          <section className="mypage__list">
            {loading && completedItems.length === 0 ? (
              <div className="mypage__empty">불러오는 중이에요</div>
            ) : completedItems.length === 0 ? (
              <div className="mypage__empty">주문내역이 아직 없어요</div>
            ) : (
              completedItems.map((o: any) => <OrderRow key={o.id} order={o} onClick={() => navigate(`/mypage/orders/${o.id}`)} />)
            )}

            {canToggleCompleted && (
              <button type="button" className="mypage__moreBtn" onClick={toggleCompleted} disabled={loading}>
                더보기 <span className={`mypage__chev ${showAllOrders ? "is-up" : ""}`}>⌄</span>
              </button>
            )}
          </section>

          <div className="mypage__sectionTitle mypage__sectionTitle--mt">참가중인 공구</div>

          <section className="mypage__list">
            {loading && ongoingItems.length === 0 ? (
              <div className="mypage__empty">불러오는 중이에요</div>
            ) : ongoingItems.length === 0 ? (
              <div className="mypage__empty">참가중인 공구가 아직 없어요</div>
            ) : (
              ongoingItems.map((o: any) => <OrderRow key={o.id} order={o} onClick={() => {}} />)
            )}

            {canToggleOngoing && (
              <button type="button" className="mypage__moreBtn" onClick={toggleOngoing} disabled={loading}>
                더보기 <span className={`mypage__chev ${showAllParticipating ? "is-up" : ""}`}>⌄</span>
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function OrderRow({ order, onClick }: { order: OrderRowItem; onClick: () => void }) {
  return (
    <button type="button" className="mypage__orderCard" onClick={onClick}>
      <div className="mypage__thumb" aria-hidden>
        {order.imageUrl ? <img src={order.imageUrl} alt={order.productName} /> : null}
      </div>

      <div className="mypage__orderInfo">
        <div className="mypage__productName">{order.productName}</div>

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
  );
}
