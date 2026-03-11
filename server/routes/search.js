const express = require('express');
const router = express.Router();
const CSearch = require('../controller/CSearch');
const auth = require('../middleware/auth');

router.get("/", auth, CSearch.searchList);

module.exports = router;