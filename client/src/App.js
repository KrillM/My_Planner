import {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios'
import Login from './crew/Login';
import Join from './crew/Join';
import FindPassword from './crew/FindPassword';

function App() {
  const [message, setMessage] = useState("")

  useEffect(()=>{
    axios.get('http://localhost:8080/api/data') // 프로토콜이 빠져 있음
    .then(res=>{
      setMessage(res.data.message)
    })
    .catch(error=>{
      console.log("에러 발생: ", error)
    })
  })

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/join" element={<Join />} />
      <Route path="/findpassword" element={<FindPassword />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
