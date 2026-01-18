import { IoLogInOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import '../styles/login.scss';

const Login = () => {
  
  // navigate 선언
  const navigate = useNavigate();
  const handleJoinClick = () => {
    navigate('/join'); // 클릭 시 /join 경로로 이동
  };

  const handleFindPasswordClick = () => {
    navigate('/findpassword'); // 클릭 시 findpassword 경로로 이동
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginError, setIsLoginError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);

    if(isLoginError){
      if(value.trim()!==''){
        setIsLoginError(false);
      }
    }
  };

  const handlePassword = (e) => {
    const value = e.target.value;
    setPassword(value);

    if(isLoginError){
      if(value.trim()!==''){
        setIsLoginError(false);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginData = {
        email: email,
        password: password
      };

      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "로그인 실패");
        setIsLoginError(true);
        return;
      }
      
      localStorage.setItem("accessToken", data.token);
      console.log("로그인 성공:", data);
      navigate('/succeed');

    } catch (err) {
      console.error(err);
      setErrorMessage("서버와 통신 중 오류가 발생했습니다.");
      alert(err.message);
    }
  }

  return (
    <>
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        {/* 입력 필드 */}
        <div className="input-group">
          <input type="email" placeholder="email" onChange={handleEmail} className="underline-input"/>
          <input type="password" placeholder="password" onChange={handlePassword} className="underline-input"/>

          {isLoginError && (
            <p className="warning-message">
              {errorMessage}
            </p>
          )}
        </div>

        {/* 보조 메뉴 */}
        <div className="secondary-menu">
          <button type="button" className="text-link" onClick={handleJoinClick}>join</button>
          <button type="button" className="text-link" onClick={handleFindPasswordClick}>find password</button>
        </div>

        {/* 로그인 버튼 */}
        <button type="submit" className="login-btn">LOGIN <IoLogInOutline/></button>
      </form>

      <hr className="divider" />

      {/* 소셜 로그인 */}
      <div className="social-login">
        <button className="social-icon google">
          <img src={process.env.PUBLIC_URL + '/static/logos/google_icon.png'} alt="Google" />
        </button>
        <button className="social-icon naver">
          <img src={process.env.PUBLIC_URL + '/static/logos/naver_icon.png'} alt="Naver" />
        </button>
        <button className="social-icon kakao">
          <img src={process.env.PUBLIC_URL + '/static/logos/kakao_icon.png'} alt="Kakao" />
        </button>
      </div>
    </div>
    </>
  );
};

export default Login;