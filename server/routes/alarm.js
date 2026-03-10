const express = require('express');
const router = express.Router();
const CAlarm = require('../controller/CAlarm');
const auth = require('../middleware/auth');

router.get("/", auth, CAlarm.getAlarms);

module.exports = router;