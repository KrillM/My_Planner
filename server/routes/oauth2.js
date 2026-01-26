const express = require('express');
const router = express.Router();
const COAuth2 = require('../controller/COAuth2');

// 구글
router.post('/api/auth/google', COAuth2.googleLogin);

// 네이버
router.post('/api/auth/naver', COAuth2.naverLogin);

// 카카오

module.exports = router;
