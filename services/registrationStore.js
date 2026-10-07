const { google } = require('googleapis');

const HEADERS = [
  'registrationId', 'createdAt', 'event', 'name', 'email', 'phone', 'college',
  'department', 'year', 'submissionLink', 'teamSize', 'participants',
  'razorpayPaymentId', 'razorpayOrderId', 'amount', 'paymentStatus',
];

let sheetsClient;

function getSheets() {
  if (sheetsClient) return sheetsClient;
  if (!process.env.GOOGLE_CREDENTIALS || !getSpreadsheetId()) {
    throw new Error('Registration storage is not configured');
  }
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function getSpreadsheetId() {
  return process.env.SPREADSHEET_ID || process.env.sheetId;
}

async function findByPayment(paymentId, orderId) {
  const response = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${process.env.REGISTRATION_SHEET || 'Registrations'}!A:P`,
  });
  const rows = response.data.values || [];
  return rows.find((row) => row[12] === paymentId || row[13] === orderId) || null;
}

async function createRegistration(registration) {
  const sheetName = process.env.REGISTRATION_SHEET || 'Registrations';
  const sheets = getSheets();
  const existing = await findByPayment(registration.razorpayPaymentId, registration.razorpayOrderId);
  if (existing) return { duplicate: true, registrationId: existing[0] };

  const row = [
    registration.registrationId,
    registration.createdAt,
    registration.event,
    registration.name,
    registration.email,
    registration.phone,
    registration.college,
    registration.department,
    registration.year,
    registration.submissionLink || '',
    registration.teamSize || '',
    JSON.stringify(registration.participants || []),
    registration.razorpayPaymentId,
    registration.razorpayOrderId,
    registration.amount,
    registration.paymentStatus,
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:P`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] },
  });
  return { duplicate: false, registrationId: registration.registrationId };
}

module.exports = { HEADERS, findByPayment, createRegistration };
