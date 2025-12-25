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

    eachPrice: number; // 개당 가격
    packagePrice: number; // 박스(전체) 가격
    packCount: number; // 구성 수량(예: 12)
    hostBuyQuantity: number; // 총대 구매 수량
    remainingQuantity: number; // 남은 수량

    paymentMethod: "NAVER" | "KAKAO";
  }) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toISOFromDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.trim().split(":").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0);
  return dt.toISOString();
}

function onlyDigits(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function buildTime24hFromAmPm(
  meridiem: "AM" | "PM",
  hour12: number,
  minute: number
): string {
  const base = hour12 % 12; // 12시 -> 0으로
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
  const [qty, setQty] = useState(1);

  const [phone, setPhone] = useState("");

  const targetQty = packCount > 0 ? packCount : 12;

  const maxHostQty = targetQty > 1 ? targetQty - 1 : targetQty;

  const [minUnit, setMinUnit] = useState(1);

  const remainingQty = Math.max(0, targetQty - qty);

  // 최소 구매 단위는 남은 수량을 넘지 않게
  const maxMinUnit = Math.max(1, remainingQty);

  // 마감 날짜만 받기 (마감 시간은 23:59 고정)
  const [endDate, setEndDate] = useState("");

  const [shippingAddress, setShippingAddress] = useState("");

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");

  // 수령 시간: 오전/오후 + 시/분 입력 > pickupAt으로 하나로 저장
  const [pickupMeridiem, setPickupMeridiem] = useState<"AM" | "PM">("PM");
  const [pickupHour, setPickupHour] = useState(""); // 1~12
  const [pickupMinute, setPickupMinute] = useState(""); // 00~59
  const [pickupAt, setPickupAt] = useState(""); 

  const [isSubmitting, setIsSubmitting] = useState(false);

  const eachPrice = useMemo(() => {
    if (typeof eachPriceFromBE === "number" && eachPriceFromBE > 0) return eachPriceFromBE;
    const count = Math.max(1, packCount || 1);
    return Math.round(packagePrice / count);
  }, [eachPriceFromBE, packCount, packagePrice]);

  const totalPrice = useMemo(() => eachPrice * qty, [eachPrice, qty]);

  const groupEndAt = useMemo(() => {
    if (!endDate) return "";
    return toISOFromDateTime(endDate, "23:59");
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
    setPickupAt(toISOFromDateTime(pickupDate, time24));
  }, [isOpen, pickupAtOk, pickupDate, pickupMeridiem, pickupHour, pickupMinute]);

  useEffect(() => {
    if (!isOpen) return;

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

    setQty((v) => clamp(v, 1, maxHostQty));
    setMinUnit((v) => clamp(v, 1, maxMinUnit));
  }, [isOpen, maxHostQty, maxMinUnit]);

  const canSubmit =
    user.userType === "SELLER" &&
    user.lawDongId > 0 &&
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
      alert("필수 입력값을 확인해줘! (연락처 + 수령 시간은 오전/오후+시/분 입력 후 24시로 변환돼 저장돼)");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        regionId: user.lawDongId,
        hostBuyQuantity: qty,
        targetQuantity: targetQty,
        minimumOrderUnit: minUnit,
        groupEndAt, 
        pickupLocation: pickupLocation.trim(),
        pickupAt, 
      };

      const USE_MOCK = true;
      if (USE_MOCK) {
        console.log("[MOCK] createGroupPurchase", { productId, body, shippingAddress, phone, method });
      } else {
        await createGroupPurchase(productId, body);
      }

      onPaid?.({
        productId,
        productName,
        totalPrice,
        eachPrice,
        packagePrice,
        packCount,
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
          <button type="button" className="gp-closeBtn" onClick={onClose} disabled={isSubmitting} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="gp-productTop">
          <div className="gp-productName">{productName}</div>
          <div className="gp-productPrice">
            {eachPrice.toLocaleString("ko-KR")}/{packagePrice.toLocaleString("ko-KR")}원
          </div>
        </div>
        <div className="gp-subNote">(참고) 1박스 구성 {packCount}개</div>

        <div className="gp-qtyBlock">
          <div className="gp-label">총대 구매 수량</div>

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

          <div className="gp-subNote"></div>
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
              참여자는 최소 <b>{minUnit}</b>개 이상 구매해야 해요. (현재 남은 {remainingQty}개)
            </div>
          </div>

          <div className="gp-field">
            <div className="gp-label">배송지</div>
            <input
              className="gp-input"
              placeholder="예) 서울시 구로구 ○○로 ○○, ○○동 ○○호 상세주소 포함‼️"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="gp-field">
            <div className="gp-label">물품 수령 장소</div>
            <input
              className="gp-input"
              placeholder="예) 서울시 종로구 ○○로 ○○, ○○동 ○○호 상세주소 포함‼️"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="gp-field">
            <div className="gp-label">
              마감 날짜{" "}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>(해당 날짜 23:59 마감)</span>
            </div>
            <input
              className="gp-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* ✅ 수령 날짜/시간 */}
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

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="gp-qtyBtn"
                  onClick={() => setPickupMeridiem("AM")}
                  disabled={isSubmitting}
                  style={{
                    width: 56,
                    fontSize: 13,
                    fontWeight: 800,
                    background: pickupMeridiem === "AM" ? "#111827" : "#fff",
                    color: pickupMeridiem === "AM" ? "#fff" : "#111827",
                  }}
                >
                  오전
                </button>

                <button
                  type="button"
                  className="gp-qtyBtn"
                  onClick={() => setPickupMeridiem("PM")}
                  disabled={isSubmitting}
                  style={{
                    width: 56,
                    fontSize: 13,
                    fontWeight: 800,
                    background: pickupMeridiem === "PM" ? "#111827" : "#fff",
                    color: pickupMeridiem === "PM" ? "#fff" : "#111827",
                  }}
                >
                  오후
                </button>

                <input
                  className="gp-input"
                  placeholder="시"
                  inputMode="numeric"
                  value={pickupHour}
                  onChange={(e) => setPickupHour(onlyDigits(e.target.value, 2))}
                  disabled={isSubmitting}
                  style={{ width: 72 }}
                />
                <span style={{ fontWeight: 900, color: "#6b7280" }}>:</span>
                <input
                  className="gp-input"
                  placeholder="분"
                  inputMode="numeric"
                  value={pickupMinute}
                  onChange={(e) => setPickupMinute(onlyDigits(e.target.value, 2))}
                  disabled={isSubmitting}
                  style={{ width: 72 }}
                />
              </div>

              <div className="gp-helper"></div>

              {!pickupAtOk && (pickupHour.length > 0 || pickupMinute.length > 0) && (
                <div className="gp-warnInline">시간을 올바르게 입력해주세요 (시: 1~12 / 분: 00~59)</div>
              )}
            </div>
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
            필수 입력값을 확인해주세요 (연락처 / 남은 수량 1개 이상 / 배송지 / 마감날짜 / 수령날짜 / 수령시간 / 장소)
          </div>
        )}
      </div>
    </div>
  );
}
