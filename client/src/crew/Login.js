import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/login.scss";

const Login = ({ setIsLogin, setCrew }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginError, setIsLoginError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isProcessing = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const PUBLIC_URL = process.env.PUBLIC_URL;

  const moveToJoin = () => navigate("/join");
  const moveToFindPassword = () => navigate("/findpassword");

  const clearLoginError = (value) => {
    if (isLoginError && value.trim() !== "") {
      setIsLoginError(false);
      setErrorMessage("");
    }
  };

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    clearLoginError(value);
  };

  const handlePassword = (e) => {
    const value = e.target.value;
    setPassword(value);
    clearLoginError(value);
  };

  const buildCrewFromResponse = (data) => {
    const crewData = data.data ?? data.crew ?? data;

    return {
      email: crewData?.email ?? "",
      nickname: crewData?.nickname ?? "",
      profileImage: crewData?.profileImage ?? "",
      loginType: crewData?.loginType ?? "",
      motto: crewData?.motto ?? "",
    };
  };

  const saveLoginSession = useCallback((data) => {
    const crew = buildCrewFromResponse(data);

    localStorage.setItem("token", data.token);
    localStorage.setItem("crew", JSON.stringify(crew));

    setCrew(crew);
    setIsLogin(true);
  }, [setCrew, setIsLogin]);

  const handleAuthSuccess = useCallback((data) => {
    saveLoginSession(data);
    navigate("/", { replace: true });
  }, [saveLoginSession, navigate]);

  const handleAuthError = (data, fallbackMessage) => {
    const message = data?.message || fallbackMessage;
    setErrorMessage(message);
    setIsLoginError(true);
  };

  const postJson = async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    return { res, data };
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { res, data } = await postJson(`${API_BASE_URL}/crew/login`, {
        email,
        password,
      });

      if (!res.ok) {
        handleAuthError(data, "로그인 실패");
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      console.error("일반 로그인 오류:", err);
      setErrorMessage("서버와 통신 중 오류가 발생했습니다.");
      setIsLoginError(true);
    }
  };

  const requestGoogleLogin = async (code) => {
    try {
      const { res, data } = await postJson(`${API_BASE_URL}/api/auth/google`, {
        code,
      });

      if (!res.ok) {
        handleAuthError(data, "구글 로그인 실패");
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      console.error("구글 로그인 오류:", err);
      setErrorMessage("구글 로그인 중 오류가 발생했습니다.");
      setIsLoginError(true);
    }
  };

  const googleSocialLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      await requestGoogleLogin(codeResponse.code);
    },
    onError: () => {
      setErrorMessage("구글 인증에 실패했습니다.");
      setIsLoginError(true);
    },
  });

  const handleNaverLogin = () => {
    const clientId = process.env.REACT_APP_NAVER_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.REACT_APP_LOCAL_URL}/`);
    const state = Math.random().toString(36).substring(7);

    localStorage.setItem("naverState", state);

    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}` +
      `&auth_type=reprompt`;

    window.location.href = naverAuthUrl;
  };

  const requestNaverLogin = useCallback(async (code, state) => {
    try {
      const savedState = localStorage.getItem("naverState");

      if (!savedState || savedState !== state) {
        setErrorMessage("네이버 로그인 state 검증에 실패했습니다.");
        setIsLoginError(true);
        isProcessing.current = false;
        return;
      }

      const { res, data } = await postJson(`${API_BASE_URL}/api/auth/naver`, {
        code,
        state,
      });

      if (!res.ok) {
        handleAuthError(data, "네이버 로그인 실패");
        isProcessing.current = false;
        return;
      }

      localStorage.removeItem("naverState");
      handleAuthSuccess(data);
    } catch (err) {
      console.error("네이버 로그인 오류:", err);
      setErrorMessage("네이버 로그인 중 오류가 발생했습니다.");
      setIsLoginError(true);
      isProcessing.current = false;
    }
  }, [API_BASE_URL, handleAuthSuccess]);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || isProcessing.current) return;

    isProcessing.current = true;
    requestNaverLogin(code, state);
  }, [searchParams, requestNaverLogin]);

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <div className="input-group">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={handleEmail}
            className="underline-input"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={handlePassword}
            className="underline-input"
          />

          {isLoginError && (
            <p className="warning-message">{errorMessage}</p>
          )}
        </div>

        <div className="secondary-menu">
          <button type="button" className="text-link" onClick={moveToJoin}>
            join
          </button>
          <button
            type="button"
            className="text-link"
            onClick={moveToFindPassword}
          >
            find password
          </button>
        </div>

        <button type="submit" className="login-btn">
          LOGIN
          <span className="material-symbols-outlined">login</span>
        </button>
      </form>

      <hr className="divider" />

      <div className="social-login">
        <button
          type="button"
          className="social-icon google"
          onClick={() => googleSocialLogin()}
        >
          <img
            src={`${PUBLIC_URL}/static/logos/google_icon.png`}
            alt="Google"
          />
        </button>

        <button
          type="button"
          className="social-icon naver"
          onClick={handleNaverLogin}
        >
          <img
            src={`${PUBLIC_URL}/static/logos/naver_icon.png`}
            alt="Naver"
          />
        </button>
      </div>
    </div>
  );
};

export default Login;