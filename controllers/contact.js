const expressAsyncHandler = require('express-async-handler');
const { createContactQuery, getSpreadsheetId } = require('../services/registrationStore');

const getContactInfo = expressAsyncHandler(async (req, res) => {
  return res.status(200).json({
    status: 'ok',
    spreadsheetId: getSpreadsheetId(),
    hasGoogleCreds: Boolean(process.env.GOOGLE_CREDENTIALS),
  });
});

const submitContact = expressAsyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    await createContactQuery({ name, email, subject, message });
    return res.status(200).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Error saving contact query:', error);
    return res.status(500).json({
      error: 'Unable to save contact query. Please try again later.',
      details: error.message,
    });
  }
});

module.exports = { submitContact, getContactInfo };
