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
      r.registrationId, r.createdAt, r.name, r.email, r.phone,
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

const OFFICIAL_SPREADSHEET_ID = '17I4RgE6T5PLUrHwmuOKECj5DC68F-7oo6TeTTe2EBYg';

function getSpreadsheetId() {
  return process.env.SPREADSHEET_ID || OFFICIAL_SPREADSHEET_ID;
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
    const eventRes = await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `'${eventConfig.title}'!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      resource: { values: [eventRow] },
    });
    console.log(`✅ Appended registration to event sheet: ${eventConfig.title}`);
    if (eventRes.data?.updates?.updatedRange) {
      await formatAppendedRow(sheets, getSpreadsheetId(), eventConfig.title, eventRes.data.updates.updatedRange, eventRow.length);
    }
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

  const masterRes = await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `'${masterSheet}'!A:Q`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    resource: { values: [masterRow] },
  });
  console.log(`✅ Appended registration to master sheet: ${masterSheet}`);
  if (masterRes.data?.updates?.updatedRange) {
    await formatAppendedRow(sheets, getSpreadsheetId(), masterSheet, masterRes.data.updates.updatedRange, masterRow.length);
  }

  return { duplicate: false, registrationId: registration.registrationId };
}

async function ensureQueriesSheet(sheets, spreadsheetId) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const hasQueries = meta.data.sheets.some((s) => s.properties.title === 'Queries');
    if (!hasQueries) {
      console.log(`Creating Queries tab in spreadsheet ${spreadsheetId}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Queries',
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'Queries'!A1:E1",
        valueInputOption: 'RAW',
        resource: {
          values: [['Created At', 'Name', 'Email', 'Subject', 'Message']],
        },
      });
      console.log('Queries tab created and initialized with headers.');
    }
  } catch (err) {
    console.error('Error ensuring Queries sheet:', err.message);
  }
}

async function formatAppendedRow(sheets, spreadsheetId, sheetTitle, updatedRange, colCount = 15) {
  try {
    const match = updatedRange?.match(/(\d+):[A-Z]+(\d+)/);
    if (!match) return;
    const startRow = parseInt(match[1], 10) - 1;
    const endRow = parseInt(match[2], 10);

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = meta.data.sheets.find((s) => s.properties.title === sheetTitle);
    if (!targetSheet) return;
    const sheetId = targetSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: startRow,
                endRowIndex: endRow,
                startColumnIndex: 0,
                endColumnIndex: colCount,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 1 },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  wrapStrategy: 'WRAP',
                  textFormat: {
                    fontFamily: 'Roboto',
                    fontSize: 10,
                    bold: false,
                    foregroundColor: { red: 0.098, green: 0.098, blue: 0.098 },
                  },
                  borders: {
                    top: { style: 'SOLID', width: 1, color: { red: 0.88, green: 0.88, blue: 0.88 } },
                    bottom: { style: 'SOLID', width: 1, color: { red: 0.88, green: 0.88, blue: 0.88 } },
                    left: { style: 'SOLID', width: 1, color: { red: 0.88, green: 0.88, blue: 0.88 } },
                    right: { style: 'SOLID', width: 1, color: { red: 0.88, green: 0.88, blue: 0.88 } },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy,borders)',
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error(`Error formatting appended row for ${sheetTitle}:`, err.message);
  }
}

async function createContactQuery({ name, email, subject, message }) {
  const sheets = getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureQueriesSheet(sheets, spreadsheetId);

  const row = [
    new Date().toISOString(),
    name.trim(),
    email.trim().toLowerCase(),
    subject.trim(),
    message.trim(),
  ];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Queries'!A:E",
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    resource: { values: [row] },
  });
  console.log(`✅ Appended contact query from ${email} to Queries sheet`);

  if (appendRes.data?.updates?.updatedRange) {
    await formatAppendedRow(sheets, spreadsheetId, 'Queries', appendRes.data.updates.updatedRange, 5);
  }
}

module.exports = { MASTER_HEADERS, EVENT_SHEET_MAP, findByPayment, createRegistration, createContactQuery, getSpreadsheetId };
