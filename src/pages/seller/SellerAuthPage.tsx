// 판매자 가입 및 인증 페이지
// src/pages/seller/SellerAuthPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import CategoryNav from "../../components/CategoryNav";

import "./SellerAuthPage.css";

import Terms3Modal from "../../components/Terms3Modal";
import Terms4Modal from "../../components/Terms4Modal";
import Terms5Modal from "../../components/Terms5Modal";

import { clearAuth, getAuthUser, type AuthUser } from "../../auth/authStorage";
import { createBusinessInfo, logout } from "../../api/api";

type BusinessInfoRequest = {
  businessNumber: string;
  storeName: string;
  ceoName: string;
  address: string;
  sellerTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  electronicFinanceAgreed: boolean;
};

const SELLER_BIZ_DONE_KEY = "sellerBusinessInfoRegistered";
const SELLER_BIZ_DATA_KEY = "sellerBusinessInfoData";

// 사업자등록번호 형식(예: 123-45-67890)
const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;

function SellerAuthPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser>(() => getAuthUser());

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      setUser({ isLoggedIn: false, userType: "GUEST" });
      navigate("/");
    }
  };

  const [form, setForm] = useState<BusinessInfoRequest>({
    businessNumber: "",
    storeName: "",
    ceoName: "",
    address: "",
    sellerTermsAgreed: false,
    privacyPolicyAgreed: false,
    electronicFinanceAgreed: false,
  });

  const [isBusinessVerified, setIsBusinessVerified] = useState(false);
  const [openTerms, setOpenTerms] = useState<null | 3 | 4 | 5>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    const basicFilled =
      form.businessNumber.trim() &&
      form.storeName.trim() &&
      form.ceoName.trim() &&
      form.address.trim();

    const termsOk =
      form.sellerTermsAgreed &&
      form.privacyPolicyAgreed &&
      form.electronicFinanceAgreed;

    return Boolean(basicFilled) && isBusinessVerified && termsOk;
  }, [form, isBusinessVerified]);

  const onChange =
    (key: keyof BusinessInfoRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMsg("");
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (key === "businessNumber") setIsBusinessVerified(false);
    };

  const onToggle =
    (key: keyof BusinessInfoRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMsg("");
      setForm((prev) => ({ ...prev, [key]: e.target.checked }));
    };

  const handleVerifyBusinessNumber = () => {
    setErrorMsg("");
    const value = form.businessNumber.trim();
    if (!BUSINESS_NUMBER_REGEX.test(value)) {
      setIsBusinessVerified(false);
      setErrorMsg("사업자등록번호 형식이 올바르지 않습니다. 예) 123-45-67890");
      return;
    }
    setIsBusinessVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!canSubmit) {
      setErrorMsg("입력/인증/약관동의를 모두 완료해줘!");
      return;
    }

    try {
      const res = await createBusinessInfo({
        businessNumber: form.businessNumber.trim(),
        storeName: form.storeName.trim(),
        ceoName: form.ceoName.trim(),
        address: form.address.trim(),
        sellerTermsAgreed: form.sellerTermsAgreed,
        privacyPolicyAgreed: form.privacyPolicyAgreed,
        electronicFinanceAgreed: form.electronicFinanceAgreed,
      });

      if (!res.data.success) {
        setErrorMsg(res.data.message || "가입 신청에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      // ✅ “성공했을 때만” 등록 완료 플래그
      localStorage.setItem(SELLER_BIZ_DONE_KEY, "true");
      localStorage.setItem(SELLER_BIZ_DATA_KEY, JSON.stringify(res.data.data));

      navigate("/seller/auth/complete");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "가입 신청에 실패했습니다. 다시 시도해주세요.";
      setErrorMsg(msg);
    }
  };

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="sellerAuth">
        <h1 className="sellerAuth__pageTitle">판매자 가입 및 인증</h1>

        <section className="sellerAuth__card">
          <h2 className="sellerAuth__cardTitle">사업자 정보를 입력해주세요.</h2>

          <form className="sellerAuth__form" onSubmit={handleSubmit}>
            <div className="sellerAuth__row">
              <label className="sellerAuth__label">사업자 등록번호</label>
              <div className="sellerAuth__control sellerAuth__control--verify">
                <input
                  className="sellerAuth__input"
                  value={form.businessNumber}
                  onChange={onChange("businessNumber")}
                  placeholder=""
                />
                <button
                  type="button"
                  className={`sellerAuth__verifyBtn ${isBusinessVerified ? "is-done" : ""}`}
                  onClick={handleVerifyBusinessNumber}
                  disabled={isBusinessVerified}
                >
                  {isBusinessVerified ? "인증완료" : "인증"}
                </button>
              </div>
            </div>

            <div className="sellerAuth__row">
              <label className="sellerAuth__label">상호명(법인명)</label>
              <div className="sellerAuth__control">
                <input
                  className="sellerAuth__input sellerAuth__input--wide"
                  value={form.storeName}
                  onChange={onChange("storeName")}
                />
              </div>
            </div>

            <div className="sellerAuth__row">
              <label className="sellerAuth__label">대표자명</label>
              <div className="sellerAuth__control">
                <input
                  className="sellerAuth__input sellerAuth__input--wide"
                  value={form.ceoName}
                  onChange={onChange("ceoName")}
                />
              </div>
            </div>

            <div className="sellerAuth__row sellerAuth__row--address">
              <label className="sellerAuth__label">사업장 주소</label>
              <div className="sellerAuth__control">
                <input
                  className="sellerAuth__input sellerAuth__input--wide"
                  value={form.address}
                  onChange={onChange("address")}
                />
                <p className="sellerAuth__hint">사업장 주소는 상세 주소까지 포함하여 적어주세요.</p>
              </div>
            </div>

            <div className="sellerAuth__terms">
              <h3 className="sellerAuth__termsTitle">약관동의</h3>

              <div className="sellerAuth__termsRow">
                <label className="sellerAuth__checkLabel">
                  <input
                    type="checkbox"
                    checked={form.sellerTermsAgreed}
                    onChange={onToggle("sellerTermsAgreed")}
                  />
                  판매자 이용약관 동의 (필수)
                </label>
                <button type="button" className="sellerAuth__termsLink" onClick={() => setOpenTerms(3)}>
                  내용보기
                </button>
              </div>

              <div className="sellerAuth__termsRow">
                <label className="sellerAuth__checkLabel">
                  <input
                    type="checkbox"
                    checked={form.privacyPolicyAgreed}
                    onChange={onToggle("privacyPolicyAgreed")}
                  />
                  개인정보 수집 및 이용 동의 (필수)
                </label>
                <button type="button" className="sellerAuth__termsLink" onClick={() => setOpenTerms(4)}>
                  내용보기
                </button>
              </div>

              <div className="sellerAuth__termsRow">
                <label className="sellerAuth__checkLabel">
                  <input
                    type="checkbox"
                    checked={form.electronicFinanceAgreed}
                    onChange={onToggle("electronicFinanceAgreed")}
                  />
                  전자금융거래 이용약관 동의 (필수)
                </label>
                <button type="button" className="sellerAuth__termsLink" onClick={() => setOpenTerms(5)}>
                  내용보기
                </button>
              </div>
            </div>

            {errorMsg && <p className="sellerAuth__error">{errorMsg}</p>}

            <div className="sellerAuth__submitWrap">
              <button type="submit" className="sellerAuth__submitBtn" disabled={!canSubmit}>
                가입 신청
              </button>
            </div>
          </form>
        </section>
      </main>

      <Terms3Modal isOpen={openTerms === 3} onClose={() => setOpenTerms(null)} />
      <Terms4Modal isOpen={openTerms === 4} onClose={() => setOpenTerms(null)} />
      <Terms5Modal isOpen={openTerms === 5} onClose={() => setOpenTerms(null)} />
    </div>
  );
}

export default SellerAuthPage;
