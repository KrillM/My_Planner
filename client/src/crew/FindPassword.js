import { IoMail } from 'react-icons/io5';
import Header from '../components/Header';
import '../styles/login.scss';

const FindPassword = () => {
  
  return (
    <>
    <Header/>
    <div className="login-container">
      <form className="login-form">
        {/* 입력 필드 */}
        <div className="input-group">
          <input type="email" placeholder="email" className="underline-input"/>
        </div>

        {/* 메일 전송 버튼 버튼 */}
        <button type="submit" className="login-btn">SEND MAIL <IoMail/></button>
      </form>
    </div>
    </>
  );
};

export default FindPassword;