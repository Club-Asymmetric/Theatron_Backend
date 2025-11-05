const bodyParser = require('body-parser');
const fs = require('fs');
const { google } = require('googleapis');
const expressAsyncHandler = require('express-async-handler');
require('dotenv').config({ path: __dirname + '/.env' });

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function register(sheetName, data) {
  try {
    console.log('Sheet name received:', sheetName);

    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.sheetId,
      range: `${sheetName}!A1:D`, 
    });

    const rows = readResponse.data.values || [];

    const existing = rows.some(
      (row) =>
        (row[2] && row[2].toLowerCase() === data[2].toLowerCase()) // compare email
    );

    if (existing) {
      console.log(`Duplicate found for ${sheetName} by ${data[2]}! Data not added.`);
      return { success: true, message: 'Success!' };
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [data],
      },
    });

    console.log(`✅ Data added to ${sheetName} successfully!`);
    return { success: true, message: 'Data added successfully' };

  } catch (error) {
    console.error('❌ Error adding data:', error);
    return { success: false, message: 'Error adding data' };
  }
}

const solo_event = expressAsyncHandler(async (req, res) => {
  const event = req.params.event;
  const data = [req.body.name, req.body.phone, req.body.email, req.body.college];
  if(event === 'General_Pass'){
    data[3] = req.body.department;
  }
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

const group_event = expressAsyncHandler(async (req, res) => {
  const event = req.params.event;
  let team_size = 0;
  if (event === 'AdaptTune'){
    team_size = 2;
  }
  else if (event === 'Quizcorn'){
    team_size = 3;
  }


  let data = [`${req.body.team_name}`];
  for (let i = 1; i <= team_size; i++) {
    const participantName = req.body[`name${i}`];
    const participantCollege = req.body[`college${i}`] || req.body.college;
    data.push(`${participantName}`, `${participantCollege}`);
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
