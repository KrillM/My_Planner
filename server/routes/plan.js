const express = require('express');
const router = express.Router();
const CPlan = require('../controller/CPlan');
const auth = require('../middleware/auth');

// 일정 생성
router.post('/new', auth, CPlan.createPlan);

// 오늘 일정 조회
router.get("/today", auth, CPlan.getTodayPlan);

// 다른 날짜 일정 조회
router.get("/:dateKey", auth, CPlan.getPlanByDate);

// 일정 수정

// 일정 삭제

module.exports = router;