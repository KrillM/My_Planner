import { useGoogleLogin } from '@react-oauth/google';
import { IoLogInOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../styles/login.scss';

const Login = ({setIsLogin}) => {
  
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
      
      localStorage.setItem("token", data.token);
      setIsLogin(true);
      console.log("로그인 성공:", data);
      navigate('/');

    } catch (err) {
      console.error(err);
      setErrorMessage("서버와 통신 중 오류가 발생했습니다.");
      alert(err.message);
    }
  }

  // 구글 로그인 핸들러 정리
  const googleSocialLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        // 백엔드에 'code' 전달
        const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: codeResponse.code, // 구글에서 받은 인증 코드
          }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("token", data.token); // JWT 저장
          setIsLogin(true);
          navigate('/');
        } else {
          alert("구글 로그인 실패: " + data.message);
        }
      } catch (err) {
        console.error("구글 로그인 에러:", err);
      }
    },
    flow: 'auth-code', // 이 설정이 있어야 백엔드에서 'code'를 처리할 수 있음
  });

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
        <button 
          type="button" 
          className="social-icon google"
          onClick={()=>googleSocialLogin()}
        >
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