// 주소 입력 모달
// src/components/AddressModal.tsx
import { useEffect, useMemo, useState } from "react";
import "./AddressModal.css";
import { getDongList, getSidoList, getSigunguList, resolveLawDong } from "../api/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    sido: string;
    sigungu: string;
    dong: string;
    lawCode: string;
    label: string;
  }) => void;
};

export default function AddressModal({ isOpen, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const [sidoList, setSidoList] = useState<string[]>([]);
  const [sigunguList, setSigunguList] = useState<string[]>([]);
  const [dongList, setDongList] = useState<string[]>([]);

  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [dong, setDong] = useState("");

  const canConfirm = useMemo(() => Boolean(sido && sigungu && dong), [sido, sigungu, dong]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let alive = true;

    setSido("");
    setSigungu("");
    setDong("");
    setSigunguList([]);
    setDongList([]);
    setSidoList([]);

    (async () => {
      try {
        setLoading(true);
        const res = await getSidoList();
        if (!alive) return;
        setSidoList(res.data.data ?? []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        alert("지역 목록을 불러오지 못했어요");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!sido) return;

    let alive = true;

    setSigungu("");
    setDong("");
    setSigunguList([]);
    setDongList([]);

    (async () => {
      try {
        setLoading(true);
        const res = await getSigunguList(sido);
        if (!alive) return;
        setSigunguList(res.data.data ?? []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        alert("시/군/구 목록을 불러오지 못했어요");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, sido]);

  useEffect(() => {
    if (!isOpen) return;
    if (!sido || !sigungu) return;

    let alive = true;

    setDong("");
    setDongList([]);

    (async () => {
      try {
        setLoading(true);
        const res = await getDongList(sido, sigungu);
        if (!alive) return;
        setDongList(res.data.data ?? []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        alert("동 목록을 불러오지 못했어요");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, sido, sigungu]);

  const handleConfirm = async () => {
    if (!canConfirm || loading) return;

    try {
      setLoading(true);

      let res: any;

      try {
        res = await (resolveLawDong as any)({ sido, sigungu, dong });
      } catch (err: any) {
        if (err instanceof TypeError) {
          res = await (resolveLawDong as any)(sido, sigungu, dong);
        } else {
          throw err;
        }
      }

      const ok = res.data?.success;
      const data = res.data?.data;
      const lawCode = data?.lawCode ?? (data?.id != null ? String(data.id) : null);

      if (!ok || !lawCode) {
        alert(res.data?.message || "지역 정보를 확정하지 못했어요");
        return;
      }

      const label = `${sido} ${sigungu} ${dong}`;
      onConfirm({ sido, sigungu, dong, lawCode, label });
      onClose();
    } catch (e: any) {
      console.error(e);

      const status = e?.response?.status;
      if (status === 404) {
        alert("선택한 지역을 찾을 수 없어요");
      } else {
        alert("지역 정보를 확정하지 못했어요");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="addrOverlay" onMouseDown={onClose}>
      <div className="addrModal addrModalChips" onMouseDown={(e) => e.stopPropagation()}>
        <div className="addrHeader addrHeaderCenter">
          <div className="addrTitle">지역 설정</div>
          <button className="addrClose" type="button" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <div className="addrBodyChips">
          <div className="addrSection">
            <div className="addrSectionTitle">시/도</div>
            <div className="addrChipGrid">
              {sidoList.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`addrChip ${sido === x ? "isActive" : ""}`}
                  onClick={() => setSido(x)}
                  disabled={loading}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div className={`addrSection ${!sido ? "isDisabled" : ""}`}>
            <div className="addrSectionTitle">시/군/구</div>
            <div className="addrChipGrid">
              {sigunguList.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`addrChip ${sigungu === x ? "isActive" : ""}`}
                  onClick={() => setSigungu(x)}
                  disabled={!sido || loading}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div className={`addrSection ${!sigungu ? "isDisabled" : ""}`}>
            <div className="addrSectionTitle">읍/면/동</div>
            <div className="addrChipGrid">
              {dongList.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`addrChip ${dong === x ? "isActive" : ""}`}
                  onClick={() => setDong(x)}
                  disabled={!sigungu || loading}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="addrFooterChips">
          <button
            className={`addrPrimary ${!canConfirm ? "isDisabled" : ""}`}
            type="button"
            onClick={handleConfirm}
            aria-disabled={!canConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? "저장 중..." : "지역 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
