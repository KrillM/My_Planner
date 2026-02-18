const express = require('express');
const router = express.Router();
const CCalendar = require('../controller/CCalendar');
const auth = require('../middleware/auth');

router.get("/", auth, CCalendar.showCalendar);

module.exports = router;