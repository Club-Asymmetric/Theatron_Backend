const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
require('dotenv').config();

subject ="Registration Confirmation ";

const send_mail = expressAsyncHandler(async (req, res) => {
  const { to} = req.body;
  const text = `Subject: Registration Confirmed – Theatron’25 | Hosted by Immerse & Resolution Clubs, CIT

Dear Participant,

We are delighted to confirm your registration for Theatron’25, the film festival hosted by the Immerse and Resolution Clubs of Chennai Institute of Technology.

We look forward to your enthusiastic participation on November 14, 2025, at Chennai Institute of Technology.

Please use this email to obtain OD (On Duty) approval from your institute if required.

Thank you for joining us in celebrating creativity and cinematic expression at Theatron’25.

Warm regards,
Organizing Committee
Theatron’25
Chennai Institute of Technology

For any queries, contact us at:
📞 +91 79048 49032`;

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
    console.log("Sending email to:", to);
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
}catch(error){
    res.status(500).json({success:false,message:"failed to send email",error:error.message});
}
});

module.exports = { send_mail };