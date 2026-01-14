import Header from '../components/Header';
import SetProfileImage from './SetProfileImage'
import '../styles/login.scss';
import '../styles/save.scss';

const Join = () => {
  return (
    <>
    <Header/>
    <div className="login-container">
      <form className="login-form">
        {/* 입력 필드 */}
        <div className="input-group">
          <input type="email" placeholder="email (필수)" className="underline-input"/>
          <input type="text" placeholder="nickname (필수)" className="underline-input"/>
          <input type="password" placeholder="password (필수)" className="underline-input"/>
          <input type="password" placeholder="password confirm (필수)" className="underline-input"/>
          <SetProfileImage />
          <input type="text" placeholder="motto" className="underline-input"/>
        </div>

        {/* 로그인 버튼 */}
        <button type="submit" className="save-btn">SAVE</button>
      </form>
    </div>
    </>
  );
};

export default Join;