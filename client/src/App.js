import {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios'
import Header from './components/Header';
import Login from './crew/Login';
import Join from './crew/Join';
import FindPassword from './crew/FindPassword';
import ResetPassword from './crew/ResetPassword';
import Date from './plan/Date';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [message, setMessage] = useState("")
  const [isLogin, setIsLogin] = useState(false);
  const [crew, setCrew] = useState(null);

  useEffect(()=>{
    axios.get(process.env.REACT_APP_API_BASE_URL)
    .then(res=>{
      setMessage(res.data.message)
    })
    .catch(error=>{
      console.log("에러 발생: ", error)
    })
  }, [])

  useEffect(() => {
    // 로컬 스토리지에 토큰이 있다면 로그인 상태로 간주
    const token = localStorage.getItem('token');
    const crewInfo = localStorage.getItem('crew');

    if (token) {
      setIsLogin(true);
    }
    if(crewInfo){
      setCrew(JSON.parse(crewInfo));
    }
  }, []);

  return (
    <BrowserRouter>
      <Header isLogin={isLogin} setIsLogin={setIsLogin} crew={crew}/>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <Routes>
          <Route path="/" element={isLogin ? <Date /> : <Login setIsLogin={setIsLogin} setCrew={setCrew}/>} />
          <Route path="/join" element={<Join />} />
          <Route path="/findpassword" element={<FindPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
        </Routes>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
