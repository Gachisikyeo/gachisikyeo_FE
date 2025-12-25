// 공구 참여 모달
// src/components/GroupPurchaseJoinModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AuthUser } from "../auth/authStorage";
import type { GroupPurchaseListItem } from "../api/api";

import "./GroupPurchaseJoinModal.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  user: AuthUser;

  productId: number;
  productName: string;

  packagePrice: number; // 박스 가격(예: 12000)
  packCount: number; // 구성 수량(예: 12)
  eachPriceFromBE?: number; // 있으면 이거 우선

  groupPurchase: GroupPurchaseListItem;
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

// "2025-12-31 / 오후 12시" 스타일
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
}: Props) {
  const navigate = useNavigate();

  const minimumOrderUnit = useMemo(() => {
    const raw = (groupPurchase as any)?.minimumOrderUnit as number | undefined;
    if (typeof raw === "number" && raw > 0) return raw;
    return 1;
  }, [groupPurchase]);

  const remainingQuantity = useMemo(() => {
    return Math.max(0, groupPurchase.targetQuantity - groupPurchase.currentQuantity);
  }, [groupPurchase.currentQuantity, groupPurchase.targetQuantity]);

  const eachPrice = useMemo(() => {
    if (typeof eachPriceFromBE === "number" && eachPriceFromBE > 0) return eachPriceFromBE;
    const count = Math.max(1, packCount || 1);
    return Math.round(packagePrice / count);
  }, [eachPriceFromBE, packCount, packagePrice]);

  const [buyQuantity, setBuyQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [agreeDeadline, setAgreeDeadline] = useState(false);
  const [agreePickup, setAgreePickup] = useState(false);

  const maxBuyQuantity = Math.max(0, remainingQuantity);

  useEffect(() => {
    if (!isOpen) return;

    const initQty =
      remainingQuantity <= 0 ? 0 : clamp(minimumOrderUnit, 1, Math.max(1, maxBuyQuantity || 1));

    setBuyQuantity(initQty);
    setPhone("");
    setAgreeDeadline(false);
    setAgreePickup(false);
  }, [isOpen, minimumOrderUnit, maxBuyQuantity, remainingQuantity]);

  const totalPrice = useMemo(() => eachPrice * buyQuantity, [eachPrice, buyQuantity]);

  // ✅ 공구등록모달에서 입력한 값(=공구 데이터)로 채우기
  const groupEndAt = (groupPurchase as any)?.groupEndAt as string | undefined;
  const pickupLocation = (groupPurchase as any)?.pickupLocation as string | undefined;
  const pickupAt = (groupPurchase as any)?.pickupAt as string | undefined;

  const canSubmit =
    remainingQuantity >= minimumOrderUnit &&
    buyQuantity >= minimumOrderUnit &&
    buyQuantity <= maxBuyQuantity &&
    phone.trim().length > 0 &&
    agreeDeadline &&
    agreePickup;

  const handlePay = (method: "NAVER" | "KAKAO") => {
    if (!canSubmit) return;

    const buyerName = user.nickName ?? user.name ?? "익명";
    const orderNo = `GPJ-${Date.now()}`;

    navigate("/payment/success", {
      state: {
        orderNo,
        buyerName,
        phone,
        productId,
        productName,
        totalPrice,
        buyQuantity,
        paymentMethod: method,
        groupPurchaseId: groupPurchase.groupPurchaseId,
      },
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="gpJoin-overlay" onClick={onClose} role="presentation">
      <div className="gpJoin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="gpJoin-header">
          <div className="gpJoin-title">공구 참여하기</div>
          <button type="button" className="gpJoin-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="gpJoin-productTop">
          <div className="gpJoin-productName">{productName}</div>
          <div className="gpJoin-productPrice">
            {eachPrice.toLocaleString("ko-KR")}/{packagePrice.toLocaleString("ko-KR")}원
          </div>
        </div>

        {/* ✅ 공구 마감기한 확인 (공구등록모달 입력값) */}
        <div className="gpJoin-section">
          <div className="gpJoin-sectionTitle">공구 마감기한 확인</div>
          <input
            className="gpJoin-readonlyInput"
            value={groupEndAt ? formatDateOnly(groupEndAt) : ""}
            readOnly
          />
          <label className="gpJoin-checkRow">
            <input
              type="checkbox"
              checked={agreeDeadline}
              onChange={(e) => setAgreeDeadline(e.target.checked)}
            />
            <span>마감 기한 내 목표 수량 미달 시 공구는 자동 취소되며, 결제된 금액은 환불됩니다. 동의하십니까?</span>
          </label>
        </div>

        {/* ✅ 물품 수령 장소/시간 확인 (공구등록모달 입력값) */}
        <div className="gpJoin-section">
          <div className="gpJoin-sectionTitle">물품 수령 장소/시간 확인</div>
          <input className="gpJoin-readonlyInput" value={pickupLocation ?? ""} readOnly />
          <input className="gpJoin-readonlyInput" value={pickupAt ? formatPickupDateTime(pickupAt) : ""} readOnly />
          <label className="gpJoin-checkRow">
            <input type="checkbox" checked={agreePickup} onChange={(e) => setAgreePickup(e.target.checked)} />
            <span>공구 등록자가 설정한 장소와 시간입니다. 해당 장소와 시간에 물품 수령이 가능한지 반드시 확인 후 공구에 참여해주세요.</span>
          </label>
        </div>

        {/* ✅ 구매 수량 */}
        <div className="gpJoin-qtyBlock">
          <div className="gpJoin-label">구매 수량</div>
          <div className="gpJoin-qtyRow">
            {/* ✅ + 먼저 */}
            <button
              type="button"
              className="gpJoin-qtyBtn"
              onClick={() => setBuyQuantity((v) => clamp(v + 1, minimumOrderUnit, maxBuyQuantity))}
              disabled={buyQuantity >= maxBuyQuantity || remainingQuantity < minimumOrderUnit}
            >
              +
            </button>

            <div className="gpJoin-qtyValue">{buyQuantity}</div>

            {/* ✅ - 나중 */}
            <button
              type="button"
              className="gpJoin-qtyBtn"
              onClick={() => setBuyQuantity((v) => clamp(v - 1, minimumOrderUnit, maxBuyQuantity))}
              disabled={buyQuantity <= minimumOrderUnit || remainingQuantity < minimumOrderUnit}
            >
              −
            </button>

            <div className="gpJoin-totalPrice">
              총 <b>{totalPrice.toLocaleString("ko-KR")}원</b>
            </div>
          </div>
        </div>

        {/* ✅ 연락처 */}
        <div className="gpJoin-field">
          <div className="gpJoin-label">연락처</div>
          <input
            className="gpJoin-input"
            placeholder="예) 010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* ✅ 결제 버튼 */}
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

        {!canSubmit && (
          <div className="gpJoin-warn">필수 입력값 확인해줘 (체크 2개 + 연락처 + 최소 구매수량 이상 + 남은 수량 이하)</div>
        )}
      </div>
    </div>
  );
}
