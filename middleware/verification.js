const expressAsyncHandler = require('express-async-handler');
const crypto = require('crypto');
require('dotenv').config();

const verify_payment = expressAsyncHandler(async (req, res,next) => {
  const { payment_id, order_id, signature } = req.body;
  const {name , email, phone, college,event} = req.body;
  const amount = req.body.amount;
   if(event === 'General_Pass'){
      res.status(400).send("Event Registration for General Pass is Closed , Try to register for other events");
      return;
  }
  if(event ==='Graphics_Grid' || event ==='Stage_play' || event ==='Still_Of_Soul' || event ==='AdaptTune'  || event ==='Quizcorn' || event==='Photography_Workshop' || event ==='Blast_in_Blender'){
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
    next();
  } else {
    res.status(400).send("Payment verification failed");
  }
});

module.exports = verify_payment;