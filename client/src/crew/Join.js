import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.scss';
import '../styles/save.scss';

const Join = () => {
  
  const navigate = useNavigate();

  // 이메일
  // 유효성 상태 관리
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 유효성 검사 함수
  const validateEmail = (value) => {
    setEmail(value);
    
    // 사용자가 내용을 수정하면 중복 확인 결과들을 다 지워버림
    setIsNewEmail(false);
    setIsOldEmail(false);
    setIsEmailCheckButtonClick(false);
    setIsEmailCheck(false);

    // 입력값이 비어있을 때는 경고창을 안 띄우고 싶다면 추가 조건 설정
    if (value === "") {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(emailRegex.test(value));
    }

    if(isEmailEmpty){
      if(value.trim() !== ''){
        setIsEmailEmpty(false)
      }
    }
  };

  // 중복 확인
  // 유효성 상태 관리
  const [isEmailCheck, setIsEmailCheck] = useState(false);
  const [isEmailCheckButtonClick, setIsEmailCheckButtonClick] = useState(false);
  const [isNewEmail, setIsNewEmail] = useState(false);
  const [isOldEmail, setIsOldEmail] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false); // 중복 검사 통과 여부

  const pressEmailCheckBtn = async () => {
    // 입력값이 없을 때는 실행 안 함
    if (!email.trim() || !isEmailValid) {
      setIsEmailEmpty(true);
      return;
    }

    try {
      // JSON 형태로 보낼 경우 (백엔드 req.body에서 받기 위함)
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.result) {
        setIsNewEmail(true);
        setIsOldEmail(false);
        setIsEmailAvailable(true);  
        setIsEmailCheckButtonClick(true); // 버튼 클릭됨
        setIsEmailCheck(false); // "중복 확인 해주세요" 경고 문구 숨김
      } else {
        setIsNewEmail(false);
        setIsOldEmail(true);
        setIsEmailAvailable(false);  
        setIsEmailCheckButtonClick(false); // 버튼 클릭됨
        setIsEmailCheck(false); // "중복 확인 해주세요" 경고 문구 숨김
      }
    } catch (err) {
      console.error("중복 체크 오류:", err);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  // 닉네임
  // 유효성 상태 관리
  const [nickname, setNickname] = useState('');
  const [isNicknameEmpty, setIsNicknameEmpty] = useState(false);

  const validateNickname = (value) => {
    setNickname(value);

    if(isNicknameEmpty){
      if(value.trim()!==''){
        setIsNicknameEmpty(false);
      }
    }
  }

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

  const validatePasswordConfirm = (value) => {
    setPasswordConfirm(value);

    if(isPasswordConfirmEmpty){
      if(value.trim()!==''){
        setIsPasswordConfirmEmpty(false);
      }
    }
  }

  // 프로필 이미지
  // 유효성 상태 관리
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFileName, setProfileImageFileFileName] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
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
  
    // 모든 필드 체크 (경고창을 동시에 띄우기 위해 변수 활용)
    const emailEmpty = email.trim() === "";
    const nicknameEmpty = nickname.trim() === "";
    const passwordConfirmEmpty = passwordConfirm.trim() === "";

    setIsEmailEmpty(emailEmpty);
    setIsNicknameEmpty(nicknameEmpty);
    setIsPasswordConfirmEmpty(passwordConfirmEmpty);

    if(!isEmailValid || 
      isEmailEmpty || 
      isNicknameEmpty || 
      !isPasswordValid || 
      isPasswordNotEqual ||
      isPasswordConfirmEmpty ||
      isOldEmail
      ) {
        return;
      }

    if(!isEmailCheckButtonClick || !isEmailAvailable){
      setIsEmailCheck(true);
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
        formData.append("profileImageFileName", profileImage); // key 이름 중요
      }

      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/join", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "JOIN 실패");
      }

      const data = await res.json();
      console.log("JOIN 성공:", data);
      navigate('/');

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <>
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

          <button 
            type="button" 
            className="save-btn" 
            onClick={pressEmailCheckBtn}>
            중복 확인
          </button>
          {isEmailCheck && (
            <p className="warning-message">
              이메일 중복 확인을 해주세요.
            </p>
          )}

          {isNewEmail&& (
            <p className="success-message">
              사용 가능한 이메일입니다.
            </p>
          )}

          {isOldEmail&& (
            <p className="warning-message">
              이미 사용 중인 이메일입니다.
            </p>
          )}

          <input 
            type="text" 
            placeholder="nickname (필수)" 
            className="underline-input"
            value={nickname}
            onChange={(e)=>validateNickname(e.target.value)}
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
            onChange={(e) => validatePasswordConfirm(e.target.value)}
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

          <div className="profile-image-input-wrapper">
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