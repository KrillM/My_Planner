import { useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/modal.scss";

export default function ModalLeave({ open, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        onMouseDown={(e) => e.stopPropagation()} // 모달 내부 클릭은 닫히지 않게
      >
        <div className="modal-body">
          <p id="leave-title" className="modal-text">
            회원 탈퇴하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn return" onClick={onClose}>
            Return
          </button>

          <button type="button" className="modal-btn leave" onClick={onConfirm}>
            Leave
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}