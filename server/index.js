const express = require('express');
const cors = require('cors'); // 다른 포트 번호 간의 통신을 허용
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get('/api/data', (req, res) => {
    res.json({ message: "Hello React" });
});

app.listen(port, () => {
    console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});