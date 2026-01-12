const express = require('express');
const cors = require('cors'); // 다른 포트 번호 간의 통신을 허용
const dotenv = require('dotenv')
const db = require('./model') // model/index.js에서 db 객체를 불러온다.

// .env 파일의 환경 변수 로드
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// DB 연동
db.sequelize.sync({force: false})
    .then(()=>{
        console.log('데이터베이스 연결 및 동기화 완료')
    })
    .catch((err)=>{
        console.error('연결 실패 : ', err)
    })

// React 연동
app.get('/api/data', (req, res) => {
    res.json({ message: "Hello React" });
});

app.listen(port, () => {
    console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});