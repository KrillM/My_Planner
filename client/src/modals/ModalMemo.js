import { useRef, useEffect, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';
import "../styles/modal.scss";
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

function ModalMemo({ open, onConfirm }) {
  const editorRef = useRef();
  const [content, setContent] = useState("");

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

  const isDark = document.body.classList.contains('dark');

  const handleSave = () => {
    // 에디터 인스턴스에서 HTML 또는 마크다운 가져오기
    const data = editorRef.current.getInstance().getHTML();
    setContent(data);
    console.log(data);
    onConfirm();
  };

  return (
    <div className="modal-overlay">
        <div className="modal">
            <button
                type="button"
                className="modal-close-btn"
                aria-label="close"
                onClick={onConfirm}
            >
                ×
            </button>

            <div className="modal-body">
                  <div className="editor-wrap">
                    <Editor
                        initialValue={content}
                        previewStyle="vertical"
                        height="300px"
                        initialEditType="wysiwyg"
                        theme={isDark ? 'dark' : ''}
                        useCommandShortcut={true}
                        hideModeSwitch={true}   // Markdown/WYSIWYG 스위치 제거
                        toolbarItems={[
                            ['bold', 'ul', 'ol', 'table', 'image', 'link'],
                        ]}
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

export default ModalMemo;