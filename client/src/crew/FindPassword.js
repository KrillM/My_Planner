import { IoMail } from 'react-icons/io5';
import { useState } from 'react';
import '../styles/login.scss';

const FindPassword = () => {

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isEmailNotExists, setIsEmailNotExists] = useState(false);
  const [isMailSend, setIsMailSend] = useState(false);

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);

    if(isEmailNotExists){
      if(value.trim()!==''){
        setIsEmailNotExists(false);
      }
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();

    try {
      const sendEmail = {
        email: email,
      };

      const res = await fetch(process.env.REACT_APP_API_BASE_URL + "/crew/findpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendEmail),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "메일 전송 실패");
        setIsEmailNotExists(true);
        return;
      }
      setMessage(data.message);
      setIsMailSend(true);
    } catch(err) {
      console.error(err);
      setMessage("서버와 통신 중 오류가 발생했습니다.");
      alert(err.message);
    }
  }
  
  return (
    <>
    <div className="login-container">
      <form className="login-form" onSubmit={handleSendMail}>
        {/* 입력 필드 */}
        <div className="input-group">
          <input type="email" placeholder="email" onChange={handleEmail} className="underline-input"/>

          {isEmailNotExists && (
            <p className="warning-message">
              {message}
            </p>
          )}

          {isMailSend && (
            <p className="success-message">
              {message}
            </p>
          )}
        </div>

        {/* 메일 전송 버튼 버튼 */}
        <button type="submit" className="login-btn">SEND MAIL <IoMail/></button>
      </form>
    </div>
    </>
  );
};

export default FindPassword;