import { useRef, useState } from 'react';

export default function SetProfileImage() {
  // 1. 숨겨진 input 엘리먼트에 접근하기 위한 Ref
  const fileInputRef = useRef(null);
  
  // 2. 선택된 파일의 이름을 화면에 표시하기 위한 상태
  const [fileName, setFileName] = useState("");

  const handleButtonClick = () => {
    // 버튼 클릭 시 숨겨진 input을 클릭한 것과 동일한 효과를 냄
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name); // 파일명 저장
      // 여기서 파일 업로드 API를 호출하거나 Preview 로직을 넣습니다.
      console.log("선택된 파일 객체:", file);
    }
  };

  // X 버튼 클릭 시 호출될 초기화 함수
  const handleClear = () => {
    setFileName(""); // 1. 화면에 보이는 파일명 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 2. 숨겨진 파일 인풋의 실제 값 초기화 (중요!)
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* 화면에 보이는 텍스트 인풋 */}
      <div style={{ position: 'relative', flex: 1 }}>
      <input 
        type="text" 
        placeholder="profile image" 
        className="underline-input" 
        value={fileName} 
        readOnly // 직접 입력 방지
      />

      {/* 파일 이름이 있을 때만 X 버튼이 보이도록 조건부 렌더링 */}
      {fileName && (
        <button 
          type="button" 
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '10px', // '파일 찾기' 버튼 위치에 따라 조절
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#FF0000'
          }}
        >
          ✕
        </button>
      )}
      </div>

      {/* 실제로 파일을 찾는 버튼 */}
      <button 
        type="button" 
        className="find-btn" // 원하는 스타일 적용
        onClick={handleButtonClick}
      >
        파일 찾기
      </button>

      {/* 실제로 동작하지만 숨겨진 파일 인풋 */}
      <input 
        type="file" 
        accept="image/*" // 이미지 파일만 선택 가능하게 제한
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  );
}