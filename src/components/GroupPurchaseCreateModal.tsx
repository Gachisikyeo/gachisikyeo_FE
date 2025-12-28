// 공구 등록 모달
// src/components/GroupPurchaseCreateModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../auth/authStorage";

import { createGroupPurchase } from "../api/api";
import "./GroupPurchaseCreateModal.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  productId: number;
  productName: string;

  packagePrice: number;
  packCount: number;

  eachPriceFromBE?: number;

  user: AuthUser;

  onPaid?: (payload: {
    productId: number;
    productName: string;

    totalPrice: number;

    groupPurchaseId: number;

    eachPrice: number; // 개당 가격
    packagePrice: number; // 박스(전체) 가격
    packCount: number; // 1박스 구성 수량(개)
    hostBuyQuantity: number; // 총대 구매 수량(개)
    remainingQuantity: number; // 남은 수량(개)

    paymentMethod: "NAVER" | "KAKAO";
  }) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toISOStringWithOffset(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.trim().split(":").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const DD = pad(dt.getDate());
  const HH = pad(dt.getHours());
  const Min = pad(dt.getMinutes());
  const SS = pad(dt.getSeconds());

  const offsetMin = -dt.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offM = pad(Math.abs(offsetMin) % 60);

  return `${yyyy}-${MM}-${DD}T${HH}:${Min}:${SS}${sign}${offH}:${offM}`;
}

