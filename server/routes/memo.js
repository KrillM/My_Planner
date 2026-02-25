const express = require('express');
const router = express.Router();
const CMemo = require('../controller/CMemo');
const auth = require('../middleware/auth');

// 일정 메모 수정
router.put("/:dateKey", auth, CMemo.upsertDateMemo);

// 자주 사용하는 일정 수정
router.put("/frequency/:frequencyId", auth, CMemo.upsertFrequencyMemo);

module.exports = router;