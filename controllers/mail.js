const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
require('dotenv').config();

subject ="Registration Confirmation ";

const send_mail = expressAsyncHandler(async (req, res) => {
  const { to, event} = req.body;
  const text = `Subject: Registration Confirmation – Theatron (Hosted by Immerse & Resolution Clubs of CIT)

Dear Participant,

We are pleased to inform you that your registration for *Theatron*, a film festival hosted by the Immerse and Resolution Clubs of Chennai Institute of Technology, has been successfully completed.

We look forward to your enthusiastic participation on **November 14, 2025**, at **Chennai Institute of Technology**.

Thank you for registering and being part of Theatron 2025!

Warm regards,  
Organizing Committee  
Immerse & Resolution Clubs  
Chennai Institute of Technology`;

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
    res.status(500).json({success:false,message:"failed to send email"});
}
});

module.exports = { send_mail };