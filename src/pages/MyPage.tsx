// 마이페이지
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import CategoryNav from "../components/CategoryNav";
import { clearAuth, getAuthUser, type AuthUser } from "../auth/authStorage";
import {
  getMypageParticipationsCompleted,
  getMypageParticipationsOngoing,
  getMypageProfile,
  logout,
  type MyParticipationGroupPurchaseDto,
  type MyProfileResponseDto,
  type SliceResponse,
} from "../api/api";

import { LuUser, LuLock } from "react-icons/lu";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { IoLocationOutline, IoTimeOutline } from "react-icons/io5";

import "./MyPage.css";

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

type OrderRowItem = {
  id: number;
  productName: string;
  totalPrice: number;
  quantity: number;
  eachPrice: number;
  pickupLocation?: string;
  pickupTime?: string;
  imageUrl?: string;
};

function toRowItem(dto: MyParticipationGroupPurchaseDto): OrderRowItem {
  return {
    id: dto.participationId,
    productName: dto.productName,
    totalPrice: dto.myPaymentAmount,
    quantity: dto.myQuantity,
    eachPrice: dto.unitPrice,
    pickupLocation: dto.pickupLocation,
    pickupTime: dto.pickupTime,
    imageUrl: dto.imageUrl,
  };
}

function userTypeLabel(userType: any) {
  if (userType === "SELLER") return "판매자";
  if (userType === "BUYER") return "구매자";
  return "게스트";
}

