import { useEffect, useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "../styles/modal.scss";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";

function ModalMemoRead({ open, close, memo = "", onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);

  const isDark = document.body.classList.contains("dark");
  const isMemoEmpty = (memo ?? "").trim() === "" || memo === `<p><br></p>`;

  // 모달 닫힐 때 편집모드 초기화
  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open]);

  // 편집모드 들어갈 때 editor hydrate
  useEffect(() => {
    if (!open) return;
    if (!isEditing) return;

    let tries = 0;
    const maxTries = 10;

    const hydrate = () => {
      const inst = editorRef.current?.getInstance?.();
      if (!inst) return;

      const html = (memo && memo.trim() !== "") ? memo : "<p></p>";
      inst.setHTML(html);

      tries += 1;
      if (tries < maxTries) setTimeout(hydrate, 30);
    };

    setTimeout(hydrate, 0);
  }, [open, isEditing, memo]);

  if (!open) return null;

  const handleClear = () => {
    const inst = editorRef.current?.getInstance?.();
    if (!inst) return;
    inst.setHTML("<p></p>");
  };

  const handleSave = () => {
    const inst = editorRef.current?.getInstance?.();
    if (!inst) return;

    const html = inst.getHTML();
    onSave?.(html);      // 부모에 저장 요청
    setIsEditing(false); // 저장 후 읽기 화면으로 복귀
  };

  return (
    <div className="modal-overlay memo-read">
      <div className="modal">
        <button
          type="button"
          className="modal-close-btn"
          aria-label="close"
          onClick={() => {
            setIsEditing(false);
            close?.();
          }}
        >
          ×
        </button>

        <div className="modal-body">
          {!isEditing ? (
            <>
              {isMemoEmpty ? (
                <p>저장된 메모가 없습니다.</p>
              ) : (
                <div className="read-memo" dangerouslySetInnerHTML={{ __html: memo }} />
              )}
            </>
          ) : (
            <div className="editor-wrap">
              <Editor
                initialValue="<p></p>"
                previewStyle="tab"
                height="300px"
                initialEditType="wysiwyg"
                theme={isDark ? "dark" : ""}
                useCommandShortcut={true}
                hideModeSwitch={true}
                toolbarItems={[["bold", "task", "ul", "ol"]]}
                ref={editorRef}
              />
            </div>
          )}
        </div>

        {/* ✅ 아래 버튼 영역: 읽기모드/편집모드에 따라 다르게 */}
        {!isEditing ? (
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn return"
              onClick={() => setIsEditing(true)}
            >
              EDIT
            </button>
          </div>
        ) : (
          <div className="modal-actions">
            <button type="button" className="modal-btn return" onClick={handleSave}>
              SAVE
            </button>
            <button type="button" className="modal-btn leave" onClick={handleClear}>
              CLEAR
            </button>
            <button
              type="button"
              className="modal-btn cancel"
              onClick={() => setIsEditing(false)}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalMemoRead;