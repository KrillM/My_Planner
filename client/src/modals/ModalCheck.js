import { useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/modal.scss";

export default function ModalCheck({ open, onClose, onConfirm, message, btnMsg }) {
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
            {message}
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn return" onClick={onClose}>
            Return
          </button>

          <button type="button" className="modal-btn leave" onClick={onConfirm}>
            {btnMsg}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}