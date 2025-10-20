const express = require('express'); 
const router = express.Router();
const {send_mail}=require('../controllers/mail');

router.post('/send_mail',send_mail);

module.exports = router;