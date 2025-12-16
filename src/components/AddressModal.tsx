import { useEffect, useMemo, useState } from "react";
import "./AddressModal.css";

type DongItem = { id: number; dong: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    sido: string;
    sigungu: string;
    dong: string;
    lawDongId: number;
    label: string; 
  }) => void;
};

export default function AddressModal({ isOpen, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const [sidoList, setSidoList] = useState<string[]>([]);
  const [sigunguList, setSigunguList] = useState<string[]>([]);
  const [dongList, setDongList] = useState<DongItem[]>([]);

  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [dongId, setDongId] = useState<number | null>(null);

  const selectedDong = useMemo(() => dongList.find((d) => d.id === dongId), [dongList, dongId]);

  const canConfirm = !!(sido && sigungu && selectedDong);

  useEffect(() => {
    if (!isOpen) return;

    setSido("");
    setSigungu("");
    setDongId(null);
    setSigunguList([]);
    setDongList([]);

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/law-dong/sido");
        const data = await res.json();
        setSidoList(data ?? []);
      } catch (e) {
        console.error(e);
        alert("아직연동을못함샤갈이거어ㅓ덯게");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  // 시/도 선택 시 → 구 목록 불러오기
  useEffect(() => {
    if (!sido) return;

    setSigungu("");
    setDongId(null);
    setDongList([]);

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/law-dong/sigungu?sido=${encodeURIComponent(sido)}`);
        const data = await res.json();
        setSigunguList(data ?? []);
      } catch (e) {
        console.error(e);
        alert("아직연동을못함샤갈이거어ㅓ덯게");
      } finally {
        setLoading(false);
      }
    })();
  }, [sido]);

  // 구 선택 시 → 동 목록 불러오기 
  useEffect(() => {
    if (!sido || !sigungu) return;

    setDongId(null);

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/law-dong/dong?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}`
        );
        const data = await res.json();

        setDongList(data ?? []);
      } catch (e) {
        console.error(e);
        alert("아직연동을못함샤갈이거어ㅓ덯게해");
      } finally {
        setLoading(false);
      }
    })();
  }, [sido, sigungu]);

  const handleConfirm = () => {
    if (!canConfirm || !selectedDong) return;

    const label = `${sido} ${sigungu} ${selectedDong.dong}`;
    onConfirm({
      sido,
      sigungu,
      dong: selectedDong.dong,
      lawDongId: selectedDong.id,
      label,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="addrOverlay" onMouseDown={onClose}>
      <div className="addrModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="addrHeader">
          <div className="addrTitle">지역 선택</div>
          <button className="addrClose" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="addrBody">
          <div className="addrRow">
            <label className="addrLabel">시/도</label>
            <select
              className="addrSelect"
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              disabled={loading}
            >
              <option value="">선택</option>
              {sidoList.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="addrRow">
            <label className="addrLabel">시/군/구</label>
            <select
              className="addrSelect"
              value={sigungu}
              onChange={(e) => setSigungu(e.target.value)}
              disabled={!sido || loading}
            >
              <option value="">선택</option>
              {sigunguList.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="addrRow">
            <label className="addrLabel">동</label>
            <select
              className="addrSelect"
              value={dongId ?? ""}
              onChange={(e) => setDongId(Number(e.target.value))}
              disabled={!sigungu || loading}
            >
              <option value="">선택</option>
              {dongList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.dong}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="addrFooter">
          <button className="addrBtn cancel" type="button" onClick={onClose}>
            취소
          </button>
          <button
            className={`addrBtn confirm ${!canConfirm ? "isDisabled" : ""}`}
            type="button"
            onClick={handleConfirm}
            aria-disabled={!canConfirm}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}
