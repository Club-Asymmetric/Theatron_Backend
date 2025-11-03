const bodyParser = require('body-parser');
const fs = require('fs');
const { google } = require('googleapis');
const expressAsyncHandler = require('express-async-handler');
require('dotenv').config({ path: __dirname + '/.env' });

// ✅ Load Google credentials from .env
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// ✅ Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ✅ Initialize Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

// Function to append registration data
async function register(sheetName, data) {
  try {
    console.log('Sheet name received:', sheetName);
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheetId,
      range: `${sheetName}!A1`, // Append to sheet
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [data],
      },
    });
    console.log(`Data added to ${sheetName} successfully!`);
  } catch (error) {
    console.error('Error adding data:', error);
  }
}

// ✅ Solo event registration
const solo_event = expressAsyncHandler(async (req, res) => {
  const event = req.params.event;
  const data = [req.body.name, req.body.phone, req.body.email, req.body.college];
  if (event === 'CinePlus') {
    data.push(req.body.short_flim_link || '');
  }
  try {
    await register(event, data);
    res.send('Registered Successfully');
  } catch (error) {
    console.error('Error registering for solo event:', error);
    res.send('Registration Failed');
  }
});

// ✅ Group event registration
const group_event = expressAsyncHandler(async (req, res) => {
  const event = req.params.event;
  const team_size = req.body.team_size;

  if (event === 'Adapt_tune' && team_size > 2) {
    res.send('Invalid team size for Adapt_tune');
    return;
  }
  if (event === 'Quizcorn' && team_size > 3) {
    res.send('Invalid team size for Quizcorn');
    return;
  }

  if (team_size < 1 || team_size > 10) {
    res.send('Invalid team size');
    return;
  }

  let data = [`${req.body.team_name}`];
  for (let i = 1; i <= team_size; i++) {
    const participantName = req.body[`name${i}`];
    const participantCollege = req.body[`college${i}`] || req.body.college;
    data.push(`${participantName}`, `${participantCollege}`);
  }

  // Fill remaining empty slots
  const remaining = 10 - team_size;
  for (let j = 0; j < remaining; j++) {
    data.push(``, ``);
  }

  data.push(req.body.phone, req.body.email);

  try {
    await register(event, data);
    res.send('Registered Successfully');
  } catch (error) {
    console.error('Error registering for group event:', error);
    res.send('Registration Failed');
  }
});

module.exports = { solo_event, group_event };
