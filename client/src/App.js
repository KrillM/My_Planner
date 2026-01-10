import './App.css';
import React, {useEffect, useState} from 'react';
import axios from 'axios'

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
    <div className="App">
      <p>{message}</p>
    </div>
  );
}

export default App;
