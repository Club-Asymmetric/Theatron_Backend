const express =require('express');
const router = express.Router();
const {solo_event,group_event} = require('../controllers/registration');
const verify_payment = require('../middleware/verification');

router.post('/solo/:event',verify_payment,solo_event);
router.post('/group/:event',verify_payment,group_event);

module.exports = router;