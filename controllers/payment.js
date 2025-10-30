const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const expressAsyncHandler = require('express-async-handler');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
const get_order = expressAsyncHandler(async (req, res) => {
  const { amount, currency, receipt } = req.body;
  if (!amount || !currency || !receipt) {
    res.status(400).send("Missing required fields");
    return;
  }
  try {
    const options = {
      amount: amount * 100, 
      currency: currency,
      receipt: receipt
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order: ', error);
    res.status(500).send("Internal Server Error");
  }
});

const verify_payment = expressAsyncHandler(async (req, res) => {
  const { payment_id, order_id, signature } = req.body;
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                     .update(`${order_id}|${payment_id}`)
                                     .digest('hex');
  if (generated_signature === signature) {
    res.status(200).send("Payment verified successfully");
  } else {
    res.status(400).send("Payment verification failed");
  }
});

module.exports = { get_order, verify_payment };