export default function MyPage() {
  const navigate = useNavigate();
  const initialUser = useMemo<AuthUser>(() => getAuthUser(), []);
  const [user, setUser] = useState<AuthUser>(initialUser);

  const [profile, setProfile] = useState<MyProfileResponseDto | null>(null);

  const [completedItems, setCompletedItems] = useState<MyParticipationGroupPurchaseDto[]>([]);
  const [ongoingItems, setOngoingItems] = useState<MyParticipationGroupPurchaseDto[]>([]);

  const [completedMeta, setCompletedMeta] = useState<{
    page: number;
    size: number;
    hasNext: boolean;
    expanded: boolean;
  }>({
    page: 0,
    size: 1,
    hasNext: false,
    expanded: false,
  });

  const [ongoingMeta, setOngoingMeta] = useState<{ page: number; size: number; hasNext: boolean }>({
    page: 0,
    size: 3,
    hasNext: false,
  });

  const [loading, setLoading] = useState(false);

  const fetchInit = async () => {
    setLoading(true);
    try {
      const [profileRes, completedRes, ongoingRes] = await Promise.all([
        getMypageProfile(),
        getMypageParticipationsCompleted({ page: 0, size: 1 }),
        getMypageParticipationsOngoing({ page: 0, size: 3 }),
      ]);

      const profileData = unwrapData<MyProfileResponseDto>(profileRes);
      setProfile(profileData ?? null);

      const completedSlice = unwrapData<SliceResponse<MyParticipationGroupPurchaseDto>>(completedRes);
      setCompletedItems(completedSlice?.items ?? []);
      setCompletedMeta({
        page: completedSlice?.page ?? 0,
        size: completedSlice?.size ?? 1,
        hasNext: !!completedSlice?.hasNext,
        expanded: false,
      });

      const ongoingSlice = unwrapData<SliceResponse<MyParticipationGroupPurchaseDto>>(ongoingRes);
      setOngoingItems(ongoingSlice?.items ?? []);
      setOngoingMeta({
        page: ongoingSlice?.page ?? 0,
        size: ongoingSlice?.size ?? 3,
        hasNext: !!ongoingSlice?.hasNext,
      });
    } catch (e) {
      console.error(e);
      setProfile(null);
      setCompletedItems([]);
      setOngoingItems([]);
      setCompletedMeta({ page: 0, size: 1, hasNext: false, expanded: false });
      setOngoingMeta({ page: 0, size: 3, hasNext: false });
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

    fetchInit();
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

  // ✅ 화면 표시에 쓸 값들
  const nickNameValue = profile?.nickname ?? (user as any).nickName ?? "-";
  const emailValue = profile?.email ?? (user as any).email ?? "-";
  const regionValue = profile?.lawDong ?? (user as any).lawDong?.dong ?? "위치 미설정";
  const userTypeValue = userTypeLabel((user as any).userType);

  const completedRows = completedItems.map(toRowItem);
  const ongoingRows = ongoingItems.map(toRowItem);

  const canMoreCompleted = completedRows.length > 0 && (!completedMeta.expanded || completedMeta.hasNext);
  const canMoreOngoing = ongoingRows.length > 0 && ongoingMeta.hasNext;

  const loadMoreCompleted = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!completedMeta.expanded) {
        const res = await getMypageParticipationsCompleted({ page: 0, size: 3 });
        const slice = unwrapData<SliceResponse<MyParticipationGroupPurchaseDto>>(res);
        setCompletedItems(slice?.items ?? []);
        setCompletedMeta({
          page: slice?.page ?? 0,
          size: slice?.size ?? 3,
          hasNext: !!slice?.hasNext,
          expanded: true,
        });
        return;
      }

      if (!completedMeta.hasNext) return;
      const nextPage = completedMeta.page + 1;
      const res = await getMypageParticipationsCompleted({ page: nextPage, size: completedMeta.size });
      const slice = unwrapData<SliceResponse<MyParticipationGroupPurchaseDto>>(res);
      setCompletedItems((prev) => [...prev, ...(slice?.items ?? [])]);
      setCompletedMeta((prev) => ({ ...prev, page: slice?.page ?? nextPage, hasNext: !!slice?.hasNext }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOngoing = async () => {
    if (loading) return;
    if (!ongoingMeta.hasNext) return;
    setLoading(true);
    try {
      const nextPage = ongoingMeta.page + 1;
      const res = await getMypageParticipationsOngoing({ page: nextPage, size: ongoingMeta.size });
      const slice = unwrapData<SliceResponse<MyParticipationGroupPurchaseDto>>(res);
      setOngoingItems((prev) => [...prev, ...(slice?.items ?? [])]);
      setOngoingMeta((prev) => ({ ...prev, page: slice?.page ?? nextPage, hasNext: !!slice?.hasNext }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="app-layout">
        <div className="mypageWrap">
          <section className="mypage__userPanel">
            <div className="mypage__userGrid">
              {/* ✅ 왼쪽: 닉네임 / 이메일 */}
              <div className="mypage__col mypage__col--left">
                <div className="mypage__field">
                  <div className="mypage__label">닉네임</div>
                  <div className="mypage__value">
                    <LuUser className="mypage__icon" />
                    {nickNameValue}
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

              {/* ✅ 오른쪽: 지역 / 유저타입(이름 대신) */}
              <div className="mypage__col mypage__col--right">
                <div className="mypage__field">
                  <div className="mypage__label">지역</div>
                  <div className="mypage__value">
                    <FaMapMarkerAlt className="mypage__icon" />
                    {regionValue}
                  </div>
                </div>

                <div className="mypage__field">
                  <div className="mypage__label">유저타입</div>
                  <div className="mypage__value">
                    <LuLock className="mypage__icon" />
                    {userTypeValue}
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
              completedRows.map((o) => (
                <OrderRow key={o.id} order={o} onClick={() => navigate(`/mypage/orders/${o.id}`)} />
              ))
            )}

            {canMoreCompleted && (
              <button type="button" className="mypage__moreBtn" onClick={loadMoreCompleted} disabled={loading}>
                더보기
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
              ongoingRows.map((o) => <OrderRow key={o.id} order={o} onClick={() => {}} />)
            )}

            {canMoreOngoing && (
              <button type="button" className="mypage__moreBtn" onClick={loadMoreOngoing} disabled={loading}>
                더보기
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
          {order.pickupLocation || "공구 장소 지정"}
        </div>
        <div className="mypage__line">
          <IoTimeOutline className="mypage__miniIcon" />
          {order.pickupTime || "공구 시간 지정"}
        </div>
      </div>
    </button>
  );
}
