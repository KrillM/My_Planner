import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import "../styles/modal.scss";
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

const ModalMemoUpsert = ({ open, onConfirm, onSave, memo }) => {
  const editorRef = useRef();

  useEffect(() => {
    if (!open) return;

    let tries = 0;
    const maxTries = 10;

    const hydrate = () => {
      const inst = editorRef.current?.getInstance?.();
      if (!inst) return;

      const html = (memo && memo.trim() !== "") ? memo : "<p></p>";
      inst.setHTML(html);

      tries += 1;
      if (tries < maxTries) {
        setTimeout(hydrate, 30);
      }
    };

    setTimeout(hydrate, 0);

    return () => {};
    }, [open, memo]);

  if (!open) return null;

  const isDark = document.body.classList.contains("dark");

  const handleSave = () => {
    const inst = editorRef.current.getInstance();
    const data = inst.getHTML();
    onSave?.(data);
    onConfirm();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button type="button" className="modal-close-btn" onClick={onConfirm}>×</button>

        <div className="modal-body">
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
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn return" onClick={handleSave}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalMemoUpsert;