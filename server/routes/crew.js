const express = require('express');
const router = express.Router();
const Ccrew = require('../controller/Ccrew');

// 회원가입
router.post('/join', Ccrew.addCrew);

module.exports = router;