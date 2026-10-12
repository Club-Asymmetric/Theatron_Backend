require('dotenv').config();
const nodemailer = require('nodemailer');

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwtMdojVAT5W1XY01_jR3Yzqc-sdsPD3PbTMUL_tSvMSp66jXMfr9ejdzkC8wzTGHaZ/exec';

async function sendViaWebhook({ to, subject, textContent, htmlContent }) {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('EMAIL_WEBHOOK_URL is not configured');

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      subject,
      text: textContent,
      html: htmlContent,
    }),
    redirect: 'follow',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Webhook responded with status ${res.status}`);
  }
  return data;
}

async function sendViaGmail({ to, subject, textContent, htmlContent }) {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  if (!user || !pass) {
    throw new Error('Gmail service is not configured (missing EMAIL_USER or EMAIL_PASS)');
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return await transporter.sendMail({
    from: `"THEATRON 2026 - CIT" <${user}>`,
    replyTo: user,
    to,
    subject,
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
    },
  });
}

async function sendConfirmationEmail({ to, name, event, registrationId, amount }) {
  const eventName = String(event)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const feeDisplay = amount ? `₹${amount}` : '₹99';

  const textContent = `Dear ${name || 'Participant'},

Greetings from Team THEATRON, Chennai Institute of Technology!

Thank you for registering for THEATRON 2026, our inter-collegiate Film Festival. We’re excited to have you be a part of the event!

Here are the details regarding your registered event:

Event: ${eventName}
Date: 11 November 2026
Registration Fee: ${feeDisplay}

The reporting time and venue details will be updated shortly. We request you to stay tuned for further updates.

For all the latest announcements, event updates and important information, do follow our official Instagram page: @immerse_cit 
@team_resolution.cit

Please make sure to go through the event rules and guidelines before the event. Further instructions will also be shared with you through our official communication channels.

We look forward to welcoming you to THEATRON 2026!

Regards,
Team IMMERSE & RESOLUTION 
Chennai Institute of Technology
THEATRON 2026`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0b0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e1e1e6;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0b0e; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #141419; border: 1px solid #282832; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- Cinematic Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #180000 0%, #300000 50%, #0d0000 100%); padding: 36px 30px; text-align: center; border-bottom: 3px solid #e10600;">
                  <span style="display: inline-block; background-color: rgba(225, 6, 0, 0.15); border: 1px solid rgba(225, 6, 0, 0.5); color: #ff4d4d; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;">
                    Chennai Institute of Technology
                  </span>
                  <h1 style="margin: 0; font-size: 34px; font-weight: 900; letter-spacing: 3px; color: #ffffff; text-transform: uppercase; text-shadow: 0 2px 10px rgba(225,6,0,0.4);">
                    THEATRON <span style="color: #e10600;">2026</span>
                  </h1>
                  <p style="margin: 6px 0 0; font-size: 13px; color: #d0c0c0; letter-spacing: 1.5px; text-transform: uppercase;">
                    Inter-Collegiate Film Festival • Team IMMERSE & RESOLUTION
                  </p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 32px 30px 24px;">
                  <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #ffffff;">
                    Dear ${name || 'Participant'},
                  </p>
                  <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #b8b8c2;">
                    Greetings from <strong style="color: #ffffff;">Team THEATRON</strong>, Chennai Institute of Technology!
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #b8b8c2;">
                    Thank you for registering for <strong style="color: #ffffff;">THEATRON 2026</strong>, our inter-collegiate Film Festival. We’re excited to have you be a part of the event!
                  </p>

                  <!-- Decorated Event Details Card -->
                  <div style="background: linear-gradient(145deg, #1a1a24 0%, #121218 100%); border: 1px solid #2e2e3e; border-left: 5px solid #e10600; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #e10600; text-transform: uppercase; margin-bottom: 12px;">
                      Registration Details
                    </div>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #8e8e9c; width: 140px;">Event</td>
                        <td style="padding: 6px 0; font-size: 16px; font-weight: 700; color: #ffffff;">${eventName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #8e8e9c;">Date</td>
                        <td style="padding: 6px 0; font-size: 15px; font-weight: 600; color: #ffffff;">11 November 2026</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #8e8e9c;">Registration Fee</td>
                        <td style="padding: 6px 0; font-size: 16px; font-weight: 700; color: #4ade80;">${feeDisplay}</td>
                      </tr>
                      ${registrationId ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #8e8e9c;">Registration ID</td>
                        <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #cbd5e1;">${registrationId}</td>
                      </tr>` : ''}
                    </table>
                  </div>

                  <!-- Important Updates Notice -->
                  <div style="background-color: #1a1816; border: 1px solid #3d2d1d; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #f59e0b;">
                      <strong>📌 Reporting & Venue:</strong> The reporting time and venue details will be updated shortly. We request you to stay tuned for further updates.
                    </p>
                  </div>

                  <!-- Instagram CTA Section -->
                  <div style="text-align: center; background-color: #101015; border: 1px dashed #2a2a38; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 14px; font-size: 14px; color: #b8b8c2;">
                      For all the latest announcements, event updates and important information, do follow our official Instagram pages:
                    </p>
                    <div style="display: inline-block;">
                      <a href="https://instagram.com/immerse_cit" style="display: inline-block; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 24px; margin: 4px; box-shadow: 0 4px 14px rgba(220, 39, 67, 0.4);">
                        @immerse_cit
                      </a>
                      <a href="https://instagram.com/team_resolution.cit" style="display: inline-block; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 24px; margin: 4px; box-shadow: 0 4px 14px rgba(220, 39, 67, 0.4);">
                        @team_resolution.cit
                      </a>
                    </div>
                  </div>

                  <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #9c9ca8;">
                    Please make sure to go through the event rules and guidelines before the event. Further instructions will also be shared with you through our official communication channels.
                  </p>
                  <p style="margin: 0 0 28px; font-size: 15px; font-weight: 600; color: #ffffff;">
                    We look forward to welcoming you to THEATRON 2026!
                  </p>

                  <!-- Sign-off -->
                  <div style="border-top: 1px solid #282832; padding-top: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #b8b8c2;">Regards,</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #ffffff;">Team IMMERSE &amp; RESOLUTION</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #8e8e9c;">Chennai Institute of Technology</p>
                    <p style="margin: 2px 0 0; font-size: 13px; font-weight: 600; color: #e10600;">THEATRON 2026</p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0e0e12; padding: 18px 30px; text-align: center; border-top: 1px solid #1f1f28;">
                  <p style="margin: 0; font-size: 12px; color: #626270;">
                    © 2026 THEATRON • Team IMMERSE &amp; RESOLUTION • Chennai Institute of Technology
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const subject = 'THEATRON 2026 – Event Details & Important Information';

  const webhookUrl = process.env.EMAIL_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const webhookResult = await sendViaWebhook({ to, subject, textContent, htmlContent });
      console.log(`✅ Confirmation email sent via Webhook to ${to}`);
      return { success: true, messageId: webhookResult?.messageId || 'webhook_sent' };
    } catch (err) {
      console.error(`⚠️ Webhook delivery failed (${err.message}), falling back to Gmail SMTP...`);
    }
  }

  const gmailResult = await sendViaGmail({ to, subject, textContent, htmlContent });
  console.log(`✅ Confirmation email sent via Gmail to ${to} (MessageId: ${gmailResult.messageId})`);
  return gmailResult;
}

module.exports = { sendConfirmationEmail };
