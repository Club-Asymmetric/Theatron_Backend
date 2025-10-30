const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
require('dotenv').config();

subject ="Registration Confirmation ";

const send_mail = expressAsyncHandler(async (req, res) => {
  const { to, event} = req.body;
  const text = "Your Registration for the event " + event + " is successful.We look forward to your participation! at November 14 2025 in Chennai Institute of Technology Thank you!";
    try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }); 
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,   
        subject: subject,
        text: text,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
}catch(error){
    res.status(500).json({success:fail,message:"failed to send email"});
}
});

module.exports = { send_mail };