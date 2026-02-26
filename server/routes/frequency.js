const express = require('express');
const router = express.Router();
const CFrequency = require('../controller/CFrequency');
const auth = require('../middleware/auth');

// 자주 사용하는 일정 생성
router.post('/new', auth, CFrequency.createFrequency);

// 자주 사용하는 일정 목록 조회
router.get('/list', auth, CFrequency.frequencyList); 

// 자주 사용하는 일정 상세 목록 조회
router.get('/:frequencyId', auth, CFrequency.frequencyDetail);

// 업데이트 횟수 추가
router.patch('/addcount/:frequencyId', auth, CFrequency.addCount);

// 자주 사용하는 일정 수정
router.put('/upsert/:frequencyId', auth, CFrequency.upsertFrequency);

// 자주 사용하는 일정 삭제
router.delete('/delete/:frequencyId', auth, CFrequency.deleteFrequency);

module.exports = router;