import { IoSearchOutline, IoMenuOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import '../styles/header.scss';

const Header = ({isLogin, setIsLogin}) => {

  // navigate 선언
  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate('/');
  };

  // 사이드바 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="header-container">
      {/* 왼쪽: 로고/타이틀 */}
      <div className="header-logo" onClick={handleHomeClick}>
        My Planner
      </div>

      {/* 오른쪽: 로그인 상태일 때만 검색, 메뉴, 프로필 아이콘을 렌더링 */}
      {isLogin && (
        <div className="header-actions">
          <div className="profile-circle">
            <img 
              src={process.env.PUBLIC_URL + '/static/profileImages/basic_profile.png'} 
              alt="Profile" 
            />
          </div>
          <IoSearchOutline className="icon" />
          <IoMenuOutline className="icon" onClick={toggleSidebar} />
        </div>
      )}

      {/* 사이드바 컴포넌트 호출 (상태와 닫기 함수 전달) */}
      <Sidebar 
        isOpen={isLogin && isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        setIsLogin={setIsLogin}
      />
    </header>
  );
};

export default Header;