const express =require('express');
const router = express.Router();
const {solo_event,group_event} = require('../controllers/registration');

router.post('/solo/:event',solo_event);
router.post('/group/:event',group_event);

module.exports = router;