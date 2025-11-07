const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const expressAsyncHandler = require('express-async-handler');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const get_order = expressAsyncHandler(async (req, res) => {
  const { amount, currency, receipt, event } = req.body;
  console.log("Creating order with data:", req.body);
  if (!amount || !currency || !receipt) {
    res.status(400).send("Missing required fields");
    return;
  }
  if(event === 'General_Pass'){
    if(amount != 89){
      res.status(400).send("Invalid amount for General Pass,Please contact the admin");
      return;
    }
  }
  if(event ==='Graphics_Grid' || event ==='Stage_Play' || event ==='Stills_Of_Soul' ||  event ==='Quizcorn' || event==='Photography_Workshop' || event ==='Blast_in_Blender'){
    if(amount != 99){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event ==='Script_Writing' || event ==='TrailerCut'){
    if(amount !=150){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event ==='CinePlus' ){
    if(amount != 149){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event === 'Dance_Workshop'|| event ==='Model_workshop'){
    if(amount != 199){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  try {
    const options = {
      amount: amount * 100, 
      currency: currency,
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send("Internal Server Error");
  }
});

const verify_payment = expressAsyncHandler(async (req, res) => {
  console.log("Verifying payment with data:", req.body);
  const { payment_id, order_id, signature } = req.body;
  const {name , email, phone, college,event} = req.body;
  const amount = req.body.amount;
  if(event === 'General_Pass'){
    if(amount != 89){
      res.status(400).send("Invalid amount for General Pass,Please contact the admin");
      return;
    }
  }
  if(event ==='Graphics_Grid' || event ==='Stage_play' || event ==='Still_Of_Soul' || event ==='Quizcorn' || event==='Photography_Workshop' || event ==='Blast_in_Blender'){
    if(amount != 99){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event ==='Script_Writing' || event ==='TrailerCut'){
    if(amount !=150){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event ==='CinePlus' ){
    if(amount != 149){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }

  if(event === 'Dance_Workshop'|| event ==='Model_workshop'){
    if(amount != 199){
      res.status(400).send(`Invalid amount for ${event},Please contact the admin`);
      return;
    }
  }
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  if (generated_signature === signature) {
    console.log(`Payment verified successfully for event: ${event} by name: ${name}, email: ${email}, phone: ${phone}, college: ${college}`);
    res.status(200).send("Payment verified successfully");
  } else {
    res.status(400).send("Payment verification failed");
  }
});

module.exports = { get_order, verify_payment };
