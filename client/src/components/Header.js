import { IoSearchOutline, IoMenuOutline } from 'react-icons/io5';
import '../styles/header.scss';

const Header = () => {
  return (
    <header className="header-container">
      {/* 왼쪽: 로고/타이틀 */}
      <div className="header-logo">
        My Planner
      </div>

      {/* 오른쪽: 프로필 및 아이콘 메뉴 */}
      <div className="header-actions">
        <div className="profile-circle">
          {/* 로그인 기능 전 임시 이미지 */}
          <img src="../../public/static/profileImages/basic_profile.png" alt="Profile" />
        </div>
        <IoSearchOutline className="icon" />
        <IoMenuOutline className="icon" />
      </div>
    </header>
  );
};

export default Header;