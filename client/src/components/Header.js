import { IoSearchOutline, IoMenuOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import '../styles/header.scss';

const Header = ({isLogin}) => {

  // navigate 선언
  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate('/'); // 클릭 시 / 경로로 이동
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
          <IoMenuOutline className="icon" />
        </div>
      )}
    </header>
  );
};

export default Header;