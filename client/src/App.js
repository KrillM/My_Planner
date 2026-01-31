import {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios'
import Header from './components/Header';
import Login from './crew/Login';
import Join from './crew/Join';
import FindPassword from './crew/FindPassword';
import ResetPassword from './crew/ResetPassword';
import Profile from './crew/Profile';
import Date from './plan/Date';
import { GoogleOAuthProvider } from '@react-oauth/google';

import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

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
    // 토큰이 있으면 로그인, 아니면 로그아웃
    const token = localStorage.getItem('token');
    const crewInfo = localStorage.getItem('crew');

    if (token) setIsLogin(true);
    if(crewInfo) setCrew(JSON.parse(crewInfo));
  }, []);

  return (
    <BrowserRouter>
      <Header isLogin={isLogin} setIsLogin={setIsLogin} crew={crew} setCrew={setCrew}/>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <Routes>
          {/* 로그인 없이도 접근 가능 */}
          <Route path="/" element={isLogin ? <Date /> : <Login setIsLogin={setIsLogin} setCrew={setCrew}/>} />
          <Route path="/join" element={<Join />} />
          <Route path="/findpassword" element={<FindPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          
          {/* 로그인 필수 */}
          <Route element={<ProtectedRoute isLogin={isLogin} />}>
            <Route path="/profile" element={<Profile crew={crew} setCrew={setCrew} setIsLogin={setIsLogin} />} />
          </Route>

          {/* 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;