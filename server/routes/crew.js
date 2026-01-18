const express = require('express');
const router = express.Router();
const Ccrew = require('../controller/Ccrew');

// 회원가입
router.post('/join', Ccrew.addCrew);

// 이메일 중복 확인
router.post('/check-email', Ccrew.isEmailDuplicate);

// 로그인
router.post('/login', Ccrew.login);

module.exports = router;