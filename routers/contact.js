const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contact');

router.post('/', submitContact);

module.exports = router;
