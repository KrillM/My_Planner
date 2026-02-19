import "../styles/modal.scss";

function ModalMemoRead({ open, close, memo }) {
  const isMemoEmpty = (memo.trim() === "" || memo === `<p><br></p>`);

  if (!open) return null;

  return (
    <div className="modal-overlay memo-read">
      <div className="modal">
        <button
          type="button"
          className="modal-close-btn"
          aria-label="close"
          onClick={close}
        >
          ×
        </button>

        <div className="modal-body">
          {isMemoEmpty 
            ? <p>저장된 메모가 없습니다.</p>
            : <div className="read-memo" dangerouslySetInnerHTML={{ __html: memo }} />
          }
        </div>
      </div>
    </div>
  );
}

export default ModalMemoRead;