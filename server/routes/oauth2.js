const express = require('express');
const router = express.Router();
const COAuth2 = require('../controller/COAuth2');

// 구글
router.post('/google', COAuth2.googleLogin);

// 네이버
router.post('/naver', COAuth2.naverLogin);

module.exports = router;
