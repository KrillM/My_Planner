import {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios'
import Header from './components/Header';
import Login from './crew/Login';
import Join from './crew/Join';
import FindPassword from './crew/FindPassword';
import Date from './plan/Date';

function App() {
  const [message, setMessage] = useState("")
  const [isLogin, setIsLogin] = useState(false);

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
    if (token) {
      setIsLogin(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <Header isLogin={isLogin} setIsLogin={setIsLogin}/>
      <Routes>
        <Route path="/" element={isLogin ? <Date /> : <Login setIsLogin={setIsLogin}/>} />
        <Route path="/join" element={<Join />} />
        <Route path="/findpassword" element={<FindPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
