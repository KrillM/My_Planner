const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const { sequelize } = require("./model");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors({ origin: true, credentials: true }));
app.use("/static", express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 전체 공통 제한
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 로그인 / 인증용
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 검색 / 캘린더처럼 자주 두드릴 수 있는 API
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// 일반 회원가입
const crewRouter = require("./routes/crew");
app.use("/crew", crewRouter);

// OAuth2
const oauth2Router = require("./routes/oauth2");
app.use("/api/auth", authLimiter, oauth2Router);

// Plan
const planRouter = require("./routes/plan");
app.use("/plan", planRouter);

// Calendar
const calendarRouter = require("./routes/calendar");
app.use("/calendar", heavyLimiter, calendarRouter);

// Memo
const memoRouter = require("./routes/memo");
app.use("/memo", memoRouter);

// Frequency
const frequencyRouter = require("./routes/frequency");
app.use("/frequency", frequencyRouter);

// Event
const eventRouter = require("./routes/event");
app.use("/event", eventRouter);

// Alarm
const alarmRouter = require("./routes/alarm");
app.use("/alarm", alarmRouter);

// Search
const searchRouter = require("./routes/search");
app.use("/search", heavyLimiter, searchRouter);

app.get("/", (req, res) => {
  res.send({ message: "Server and Client connected" });
});

app.use((req, res) => {
  res.status(404).send("404");
});

const server = http.createServer(app);

sequelize.sync({ force: false })
  .then(() => {
    console.log("DB 연결 및 테이블 생성 완료");
    server.listen(port, () => {
      console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
    });
  })
  .catch((err) => {
    console.error("DB 연결 실패:", err);
  });