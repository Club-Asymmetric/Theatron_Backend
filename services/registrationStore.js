const { google } = require('googleapis');

const MASTER_HEADERS = [
  'Registration ID',
  'Created At',
  'Event',
  'Name',
  'Email',
  'Phone',
  'College',
  'Department',
  'Year',
  'Submission Link',
  'Team Name',
  'Team Size',
  'Participants',
  'Razorpay Payment ID',
  'Razorpay Order ID',
  'Amount (₹)',
  'Payment Status',
];

function formatParticipants(participants) {
  if (!Array.isArray(participants) || participants.length === 0) return '';
  return participants
    .filter((p) => p && (p.name || p.phone))
    .map((p, i) => `${i + 1}. ${p.name || ''} (${p.phone || ''})`)
    .join('; ');
}

const EVENT_SHEET_MAP = {
  'dance': {
    title: 'Dance',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'photography': {
    title: 'Photography',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'vfx-and-editing': {
    title: 'VFX and Editing',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'script-writing': {
    title: 'Script Writing',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'storyboard': {
    title: 'Storyboard',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'quizcorn': {
    title: 'Quiz Corn',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.teamName || '', r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'brainstorm': {
    title: 'Brainstorm',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year,
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'stills-of-soul': {
    title: 'Stills of Soul',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year, r.submissionLink || '',
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'graphics-grid': {
    title: 'Graphics Grid',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year, r.submissionLink || '',
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'cineplus': {
    title: 'Cineplus',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
      r.college, r.department, r.year, r.submissionLink || '',
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'stage-play': {
    title: 'Stage Play',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.teamName || '', r.teamSize || '',
      r.name, r.email, r.phone,
      r.college, r.department, r.year, formatParticipants(r.participants),
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'debate': {
    title: 'ThiraiVaadham Debate',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt, r.teamName || '', r.teamSize || '',
      r.name, r.email, r.phone,
      r.college, r.department, r.year, formatParticipants(r.participants),
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
  'adaptune': {
    title: 'Adaptune',
    makeRow: (r, amt) => [
      r.registrationId, r.createdAt,
      Number(r.teamSize) === 2 ? 'Duo' : 'Solo',
      r.name, r.email, r.phone,
      r.college, r.department, r.year,
      Number(r.teamSize) === 2 ? formatParticipants(r.participants?.slice(1)) : 'N/A',
      r.razorpayPaymentId, r.razorpayOrderId, amt, r.paymentStatus,
    ],
  },
};

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
  const masterSheet = process.env.REGISTRATION_SHEET || 'Registrations';
  const response = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `'${masterSheet}'!A:Q`,
  });
  const rows = response.data.values || [];
  if (rows.length <= 1) return null;

  return rows.slice(1).find((row) =>
    row.includes(paymentId) || row.includes(orderId)
  ) || null;
}

async function createRegistration(registration) {
  const masterSheet = process.env.REGISTRATION_SHEET || 'Registrations';
  const sheets = getSheets();
  const existing = await findByPayment(registration.razorpayPaymentId, registration.razorpayOrderId);
  if (existing) return { duplicate: true, registrationId: existing[0] };

  const amountInRupees = registration.amount ? registration.amount / 100 : '';

  // 1. Write to event-specific sheet if mapped
  const eventConfig = EVENT_SHEET_MAP[registration.event];
  if (eventConfig) {
    const eventRow = eventConfig.makeRow(registration, amountInRupees);
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `'${eventConfig.title}'!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [eventRow] },
    });
    console.log(`✅ Appended registration to event sheet: ${eventConfig.title}`);
  }

  // 2. Write to master Registrations sheet
  const masterRow = [
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
    registration.teamName || '',
    registration.teamSize || '',
    formatParticipants(registration.participants),
    registration.razorpayPaymentId,
    registration.razorpayOrderId,
    amountInRupees,
    registration.paymentStatus,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `'${masterSheet}'!A:Q`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [masterRow] },
  });
  console.log(`✅ Appended registration to master sheet: ${masterSheet}`);

  return { duplicate: false, registrationId: registration.registrationId };
}

async function createContactQuery({ name, email, subject, message }) {
  const sheets = getSheets();
  const row = [
    new Date().toISOString(),
    name.trim(),
    email.trim().toLowerCase(),
    subject.trim(),
    message.trim(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "'Queries'!A:E",
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] },
  });
  console.log(`✅ Appended contact query from ${email} to Queries sheet`);
}

module.exports = { MASTER_HEADERS, EVENT_SHEET_MAP, findByPayment, createRegistration, createContactQuery };
