import { useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/modal.scss";

export default function ModalMessage({ open, message, onConfirm }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onConfirm]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={onConfirm}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <p id="info-title" className="modal-text">
            {message}
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn return" onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}