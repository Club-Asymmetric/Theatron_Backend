const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

// ✅ Initialize Google Sheets API
const credentials = process.env.GOOGLE_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
  : null;
const auth = credentials
  ? new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  : null;
const sheets = auth ? google.sheets({ version: 'v4', auth }) : null;

const SUBJECT = 'THEATRON 2026 – Event Details & Important Information';

const send_mail = expressAsyncHandler(async (req, res) => {
  const sheetName = req.body.sheetName;
  try {
    if (!sheets || !process.env.sheetId) {
      return res.status(500).json({ success: false, message: 'Google Sheets is not configured' });
    }
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
      const eventName = sheetName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      const text = `Dear ${person.name},

Greetings from Team IMMERSE, Chennai Institute of Technology!

Thank you for registering for THEATRON 2026, our inter-collegiate Film Festival. We’re excited to have you be a part of the event!

Here are the details regarding your registered event:

Event: ${eventName}
Date: 10 November 2026
Registration Fee: ₹99

The reporting time and venue details will be updated shortly. We request you to stay tuned for further updates.

For all the latest announcements, event updates and important information, do follow our official Instagram page: @immerse_cit.

Please make sure to go through the event rules and guidelines before the event. Further instructions will also be shared with you through our official communication channels.

We look forward to welcoming you to THEATRON 2026!

Regards,
Team IMMERSE
Chennai Institute of Technology
THEATRON 2026`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: person.email,
        subject: SUBJECT,
        text,
      };

      try {
        await transporter.sendMail(mailOptions);

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
        console.error(`Failed to send confirmation mail: ${err.message}`);
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
