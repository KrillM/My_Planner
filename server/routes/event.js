const express = require('express');
const router = express.Router();
const CEvent = require('../controller/CEvent');
const auth = require('../middleware/auth');

// 이벤트 목록 조회
router.get('/list', auth, CEvent.eventList); 

// 이벤트 생성
router.post('/new', auth, CEvent.createEvent);

module.exports = router;