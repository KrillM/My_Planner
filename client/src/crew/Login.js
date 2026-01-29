import { useGoogleLogin } from '@react-oauth/google';
import { IoLogInOutline } from 'react-icons/io5';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../styles/login.scss';

const Login = ({setIsLogin, setCrew}) => {
  
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
  const [searchParams] = useSearchParams(); // URL 파라미터 제어

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

      const crew = {
        email: data.email,
        nickname: data.nickname,
        profileImage: data.profileImage,
        motto: data.motto
      }
      localStorage.setItem("crew", JSON.stringify(crew));

      setCrew(crew);
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

          const crew = {
            email: data.crew?.email ?? "",
            nickname: data.crew?.nickname ?? "",
            profileImage: data.crew?.profileImage ?? "",
            motto: data.crew?.motto ?? ""
          }
          localStorage.setItem("crew", JSON.stringify(crew));
          
          setCrew(crew);
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

  // 네이버 로그인 페이지로 이동시키기 위한 정보를 구성합니다.
  const handleNaverLogin = () => {
    const client_id = process.env.REACT_APP_NAVER_CLIENT_ID;
    const redirect_uri = encodeURIComponent(process.env.REACT_APP_LOCAL_URL+'/'); 
    const state = Math.random().toString(36).substring(7);
    
    localStorage.setItem("naverState", state);
    const naver_auth_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&auth_type=reprompt`;
    
    window.location.href = naver_auth_url;
  };

  const isProcessing = useRef(false);

  // --- [자동 콜백 감지 로직] ---
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // URL에 code와 state가 있다면 네이버에서 돌아온 상황임
    if (code && state && !isProcessing.current) {
      isProcessing.current = true;

      const fetchNaverLogin = async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/naver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          });

          const data = await res.json();

          if (res.ok) {
            localStorage.setItem("token", data.token);

            const crew = {
              email: data.crew?.email ?? "",
              nickname: data.crew?.nickname ?? "",
              profileImage: data.crew?.profileImage ?? "",
              motto: data.crew?.motto ?? ""
            }
            localStorage.setItem("crew", JSON.stringify(crew));
            
            setCrew(crew);
            setIsLogin(true);
            navigate("/", {"replace" : "true"}); // 로그인 성공 시 홈으로
          } else {
            alert("네이버 로그인 실패: " + data.message);
            isProcessing.current = false;
          }
        } catch (err) {
          console.error("네이버 로그인 오류: ", err);
          isProcessing.current = false;
        }
      };

      fetchNaverLogin();
    }
  }, [searchParams]); // 3. URL이 변경될 때마다 체크

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
        <button 
          type="button" 
          className="social-icon naver" 
          onClick={handleNaverLogin}
        >
          <img src={process.env.PUBLIC_URL + '/static/logos/naver_icon.png'} alt="Naver" />
        </button>
      </div>
    </div>
    </>
  );
};

export default Login;