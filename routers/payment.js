const express =require('express');
const router = express.Router();
const {get_order,verify_payment} = require('../controllers/payment');

router.post('/get_order',get_order);
router.post('/verify_payment',verify_payment);

module.exports = router;
