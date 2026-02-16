const express = require('express');
const router = express.Router();
const CPlan = require('../controller/CPlan');
const auth = require('../middleware/auth');

// 일정 생성
router.post('/new', auth, CPlan.createPlan);

// 일정 수정

// 일정 삭제

module.exports = router;