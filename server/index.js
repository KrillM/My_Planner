const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors({ origin: true, credentials: true }));
app.use("/static", express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const router = require("./routes");
// app.use("/", router);

const crewRouter = require("./routes/crew");
app.use("/crew", crewRouter);  

app.get("/", (req, res) => {
  res.send({ message: "Server and Client connected" });
});

app.use((req, res) => {
  res.status(404).send("404");
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});