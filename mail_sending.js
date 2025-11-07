const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

// ✅ Initialize Google Sheets API
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SUBJECT = "Registration Confirmation – Theatron’25 | Hosted by Immerse & Resolution Clubs, CIT";

const send_mail = expressAsyncHandler(async (req, res) => {
  const sheetName = req.body.sheetName;
  console.log(`📄 Reading sheet: ${sheetName}`);

  try {
    // Step 1️⃣ — Read all rows from A2:E
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheetId,
      range: `${sheetName}!A2:E`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0)
      return res.status(200).json({ success: false, message: "No data found in the sheet." });

    // Step 2️⃣ — Map & filter pending recipients (email is now column C = index 2)
    const pending = rows
      .map((row, i) => ({
        name: row[0]?.trim() || "Participant",
        phone: row[1]?.trim(),
        email: row[2]?.trim(), // ✅ Email is now the 3rd column
        college: row[3]?.trim(),
        mail_status: row[4]?.trim().toLowerCase() || "",
        rowNumber: i + 2, // because we started from A2
      }))
      .filter(
        (p) =>
          p.email && 
          (!p.mail_status || p.mail_status === "not_sent")
      );

    if (pending.length === 0)
      return res.status(200).json({ success: true, message: "All mails already sent." });

    console.log(`📧 Found ${pending.length} pending recipients.`);

    // Step 3️⃣ — Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Step 4️⃣ — Loop & send mails
    for (const person of pending) {
      const text = `Subject: Registration Confirmed – Theatron’25 | Hosted by Immerse & Resolution Clubs, CIT

Dear ${person.name},

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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: person.email,
        subject: SUBJECT,
        text,
      };

      try {
        console.log(`📨 Sending mail to: ${person.email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Mail sent to ${person.email}`);

        // Step 5️⃣ — Update Mail_Status + Timestamp
        const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.sheetId,
          range: `${sheetName}!E${person.rowNumber}:F${person.rowNumber}`, // E = Mail_Status, F = Timestamp
          valueInputOption: "RAW",
          resource: { values: [["sent", timestamp]] },
        });

        await new Promise((r) => setTimeout(r, 1000)); // prevent Gmail rate limit
      } catch (err) {
        console.error(`❌ Failed to send mail to ${person.email}: ${err.message}`);
      }
    }

    console.log("🎉 All pending mails processed successfully.");
    res.status(200).json({ success: true, message: "All pending emails processed successfully." });
  } catch (error) {
    console.error("❌ Error in send_mail:", error);
    res.status(500).json({
      success: false,
      message: "Error while sending mails",
      error: error.message,
    });
  }
});

module.exports = { send_mail };
