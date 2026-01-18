import {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios'
import Header from './components/Header';
import Login from './crew/Login';
import Join from './crew/Join';
import FindPassword from './crew/FindPassword';

function App() {
  const [message, setMessage] = useState("")

  useEffect(()=>{
    axios.get(process.env.REACT_APP_API_BASE_URL)
    .then(res=>{
      setMessage(res.data.message)
    })
    .catch(error=>{
      console.log("에러 발생: ", error)
    }, [])
  })

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/findpassword" element={<FindPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
