import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../styles/sidebar.scss';

const Sidebar = ({ setIsLogin, isOpen, onClose, setCrew }) => {
  const navigate = useNavigate();

  // Plan 메뉴의 열림/닫힘 상태 관리
  const [isPlanOpen, setIsPlanOpen] = useState(true);

  // 홈 페이지로 이동
  const handleHome = () => {
    navigate('/')
  }

  // 계획 생성 페이지로 이동
  const handleCreatePlan = () => {
    navigate('/new')
  }

  // 프로필 화면 이동
  const handleProfile = () => {
    navigate('/profile')
  }

  // 로그아웃 함수
  const handleLogout = async () => {
    const token = localStorage.getItem('token');

    // 먼저 루트로 보내서 /404로 튕기는 타이밍 이슈 차단
    onClose();
    navigate('/', { replace: true });

    // 클라이언트 로그아웃 확정 처리
    localStorage.removeItem('token');
    localStorage.removeItem('crew');
    setIsLogin(false);
    setCrew(null);

    // 서버 로그아웃은 나중에 시도
    try {
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      // 서버 응답이 꼭 JSON이 아닐 수도 있으니 방어적으로
      const text = await res.text();
      console.log("서버 응답:", text);
    } catch (err) {
      console.error("로그아웃 통신 에러:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 사이드바 배경 (클릭 시 닫힘) */}
      <div className="sidebar-overlay" onClick={onClose}></div>
      
      {/* 사이드바 본체 */}
      <div className="sidebar-menu open">
        <div className="sidebar-header">
          <span></span>
          <span 
            className="material-symbols-outlined" 
            style={{ cursor: 'pointer' }} 
            onClick={onClose}
          >
            close
          </span>
        </div>
        
        <nav className="sidebar-items">
          <div className="item" onClick={handleHome}>
            <span className="material-symbols-outlined">today</span>
            <span>Today</span>
          </div>
          <div className="item">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Calendar</span>
          </div>

          {/* Plan 클릭 시 isPlanOpen 상태를 반전 */}
          <div className="item plan-menu" onClick={() => setIsPlanOpen(!isPlanOpen)}>
            <span className="material-symbols-outlined">event_list</span>
            <span>Plan</span>
          </div>

          {/* sPlanOpen이 true일 때 서브 메뉴를 보여줌 */}
          {isPlanOpen && (
            <div className="sub-items">
              <div className="sub-item" onClick={handleCreatePlan}>
                <span class="material-symbols-outlined">add_notes</span>
                New
              </div>
              <div className="sub-item">
                <span className="material-symbols-outlined">edit</span>
                Update
              </div>
              <div className="sub-item">
                <span className="material-symbols-outlined">repeat</span>
                Frequency
              </div>
              <div className="sub-item">
                <span className="material-symbols-outlined">calendar_view_day</span>
                Long Term
              </div>
              <div className="sub-item">
                <span class="material-symbols-outlined">event</span>
                Event
              </div>
            </div>
          )}

          <div className="item" onClick={handleProfile}>
            <span className="material-symbols-outlined">article_person</span>   
            <span>Profile</span>
          </div>
          <div className="item" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;