import { IoSearchOutline, IoMenuOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import '../styles/header.scss';

const Header = () => {

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

      {/* 오른쪽: 프로필 및 아이콘 메뉴 */}
      <div className="header-actions">
        <div className="profile-circle">
          {/* 로그인 기능 전 임시 이미지 */}
          <img src={process.env.PUBLIC_URL + '/static/profileImages/basic_profile.png'} alt="Profile" />
        </div>
        <IoSearchOutline className="icon" />
        <IoMenuOutline className="icon" />
      </div>
    </header>
  );
};

export default Header;