const expressAsyncHandler = require('express-async-handler');
const { sendConfirmationEmail } = require('../services/email');

const send_mail = expressAsyncHandler(async (req, res) => {
  const { to, name = 'Participant', event = 'your registered event' } = req.body || {};
  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'Recipient email is required',
    });
  }

  try {
    const result = await sendConfirmationEmail({ to, name, event });
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
      messageId: result?.messageId,
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      code: error.code || null,
    });
  }
});

module.exports = { send_mail };
