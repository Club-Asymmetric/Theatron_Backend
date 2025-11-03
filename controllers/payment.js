const {google}=require('googleapis');
const nodemailer=require('nodemailer');
const expressAsyncHandler=require('express-async-handler');
const crypto=require('crypto');
require('dotenv').config();

// Razorpay setup
const Razorpay=require('razorpay');
const razorpay=new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET
});

// Google Sheets setup
const credentials=JSON.parse(process.env.GOOGLE_CREDENTIALS);
const auth=new google.auth.GoogleAuth({
  credentials,
  scopes:['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets=google.sheets({version:'v4',auth});

// Helper to store registration
async function storeRegistration(event,data){
  try{
    await sheets.spreadsheets.values.append({
      spreadsheetId:process.env.sheetId,
      range:`${event}!A1`,
      valueInputOption:'RAW',
      insertDataOption:'INSERT_ROWS',
      resource:{values:[data]},
    });
    console.log(`✅ Added registration to ${event}`);
  }catch(err){
    console.error('❌ Failed to store registration:',err);
  }
}

// Helper to send confirmation mail
async function sendConfirmationMail(to,event){
  try{
    let transporter=nodemailer.createTransport({
      service:'gmail',
      auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
      },
    });
    let subject=`Registration Confirmed – ${event} | Theatron'25`;
    let text=`Dear Participant,\n\nWe are delighted to confirm your registration for *${event}* under Theatron’25.\nWe look forward to seeing you on November 14, 2025, at Chennai Institute of Technology.\n\nWarm regards,\nTeam Theatron\nCIT\n\nFor any queries: +91 79048 49032`;

    await transporter.sendMail({
      from:process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    console.log(`📩 Email sent to ${to}`);
  }catch(err){
    console.error('❌ Mail sending failed:',err);
  }
}

const verify_payment=expressAsyncHandler(async(req,res)=>{
  const {payment_id,order_id,signature,event,name,phone,email,college}=req.body;

  const generated_signature=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  if(generated_signature!==signature){
    return res.status(400).send("Payment verification failed");
  }

  // ✅ Store registration & send confirmation
  await storeRegistration(event,[name,phone,email,college]);
  await sendConfirmationMail(email,event);

  res.status(200).json({success:true,message:"Payment verified & registration completed"});
});

module.exports={get_order,verify_payment};
