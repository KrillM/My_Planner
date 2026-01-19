import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  IoListOutline, 
  IoCloseOutline, 
  IoAddOutline,
  IoCreateOutline,
  IoRepeatOutline,
  IoCalendarOutline,
  IoTodayOutline,
  IoPersonOutline,
  IoLogOutOutline
} from 'react-icons/io5';
import '../styles/sidebar.scss';

const Sidebar = ({ setIsLogin, isOpen, onClose }) => {
  const navigate = useNavigate();

  // Plan 메뉴의 열림/닫힘 상태 관리
  const [isPlanOpen, setIsPlanOpen] = useState(true);

  // 임시 로그아웃 함수
  const handleLogout = async () => {
    try {
        const token = localStorage.getItem('token');

        // 1. 서버에 로그아웃 알림 (토큰 수거 요청)
        const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/logout", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // 현재 토큰 전달
            },
            body: JSON.stringify({}), // 필요한 데이터가 없다면 빈 객체 전송
        });

        // 서버 응답 확인 (필요 시)
        const data = await res.json();
        console.log("서버 응답:", data.message);

        // 2. 클라이언트에서 토큰 소멸 (성공/실패 여부와 상관없이 삭제하는 것이 안전)
        localStorage.removeItem('token');
        
        // 3. 상태 변경 및 페이지 이동
        setIsLogin(false);
        onClose();
        navigate('/');
    } catch (err) {
        console.error("로그아웃 통신 에러:", err);
        // 서버와 연결이 끊겼더라도 클라이언트 토큰은 지워야 합니다.
        localStorage.removeItem('token');
        setIsLogin(false);
        onClose();
        navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  }

  if (!isOpen) return null;

  return (
    <>
      {/* 사이드바 배경 (클릭 시 닫힘) */}
      <div className="sidebar-overlay" onClick={onClose}></div>
      
      {/* 사이드바 본체 */}
      <div className="sidebar-menu open">
        <div className="sidebar-header">
          <span></span>
          <IoCloseOutline className="close-icon" onClick={onClose} />
        </div>
        
        <nav className="sidebar-items">
          <div className="item"><IoTodayOutline /> <span>Today</span></div>
          <div className="item"><IoCalendarOutline /> <span>Calendar</span></div>

          {/* Plan 클릭 시 isPlanOpen 상태를 반전 */}
          <div className="item plan-menu" onClick={() => setIsPlanOpen(!isPlanOpen)}>
            <IoListOutline /> 
            <span>Plan</span>
          </div>

          {/* sPlanOpen이 true일 때 서브 메뉴를 보여줌 */}
          {isPlanOpen && (
            <div className="sub-items">
              <div className="sub-item" onClick={handleHome}><IoAddOutline /> New</div>
              <div className="sub-item"><IoCreateOutline /> Update</div>
              <div className="sub-item"><IoRepeatOutline /> Frequency</div>
              <div className="sub-item"><IoCalendarOutline /> Long Term</div>
              <div className="sub-item"><IoCalendarOutline /> Event</div>
            </div>
          )}

          <div className="item"><IoPersonOutline /> <span>Profile</span></div>
          <div className="item" onClick={handleLogout}><IoLogOutOutline /> <span>Logout</span></div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;