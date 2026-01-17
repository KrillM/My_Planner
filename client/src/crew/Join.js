import { useState, useRef } from 'react';
import Header from '../components/Header';
import '../styles/login.scss';
import '../styles/save.scss';

const Join = () => {
  
  // 이메일
  // 유효성 상태 관리
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 유효성 검사 함수
  const validateEmail = (value) => {
    setEmail(value);
    
    // 입력값이 비어있을 때는 경고창을 안 띄우고 싶다면 추가 조건 설정
    if (value === "") {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(emailRegex.test(value));
    }
  };

  // 닉네임
  // 유효성 상태 관리
  const [nickname, setNickname] = useState('');
  const [isNicknameEmpty, setIsNicknameEmpty] = useState(false);

  // 비밀번호
  // 유효성 상태 관리
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

  // 유효성 검사 함수
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // 실시간 검증
    if (value === "") {
      setIsPasswordValid(false);
    } else {
      setIsPasswordValid(passwordRegex.test(value));
    }
  };

  // 비밀번호 확인 Confirm
  // 유효성 상태 관리
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const isPasswordNotEqual = passwordConfirm.length > 0 && password !== passwordConfirm;
  const [isPasswordConfirmEmpty, setIsPasswordConfirmEmpty] = useState(false);

  // 프로필 이미지
  // 유효성 상태 관리
  const fileInputRef = useRef(null);
  const [profileImageFileName, setProfileImageFileFileName] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFileFileName(file.name); // 파일명 저장
      // 여기서 파일 업로드 API를 호출하거나 Preview 로직을 넣는다.
      console.log("선택된 파일 객체:", file);
    }
  };
  
  // X 버튼 클릭 시 호출될 초기화 함수
  const handleClear = () => {
    setProfileImageFileFileName(""); // 1. 화면에 보이는 파일명 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 2. 숨겨진 파일 인풋의 실제 값 초기화 (중요!)
    }
  };

  // 좌우명
  // 유효성 상태 관리
  const [motto, setMotto] = useState('');

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if(email.trim().length === 0) {
      setIsEmailEmpty(true);
    }
    else{
      setIsEmailEmpty(false);
    }

    if(nickname.trim().length === 0) {
      setIsNicknameEmpty(true);
    }
    else{
      setIsNicknameEmpty(false);
    }

    if(passwordConfirm.trim().length === 0) {
      setIsPasswordConfirmEmpty(true);
    }
    else{
      setIsPasswordConfirmEmpty(false);
    }

    if(!isEmailValid || 
      isEmailEmpty || 
      isNicknameEmpty || 
      !isPasswordValid || 
      isPasswordNotEqual ||
      isPasswordConfirmEmpty
    ) {
        return;
      }

    // 서버로 전송
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("nickname", nickname);
      formData.append("password", password);
      formData.append("motto", motto);

      // 파일은 "파일 객체"를 넣어야 함 (파일명 말고)
      // 지금 코드는 file.name만 저장하고 있어서 파일 객체를 state로 따로 저장해야 함
      if (profileImageFileName) {
        formData.append("profileImage", profileImageFileName); // key 이름 중요
      }

      const res = await fetch("http://localhost:8080/crew/join", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "JOIN 실패");
      }

      const data = await res.json();
      console.log("JOIN 성공:", data);

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <>
    <Header/>
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input 
            type="email" 
            placeholder="email (필수)" 
            className="underline-input"
            value={email}
            onChange={(e) => validateEmail(e.target.value)}
          />
          
          {!isEmailValid && (
            <p className="warning-message">
              이메일 형식을 지켜주세요.
            </p>
          )}

          {isEmailEmpty && (
            <p className="warning-message">
              이메일을 입력해주세요.
            </p>
          )}

          <input 
            type="text" 
            placeholder="nickname (필수)" 
            className="underline-input"
            value={nickname}
            onChange={(e)=>setNickname(e.target.value)}
          />
          
          {isNicknameEmpty && (
            <p className="warning-message">
              닉네임을 입력해주세요.
            </p>
          )}

          <input 
            type="password" 
            placeholder="password (필수)" 
            className="underline-input"
            value={password}
            onChange={handlePasswordChange}
          />
          
          {!isPasswordValid && (
            <p className="warning-message">
              8~20자 사이 문자, 숫자, 특수문자를 포함해야 합니다.
            </p>
          )}

          <input 
            type="password" 
            placeholder="password confirm (필수)" 
            className="underline-input"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {isPasswordNotEqual && (
            <p className="warning-message">
              비밀번호와 일치해야 합니다.
            </p>
          )}

          {isPasswordConfirmEmpty && (
            <p className="warning-message">
              비밀번호를 확인해주세요.
            </p>
          )}

          <div className='profile-image-bar'>
            {/* 화면에 보이는 텍스트 인풋 */}
            <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="profile image" 
              className="underline-input" 
              value={profileImageFileName} 
              readOnly // 직접 입력 방지
            />

            {/* 파일 이름이 있을 때만 X 버튼이 보이도록 조건부 렌더링 */}
            {profileImageFileName && (
              <button 
                type="button" 
                onClick={handleClear}
                className='profile-image-cancel'
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

          <input 
            type="text" 
            placeholder="motto" 
            className="underline-input"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            />
        </div>

        <button type="submit" className="save-btn">JOIN</button>
      </form>
    </div>
    </>
  );
};

export default Join;