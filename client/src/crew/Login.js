import { IoLogInOutline } from 'react-icons/io5';
import '../styles/login.scss';

const Login = () => {
  return (
    <div className="login-container">
      <form className="login-form">
        {/* 입력 필드 */}
        <div className="input-group">
          <input type="email" placeholder="email" className="underline-input"/>
          <input type="password" placeholder="password" className="underline-input"/>
        </div>

        {/* 보조 메뉴 */}
        <div className="secondary-menu">
          <button type="button" className="text-link">join</button>
          <button type="button" className="text-link">find password</button>
        </div>

        {/* 로그인 버튼 */}
        <button type="submit" className="login-btn">LOGIN <IoLogInOutline/></button>
      </form>

      <hr className="divider" />

      {/* 소셜 로그인 */}
      <div className="social-login">
        <button className="social-icon google"><img src={process.env.PUBLIC_URL + '/static/logos/google_icon.png'} alt="Google" /></button>
        <button className="social-icon naver"><img src={process.env.PUBLIC_URL + '/static/logos/naver_icon.png'} alt="Naver" /></button>
        <button className="social-icon kakao"><img src={process.env.PUBLIC_URL + '/static/logos/kakao_icon.png'} alt="Kakao" /></button>
      </div>
    </div>
  );
};

export default Login;