const express = require('express');
const router = express.Router();
const Ccrew = require('../controller/Ccrew');

// 회원가입
router.post('/join', Ccrew.addCrew);

// 이메일 중복 확인
router.post('/check-email', Ccrew.isEmailDuplicate);

module.exports = router;