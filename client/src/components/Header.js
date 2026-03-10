import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Alarm from './Alarm';
import Sidebar from './Sidebar';
import '../styles/header.scss';

const Header = ({isLogin, setIsLogin, crew, setCrew}) => {

  // 기본 프로필 이미지
  const defaultProfileImage = process.env.PUBLIC_URL + '/static/profileImages/basic_profile.png';

  // 회원 프로필 이미지
  const crewProfileImage = crew?.profileImage
    ? (crew.profileImage.startsWith("http") || crew.profileImage.startsWith("/"))
      ? crew.profileImage
      : `${process.env.REACT_APP_API_BASE_URL}/static/files/${crew.profileImage}`
    : defaultProfileImage;

  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate('/');
  };

  // 사이드바 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

   // 알림창
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const alarmRef = useRef(null);

  const toggleAlarm = async () => {
    const next = !isAlarmOpen;
    if (next) await fetchAlarms();
    setIsAlarmOpen(next);
  };

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alarmRef.current && !alarmRef.current.contains(e.target)) {
        setIsAlarmOpen(false);
      }
    };

    if (isAlarmOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAlarmOpen]);

  // 알람 목록
  const [alarmList, setAlarmList] = useState([]);

  const fetchAlarms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/alarm", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "알람 조회 실패");

      setAlarmList(data.alarms || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLogin) {
      fetchAlarms();
    }
  }, [isLogin]);

  return (
    <header className="header-container">
      {/* 왼쪽: 로고/타이틀 */}
      <div className="header-logo" onClick={handleHomeClick}>
        My Planner
      </div>

      {/* 오른쪽: 로그인 상태일 때만 검색, 메뉴, 프로필 아이콘을 렌더링 */}
      {isLogin && (
        <div className="header-actions" ref={alarmRef}>
          <div className="profile-circle">
            <img src={crewProfileImage} alt="Profile" />
          </div>
          {/* <span className="material-symbols-outlined icon">search</span> */}
          <span className="material-symbols-outlined icon" onClick={toggleAlarm}>notifications</span>
          <span className="material-symbols-outlined icon" onClick={toggleSidebar}>menu</span>

          {isAlarmOpen && <Alarm alarms={alarmList}/>}
        </div>
      )}

      {/* 사이드바 컴포넌트 호출 (상태와 닫기 함수 전달) */}
      <Sidebar 
        isOpen={isLogin && isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        setIsLogin={setIsLogin}
        setCrew={setCrew}
      />
    </header>
  );
};

export default Header;