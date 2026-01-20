import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/login.scss';
import '../styles/save.scss';

const ResetPassword = () => {
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // 비밀번호
  // 유효성 상태 관리
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

  // 유효성 검사 함수
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPasswordTouched(true);
    setPassword(value);
    setIsPasswordValid(passwordRegex.test(value));
  };

  // 유효성 상태 관리
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isPasswordConfirmEmpty, setIsPasswordConfirmEmpty] = useState(false);
  const isPasswordNotEqual = passwordConfirm.length > 0 && password !== passwordConfirm;

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("유효하지 않은 링크입니다.");
      return;
    }

    const passwordConfirmEmpty = passwordConfirm.trim() === "";
    setIsPasswordConfirmEmpty(passwordConfirmEmpty);

    if(!isPasswordValid ||  isPasswordNotEqual || isPasswordConfirmEmpty) return;

    // 서버로 전송
    try {
      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/resetpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "비밀번호 변경 실패");
      }

      await res.json();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <>
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input 
            type="password" 
            placeholder="password (필수)" 
            className="underline-input"
            value={password}
            onChange={handlePasswordChange}
          />
          
          {passwordTouched && !isPasswordValid && (
            <p className="warning-message">
              8~20자 사이 문자, 숫자, 특수문자를 포함해야 합니다.
            </p>
          )}

          <input 
            type="password" 
            placeholder="password confirm (필수)" 
            className="underline-input"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {isPasswordNotEqual && (
            <p className="warning-message">
              비밀번호와 일치해야 합니다.
            </p>
          )}

          {isPasswordConfirmEmpty && (
            <p className="warning-message">
              비밀번호를 확인해주세요.
            </p>
          )}
        </div>
        <button type="submit" className="save-btn">Reset Password</button>
      </form>
    </div>
    </>
  );
};

export default ResetPassword;