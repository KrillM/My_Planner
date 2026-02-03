import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalLeaveCheck from '../modals/ModalLeaveCheck';
import ModalMessage from '../modals/ModalMessage';
import '../styles/login.scss';
import '../styles/save.scss';

const Profile = ({crew, setCrew, setIsLogin }) => {
  const navigate = useNavigate();

  // 기본 프로필 이미지
  const defaultProfileImage = process.env.PUBLIC_URL + '/static/profileImages/basic_profile.png';

  // 회원 프로필 이미지
  const crewProfileImage = crew.profileImage
    ? (crew.profileImage.startsWith("http") || crew.profileImage.startsWith("/"))
      ? crew.profileImage
      : `${process.env.REACT_APP_API_BASE_URL}/static/files/${crew.profileImage}`
    : defaultProfileImage;

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
    if (value === "") setIsPasswordValid(true);
    setIsPasswordValid(passwordRegex.test(value));
  };

  // 비밀번호 확인 Confirm
  // 유효성 상태 관리
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const isPasswordNotEqual = password.trim() !== "" && passwordConfirm.length > 0 && password !== passwordConfirm;
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
    setProfileImage(null);
    setProfileImageFileFileName(""); // 1. 화면에 보이는 파일명 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 2. 숨겨진 파일 인풋의 실제 값 초기화 (중요!)
    }
  };

  // 좌우명
  // 유효성 상태 관리
  const [motto, setMotto] = useState('');

  useEffect(() => {
    if (!crew) return;

    setNickname(crew.nickname);
    setMotto(crew.motto ?? "");

    // 프로필 이미지 파일명만 표시
    if (crew.profileImage) {
      setProfileImageFileFileName(crew.profileImage);
    }
  }, [crew]);

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const nicknameEmpty = nickname.trim() === "";
    const isChangingPassword = password.trim() !== "";
    const passwordConfirmEmpty = isChangingPassword && passwordConfirm.trim() === "";

    setIsNicknameEmpty(nicknameEmpty);
    setIsPasswordConfirmEmpty(passwordConfirmEmpty);

    if(isNicknameEmpty || 
      (isChangingPassword && (!isPasswordValid || isPasswordNotEqual || passwordConfirmEmpty))
      ) {
        return;
      }

    // 서버로 전송
    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      formData.append("motto", motto);

      if (isChangingPassword) {
        formData.append("password", password);
      }

      // 프로필 이미지 삭제 의도 전달
      if (profileImageFileName.trim() === "" && !profileImage) {
        formData.append("profileImageClear", "true");
      }

      // 파일은 "파일 객체"를 넣어야 함 (파일명 말고)
      // 지금 코드는 file.name만 저장하고 있어서 파일 객체를 state로 따로 저장해야 함
      if (profileImageFileName) {
        formData.append("profileImage", profileImage); // key 이름 중요
      }

      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/editprofile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "회원 정보 수정 실패");
      }

      const data = await res.json();
      console.log("회원 정보 수정 성공:", data);

      const crewUpdate = {
        nickname: data.crew.nickname,
        motto: data.crew.motto,
        profileImage: data.crew.profileImage, // null 가능
      };

      localStorage.setItem("crew", JSON.stringify(crewUpdate));
      setCrew(crewUpdate);
      setResultMessage(data.message);
      setIsResultModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // 경고 모달 창
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // 메시지 모달 창
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isLeaveSuccess, setIsLeaveSuccess] = useState(false);

  const openLeaveModal = () => setIsLeaveModalOpen(true);
  const closeLeaveModal = () => setIsLeaveModalOpen(false);

  // 회원 탈퇴 처리
  const handleLeave = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        process.env.REACT_APP_API_BASE_URL + "/crew/leave",
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      // 방어적으로 text로 받고 JSON 파싱 시도
      const text = await res.text();
      console.log("서버 응답:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { result: res.ok, message: text };
      }

      const ok = !!data.result && res.ok;

      setIsLeaveSuccess(ok);
      setResultMessage(
        data.message || (ok ? "회원 탈퇴가 완료되었습니다." : "회원 탈퇴에 실패했습니다.")
      );

      closeLeaveModal();
      setIsResultModalOpen(true);
    } catch (err) {
      console.error("회원탈퇴 통신 에러:", err);
      setIsLeaveSuccess(false);
      setResultMessage("네트워크 오류로 회원 탈퇴에 실패했습니다.");
      closeLeaveModal();
      setIsResultModalOpen(true);
    }
  };

  // 완료 모달 확인 버튼 눌렀을 때만 로그아웃/이동
  const handleResultConfirm = () => {
    setIsResultModalOpen(false);

    if (isLeaveSuccess) {
      localStorage.removeItem("token");
      localStorage.removeItem("crew");
      setIsLogin(false);
      setCrew(null);
    }

    navigate("/", { replace: true });
  };

  return (
    <>
    <div className="login-container">
      <div className="profile-top">
        <div className="profile-avatar">
          <img className="profile-image" src={crewProfileImage} alt="Profile" />
        </div>

        <div className="profile-email">
          {crew.email}
        </div>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
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
            placeholder="password" 
            className="underline-input"
            value={password}
            onChange={handlePasswordChange}
          />
          
          {password.trim() !== "" && !isPasswordValid && (
            <p className="warning-message">
              8~20자 사이 문자, 숫자, 특수문자를 포함해야 합니다.
            </p>
          )}

          <input 
            type="password" 
            placeholder="password confirm" 
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

        <button type="submit" className="save-btn">Edit</button>
      </form>
      <button type="button" className="leave-btn" onClick={openLeaveModal}>Leave</button>

      <ModalLeaveCheck open={isLeaveModalOpen} onClose={closeLeaveModal} onConfirm={handleLeave}/>
      <ModalMessage open={isResultModalOpen} message={resultMessage} onConfirm={handleResultConfirm} />
    </div>
    </>
  );
};

export default Profile;