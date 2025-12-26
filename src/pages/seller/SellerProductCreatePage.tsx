// 판매자 상품 등록 페이지
// src/pages/seller/SellerProductCreatePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header";
import CategoryNav from "../../components/CategoryNav";

import { clearAuth, getAuthUser, type AuthUser } from "../../auth/authStorage";
import { createProduct, logout, type ProductCategory } from "../../api/api";

import "./SellerProductCreatePage.css";

export default function SellerProductCreatePage() {
  const navigate = useNavigate();
  const user = useMemo<AuthUser>(() => getAuthUser(), []);

  const [category, setCategory] = useState<ProductCategory | "">("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [unitQuantity, setUnitQuantity] = useState<string>("");
  const [description, setDescription] = useState("");

  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // SELLER만 접근 제한 가능
    // if (!user.isLoggedIn || user.userType !== "SELLER") navigate("/");
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("logout failed:", e);
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  const onlyNumber = (v: string) => v.replace(/[^\d]/g, "");
  const handlePickFile = () => fileInputRef.current?.click();

  const toggleCategory = (value: ProductCategory) => {
    setCategory((prev) => (prev === value ? "" : value));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setImageFile(file);
  };

  const validate = () => {
    if (!category) return "카테고리를 선택해주세요";
    if (!productName.trim()) return "상품명을 입력해주세요";
    if (!price || Number(price) <= 0) return "판매가를 제대로 입력해줘!";
    if (stockQuantity === "" || Number(stockQuantity) < 0) return "재고수량을 제대로 입력해주세요";
    if (!unitQuantity || Number(unitQuantity) <= 0) return "구성수량을 제대로 입력해주세요";
    if (!imageFile) return "대표 이미지(필수)를 등록해주세요";
    if (!description.trim()) return "상세 정보를 입력해주세요";
    return "";
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createProduct(
        {
          category: category as ProductCategory,
          productName: productName.trim(),
          price: Number(price),
          stockQuantity: Number(stockQuantity),
          unitQuantity: Number(unitQuantity),
          descriptionTitle: productName.trim(),
          description: description.trim(),
        },
        imageFile as File
      );

      if (!res.data.success) {
        alert(res.data.message || "상품 등록 실패");
        return;
      }

      alert("상품 등록 완료");
      navigate("/seller/product/complete");
    } catch (e: any) {
      console.error(e);
      const msg2 = e?.response?.data?.message || e?.message || "상품 등록 실패";
      alert(msg2);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spcPage">
      <Header user={user} onLogout={handleLogout} />
      <CategoryNav user={user} />

      <main className="spcMain">
        <div className="spcContainer">
          <h2 className="spcTitle">상품 등록</h2>

          <section className="spcSection">
            <div className="spcSectionHead">1.&nbsp; 상품 기본 정보</div>

            <div className="spcRow">
              <div className="spcLabel">카테고리</div>
              <div className="spcField spcField--checks">
                <label className="spcCheck">
                  <input
                    type="checkbox"
                    checked={category === "FOOD"}
                    onChange={() => toggleCategory("FOOD")}
                  />
                  <span>식품</span>
                </label>

                <label className="spcCheck">
                  <input
                    type="checkbox"
                    checked={category === "NON_FOOD"}
                    onChange={() => toggleCategory("NON_FOOD")}
                  />
                  <span>비식품</span>
                </label>

                <label className="spcCheck">
                  <input
                    type="checkbox"
                    checked={category === "CLOTHES"}
                    onChange={() => toggleCategory("CLOTHES")}
                  />
                  <span>의류</span>
                </label>
              </div>
            </div>

            <div className="spcRow">
              <div className="spcLabel">상품명</div>
              <div className="spcField">
                <input
                  className="spcInput spcInput--wide"
                  placeholder="예) 프리미엄 샤인머스캣"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
            </div>

            <div className="spcRow">
              <div className="spcLabel">판매가</div>
              <div className="spcField">
                <input
                  className="spcInput"
                  placeholder="숫자만 입력"
                  value={price}
                  onChange={(e) => setPrice(onlyNumber(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="spcRow">
              <div className="spcLabel">재고수량</div>
              <div className="spcField">
                <input
                  className="spcInput"
                  placeholder="숫자만 입력"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(onlyNumber(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="spcRow">
              <div className="spcLabel">구성수량</div>
              <div className="spcField">
                <input
                  className="spcInput"
                  placeholder="숫자만 입력"
                  value={unitQuantity}
                  onChange={(e) => setUnitQuantity(onlyNumber(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>
          </section>

          <section className="spcSection">
            <div className="spcSectionHead">2.&nbsp; 상품 이미지</div>

            <div className="spcRow spcRow--top">
              <div className="spcLabel">
                대표 이미지<br />(필수)
              </div>

              <div className="spcField">
                <div
                  className="spcImageBox"
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                  onClick={handlePickFile}
                  role="button"
                  tabIndex={0}
                >
                  <div className="spcImageBoxInner">
                    <div className="spcImageHint">대표 이미지 등록(필수)</div>
                    <button
                      className="spcFileBtn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickFile();
                      }}
                      disabled={submitting}
                    >
                      파일 선택
                    </button>
                    {imageFile && <div className="spcUploaded">선택 완료</div>}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  className="spcHiddenFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </section>

          <section className="spcSection">
            <div className="spcSectionHead">3.&nbsp; 상세 설명</div>

            <div className="spcRow spcRow--top">
              <div className="spcLabel">상세 정보 입력</div>
              <div className="spcField">
                <textarea
                  className="spcTextarea"
                  placeholder="상품에 대한 자세한 정보를 입력해주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="spcSubmitWrap">
            <button
              className="spcSubmitBtn"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "상품 등록하기"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
