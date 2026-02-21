const express = require('express');
const router = express.Router();
const CMemo = require('../controller/CMemo');
const auth = require('../middleware/auth');

router.put("/:dateKey", auth, CMemo.upsertMemo);

module.exports = router;