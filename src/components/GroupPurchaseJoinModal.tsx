// // 공구 참여 모달
// // src/components/GroupPurchaseJoinModal.tsx
import { useEffect, useMemo, useState } from "react";

import type { AuthUser } from "../auth/authStorage";
import {
  createParticipation,
  getGroupPurchaseJoinDetail,
  type GroupPurchaseJoinDetailDto,
  type GroupPurchaseListItem,
} from "../api/api";

import "./GroupPurchaseJoinModal.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  user: AuthUser;

  productId: number;
  productName: string;

  packagePrice: number;
  packCount: number;
  eachPriceFromBE?: number;

  groupPurchase: GroupPurchaseListItem;

  onPaid?: (payload: {
    productId: number;
    productName: string;
    totalPrice: number;
    buyQuantity: number;
    paymentMethod: "NAVER" | "KAKAO";
    groupPurchaseId: number;
    participationId?: number;
    buyerContact?: string;
  }) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

export default function GroupPurchaseJoinModal({
  isOpen,
  onClose,
  user,
  productId,
  productName,
  packagePrice,
  packCount,
  eachPriceFromBE,
  groupPurchase,
  onPaid,
}: Props) {
  const groupPurchaseId = useMemo(() => {
    const v = (groupPurchase as any)?.groupPurchaseId ?? (groupPurchase as any)?.id;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [groupPurchase]);

  const minimumOrderUnit = useMemo(() => {
    const raw = (groupPurchase as any)?.minimumOrderUnit as number | undefined;
    if (typeof raw === "number" && raw > 0) return raw;
    return 1;
  }, [groupPurchase]);

  const currentQuantity = useMemo(() => {
    const v = (groupPurchase as any)?.currentQuantity as number | undefined;
    return typeof v === "number" && v >= 0 ? v : 0;
  }, [groupPurchase]);

  const [joinDetail, setJoinDetail] = useState<GroupPurchaseJoinDetailDto | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!groupPurchaseId) return;

    let alive = true;

    (async () => {
      try {
        const res = await getGroupPurchaseJoinDetail(groupPurchaseId);
        const data = res?.data?.data ?? null;
        if (!alive) return;
        setJoinDetail(data);
      } catch (e) {
        if (!alive) return;
        setJoinDetail(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, groupPurchaseId]);

  const targetQuantity = useMemo(() => {
    const v = joinDetail?.targetQuantity;
    if (typeof v === "number" && v >= 0) return v;

    const fallback = (groupPurchase as any)?.targetQuantity as number | undefined;
    return typeof fallback === "number" && fallback >= 0 ? fallback : 0;
  }, [groupPurchase, joinDetail]);

  const totalTargetPieces = useMemo(() => {
    const pack = Math.max(1, packCount || 1);
    return Math.max(0, targetQuantity * pack);
  }, [packCount, targetQuantity]);

  const remainingQuantity = useMemo(() => {
    return Math.max(0, totalTargetPieces - currentQuantity);
  }, [currentQuantity, totalTargetPieces]);

  const eachPrice = useMemo(() => {
    if (typeof eachPriceFromBE === "number" && eachPriceFromBE > 0) return eachPriceFromBE;
    const count = Math.max(1, packCount || 1);
    return Math.round(packagePrice / count);
  }, [eachPriceFromBE, packCount, packagePrice]);

  const [buyQuantity, setBuyQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [agreeDeadline, setAgreeDeadline] = useState(false);
  const [agreePickup, setAgreePickup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxBuyQuantity = Math.max(0, remainingQuantity);

  useEffect(() => {
    if (!isOpen) return;

    const initQty =
      remainingQuantity <= 0 ? 0 : clamp(minimumOrderUnit, 1, Math.max(1, maxBuyQuantity || 1));

    setBuyQuantity(initQty);
    setPhone("");
    setAgreeDeadline(false);
    setAgreePickup(false);
    setIsSubmitting(false);
  }, [isOpen, minimumOrderUnit, maxBuyQuantity, remainingQuantity]);

  const totalPricePreview = useMemo(() => eachPrice * buyQuantity, [eachPrice, buyQuantity]);

  const showProductName = joinDetail?.productName ?? productName;

  const groupEndAt = joinDetail?.groupEndAt ?? ((groupPurchase as any)?.groupEndAt as string | undefined);
  const pickupLocation = joinDetail?.pickupLocation ?? ((groupPurchase as any)?.pickupLocation as string | undefined);
  const pickupAt = joinDetail?.pickupAt ?? ((groupPurchase as any)?.pickupAt as string | undefined);

  const canSubmit =
    user.isLoggedIn &&
    groupPurchaseId > 0 &&
    remainingQuantity >= minimumOrderUnit &&
    buyQuantity >= minimumOrderUnit &&
    buyQuantity <= maxBuyQuantity &&
    phone.trim().length > 0 &&
    agreeDeadline &&
    agreePickup &&
    !isSubmitting;

  const handlePay = async (method: "NAVER" | "KAKAO") => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      const res = await createParticipation(groupPurchaseId, {
        quantity: buyQuantity,
        buyerContact: phone.trim(),
      });

      const participationId = res.data.data?.participationId;
      const shareAmount = Number(res.data.data?.shareAmount);
      const finalTotalPrice =
        Number.isFinite(shareAmount) && shareAmount > 0 ? shareAmount : totalPricePreview;

      onPaid?.({
        productId,
        productName: showProductName,
        totalPrice: finalTotalPrice,
        buyQuantity,
        paymentMethod: method,
        groupPurchaseId,
        participationId,
        buyerContact: phone.trim(),
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("공구 참여에 실패했어요");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gpJoin-overlay" onClick={onClose} role="presentation">
      <div className="gpJoin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="gpJoin-header">
          <div className="gpJoin-title">공구 참여하기</div>
          <button type="button" className="gpJoin-close" onClick={onClose} aria-label="닫기" disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <div className="gpJoin-productTop">
          <div className="gpJoin-productName">{showProductName}</div>
          <div className="gpJoin-productPrice">
            {eachPrice.toLocaleString("ko-KR")}/{packagePrice.toLocaleString("ko-KR")}원
          </div>
        </div>

        <div className="gpJoin-section">
          <div className="gpJoin-sectionTitle">공구 마감기한 확인</div>
            <input
              className="gpJoin-readonlyInput"
              value={groupEndAt ? `${formatDateOnly(groupEndAt)} 23:59` : ""}
            />
          <label className="gpJoin-checkRow">
            <input
              type="checkbox"
              checked={agreeDeadline}
              onChange={(e) => setAgreeDeadline(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>마감 기한 내 목표 수량 미달 시 공구는 자동 취소되며, 결제된 금액은 환불됩니다. 동의하십니까?</span>
          </label>
        </div>

        <div className="gpJoin-section">
          <div className="gpJoin-sectionTitle">물품 수령 장소/시간 확인</div>
          <input className="gpJoin-readonlyInput" value={pickupLocation?.trim() ? pickupLocation : ""} readOnly />
          <input className="gpJoin-readonlyInput" value={pickupAt ? formatPickupDateTime(pickupAt) : ""} readOnly />
          <label className="gpJoin-checkRow">
            <input
              type="checkbox"
              checked={agreePickup}
              onChange={(e) => setAgreePickup(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>
              공구 등록자가 설정한 장소와 시간입니다. 해당 장소와 시간에 물품 수령이 가능한지 반드시 확인 후 공구에 참여해주세요.
            </span>
          </label>
        </div>

        <div className="gpJoin-qtyBlock">
          <div className="gpJoin-label">구매 수량</div>
          <div className="gpJoin-qtyRow">
            <button
              type="button"
              className="gpJoin-qtyBtn"
              onClick={() => setBuyQuantity((v) => clamp(v + 1, minimumOrderUnit, maxBuyQuantity))}
              disabled={isSubmitting || buyQuantity >= maxBuyQuantity || remainingQuantity < minimumOrderUnit}
            >
              +
            </button>

            <div className="gpJoin-qtyValue">{buyQuantity}</div>

            <button
              type="button"
              className="gpJoin-qtyBtn"
              onClick={() => setBuyQuantity((v) => clamp(v - 1, minimumOrderUnit, maxBuyQuantity))}
              disabled={isSubmitting || buyQuantity <= minimumOrderUnit || remainingQuantity < minimumOrderUnit}
            >
              −
            </button>

            <div className="gpJoin-totalPrice">
              총 <b>{totalPricePreview.toLocaleString("ko-KR")}원</b>
            </div>
          </div>
        </div>

        <div className="gpJoin-field">
          <div className="gpJoin-label">연락처</div>
          <input
            className="gpJoin-input"
            placeholder="예) 010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="gpJoin-payBar">
          <button
            type="button"
            className="gpJoin-payBtn gpJoin-naver"
            onClick={() => handlePay("NAVER")}
            disabled={!canSubmit}
          >
            네이버페이
          </button>
          <button
            type="button"
            className="gpJoin-payBtn gpJoin-kakao"
            onClick={() => handlePay("KAKAO")}
            disabled={!canSubmit}
          >
            카카오페이
          </button>
        </div>

        {!user.isLoggedIn && <div className="gpJoin-warn">로그인 후 이용할 수 있어요</div>}

        {user.isLoggedIn && !canSubmit && (
          <div className="gpJoin-warn">필수 입력값 확인해주세요 (체크 2개 + 연락처 + 최소 구매수량 이상 + 남은 수량 이하)</div>
        )}
      </div>
    </div>
  );
}
