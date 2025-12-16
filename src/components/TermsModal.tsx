//약관모달설정
import { useEffect } from "react";
import "./TermsModal.css";

type Props = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function TermsModal({ isOpen, title, onClose, children }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="termsModalOverlay" onMouseDown={onClose}>
      <div className="termsModalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="termsModalHeader">
          <h3 className="termsModalTitle">{title}</h3>
          <button type="button" className="termsModalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="termsModalBody">{children}</div>
      </div>
    </div>
  );
}