function onlyDigits(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function buildTime24hFromAmPm(meridiem: "AM" | "PM", hour12: number, minute: number): string {
  const base = hour12 % 12;
  const h24 = meridiem === "PM" ? base + 12 : base;
  const hh = String(h24).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function GroupPurchaseCreateModal({
  isOpen,
  onClose,
  productId,
  productName,
  packagePrice,
  packCount,
  eachPriceFromBE,
  user,
  onPaid,
}: Props) {
  const [targetBoxes, setTargetBoxes] = useState(1);
  const [qty, setQty] = useState(1);
  const [minUnit, setMinUnit] = useState(1);

  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [endDate, setEndDate] = useState("");

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");

  const [pickupMeridiem, setPickupMeridiem] = useState<"AM" | "PM">("PM");
  const [pickupHour, setPickupHour] = useState("");
  const [pickupMinute, setPickupMinute] = useState("");
  const [pickupAt, setPickupAt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const regionId = user?.lawDong?.id ?? 0;

  const unitPerBox = useMemo(() => (packCount > 0 ? packCount : 12), [packCount]);

  const targetQuantity = useMemo(() => Math.max(1, targetBoxes) * unitPerBox, [targetBoxes, unitPerBox]);

  const maxHostQty = targetQuantity > 1 ? targetQuantity - 1 : targetQuantity;

  const remainingQty = Math.max(0, targetQuantity - qty);

  const maxMinUnit = Math.max(1, remainingQty);

  const eachPrice = useMemo(() => {
    if (typeof eachPriceFromBE === "number" && eachPriceFromBE > 0) return eachPriceFromBE;
    const count = Math.max(1, packCount || 1);
    return Math.round(packagePrice / count);
  }, [eachPriceFromBE, packCount, packagePrice]);

  const totalPrice = useMemo(() => eachPrice * qty, [eachPrice, qty]);

  const groupEndAt = useMemo(() => {
    if (!endDate) return "";
    return endDate;
  }, [endDate]);

  const pickupAtOk = useMemo(() => {
    if (!pickupDate) return false;

    const h = Number(pickupHour);
    const m = Number(pickupMinute);

    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    if (pickupHour.trim() === "" || pickupMinute.trim() === "") return false;
    if (h < 1 || h > 12) return false;
    if (m < 0 || m > 59) return false;

    return true;
  }, [pickupDate, pickupHour, pickupMinute]);

  useEffect(() => {
    if (!isOpen) return;

    if (!pickupAtOk) {
      setPickupAt("");
      return;
    }

    const h = Number(pickupHour);
    const m = Number(pickupMinute);
    const time24 = buildTime24hFromAmPm(pickupMeridiem, h, m);
    setPickupAt(toISOStringWithOffset(pickupDate, time24));
  }, [isOpen, pickupAtOk, pickupDate, pickupMeridiem, pickupHour, pickupMinute]);

  useEffect(() => {
    if (!isOpen) return;

    setTargetBoxes(1);
    setQty(1);
    setMinUnit(1);

    setPhone("");
    setEndDate("");
    setShippingAddress("");

    setPickupLocation("");
    setPickupDate("");

    setPickupMeridiem("PM");
    setPickupHour("");
    setPickupMinute("");
    setPickupAt("");

    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setTargetBoxes((v) => clamp(v, 1, 9999));
    setQty((v) => clamp(v, 1, maxHostQty));
    setMinUnit((v) => clamp(v, 1, maxMinUnit));
  }, [isOpen, maxHostQty, maxMinUnit]);

  const canSubmit =
    user.isLoggedIn &&
    user.userType === "BUYER" &&
    regionId > 0 &&
    targetBoxes >= 1 &&
    qty >= 1 &&
    qty <= maxHostQty &&
    remainingQty >= 1 &&
    minUnit >= 1 &&
    minUnit <= maxMinUnit &&
    phone.trim().length > 0 &&
    shippingAddress.trim().length > 0 &&
    endDate.length > 0 &&
    pickupLocation.trim().length > 0 &&
    pickupDate.length > 0 &&
    pickupAtOk &&
    pickupAt.length > 0 &&
    groupEndAt.length > 0;

  const handlePay = async (method: "NAVER" | "KAKAO") => {
    if (!canSubmit) {
      alert("필수 입력값을 확인해주세요");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        hostBuyQuantity: qty,
        targetQuantity,
        minimumOrderUnit: minUnit,
        groupEndAt,
        deliveryLocation: shippingAddress.trim(),
        pickupLocation: pickupLocation.trim(),
        pickupAt,
        hostContact: phone.trim(),
        pickupAfterEnd: true,
      };

      const res = await createGroupPurchase(productId, body);
      const groupPurchaseId = Number(res.data.data?.groupPurchaseId ?? 0);

      onPaid?.({
        productId,
        productName,
        totalPrice,
        groupPurchaseId,
        eachPrice,
        packagePrice,
        packCount: unitPerBox,
        hostBuyQuantity: qty,
        remainingQuantity: remainingQty,
        paymentMethod: method,
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("공구 등록에 실패했어요");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gp-modalOverlay" onClick={onClose} role="presentation">
      <div className="gp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="gp-header">
          <div className="gp-title">공구 등록하기</div>
          <button
            type="button"
            className="gp-closeBtn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="gp-productTop">
          <div className="gp-productName">{productName}</div>
          <div className="gp-productPrice">
            {eachPrice.toLocaleString("ko-KR")}/{packagePrice.toLocaleString("ko-KR")}원
          </div>
        </div>
        <div className="gp-subNote">(참고) 1박스 구성 {unitPerBox}개</div>

        <div className="gp-qtyBlock">
          <div className="gp-qtyGrid">
            <div className="gp-qtyCol">
              <div className="gp-label">목표 수량 (박스)</div>
              <input
                className="gp-input"
                type="number"
                min={1}
                value={targetBoxes}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setTargetBoxes(Number.isFinite(n) ? clamp(n, 1, 9999) : 1);
                }}
                disabled={isSubmitting}
              />
              <div className="gp-subNote" style={{ marginTop: 6 }}>
                총 목표 <b>{targetQuantity}</b>개 (1박스 {unitPerBox}개)
              </div>
            </div>

            <div className="gp-qtyCol gp-qtyColRight">
              <div className="gp-label">총대 구매 수량 (개)</div>

              <div className="gp-qtyRow">
                <button
                  type="button"
                  className="gp-qtyBtn"
                  onClick={() => setQty((v) => clamp(v + 1, 1, maxHostQty))}
                  disabled={isSubmitting || qty >= maxHostQty}
                >
                  +
                </button>

                <div className="gp-qtyValue">{qty}</div>

                <div className="gp-helper gp-helperInline">현재 남은 개수 {remainingQty}</div>

                <button
                  type="button"
                  className="gp-qtyBtn"
                  onClick={() => setQty((v) => clamp(v - 1, 1, maxHostQty))}
                  disabled={isSubmitting || qty <= 1}
                >
                  −
                </button>

                <div className="gp-totalPrice">
                  총 <b>{totalPrice.toLocaleString("ko-KR")}원</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="gp-form">
          <div className="gp-field">
            <div className="gp-label">구매가능 최소수량</div>
            <input
              className="gp-input"
              type="number"
              min={1}
              max={maxMinUnit}
              value={minUnit}
              onChange={(e) => {
                const n = Number(e.target.value);
                setMinUnit(Number.isFinite(n) ? n : 1);
              }}
              disabled={isSubmitting || remainingQty <= 0}
            />
            <div className="gp-subNote" style={{ marginTop: "6px" }}>
              참여자는 최소 <b>{minUnit}</b>개 이상 구매해야 해요. (현재 남은 개수 {remainingQty}개)
            </div>
          </div>

          <div className="gp-field">
            <div className="gp-label">배송지</div>
            <input
              className="gp-input"
              placeholder="예) 서울시 구로구 ○○로 ○○, ○○동 ○○호 상세주소 포함*"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="gp-field">
            <div className="gp-label">물품 수령 장소</div>
            <input
              className="gp-input"
              placeholder="예) 서울시 종로구 ○○로 ○○, ○○동 ○○호 상세주소 포함*"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="gp-rowEndPhone">
            <div className="gp-field">
              <div className="gp-label">
                마감 날짜{" "}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>(날짜만 입력)</span>
              </div>
              <input
                className="gp-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="gp-field">
              <div className="gp-label">연락처</div>
              <input
                className="gp-input"
                placeholder="예) 010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="gp-row2">
            <div className="gp-field">
              <div className="gp-label">수령 날짜</div>
              <input
                className="gp-input"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="gp-field">
              <div className="gp-label">수령 시간</div>

              <div className="gp-timeRow">
                <button
                  type="button"
                  className={`gp-meridiemBtn ${pickupMeridiem === "AM" ? "isActive" : ""}`}
                  onClick={() => setPickupMeridiem("AM")}
                  disabled={isSubmitting}
                >
                  오전
                </button>

                <button
                  type="button"
                  className={`gp-meridiemBtn ${pickupMeridiem === "PM" ? "isActive" : ""}`}
                  onClick={() => setPickupMeridiem("PM")}
                  disabled={isSubmitting}
                >
                  오후
                </button>

                <input
                  className="gp-input gp-timeInput"
                  placeholder="시"
                  inputMode="numeric"
                  value={pickupHour}
                  onChange={(e) => setPickupHour(onlyDigits(e.target.value, 2))}
                  disabled={isSubmitting}
                />
                <span className="gp-timeColon">:</span>
                <input
                  className="gp-input gp-timeInput"
                  placeholder="분"
                  inputMode="numeric"
                  value={pickupMinute}
                  onChange={(e) => setPickupMinute(onlyDigits(e.target.value, 2))}
                  disabled={isSubmitting}
                />
              </div>

              {!pickupAtOk && (pickupHour.length > 0 || pickupMinute.length > 0) && (
                <div className="gp-warnInline">시간을 올바르게 입력해주세요 (시: 1~12 / 분: 00~59)</div>
              )}
            </div>
          </div>
        </div>

        <div className="gp-payBar">
          <button
            type="button"
            className="gp-payBtn gp-naver"
            onClick={() => handlePay("NAVER")}
            disabled={isSubmitting || !canSubmit}
          >
            네이버페이로 결제
          </button>

          <button
            type="button"
            className="gp-payBtn gp-kakao"
            onClick={() => handlePay("KAKAO")}
            disabled={isSubmitting || !canSubmit}
          >
            카카오페이로 결제
          </button>
        </div>

        {!canSubmit && (
          <div className="gp-warn">
            필수 입력값을 확인해주세요 (목표수량 / 연락처 / 남은 수량 1개 이상 / 배송지 / 마감날짜 / 수령날짜 / 수령시간 /
            장소)
          </div>
        )}
      </div>
    </div>
  );
}
