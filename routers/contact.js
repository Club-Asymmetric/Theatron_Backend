const express = require('express');
const router = express.Router();
const { submitContact, getContactInfo } = require('../controllers/contact');

router.get('/', getContactInfo);
router.post('/', submitContact);

module.exports = router;
