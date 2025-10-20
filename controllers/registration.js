const bodyParser=require('body-parser');
const fs=require('fs');
const {google}=require('googleapis')
const expressAsyncHandler=require('express-async-handler');
const path=require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const credentialsPath = path.join(__dirname, '../config/credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function register(sheetName, data) {
  try {
    console.log("Sheet name received:", sheetName);
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.sheetId,
      range: `${sheetName}!A1`,  // Append to sheet
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [data]
      }
    });
    console.log(`Data added to ${sheetName} successfully!`);
  } catch (error) {
    console.error('Error adding data: ', error);
  }
}

//const events=["Cine_pulse","Trailer_cut","stills_of_soul","Adapt_tune","Graphics_grid","The_final_draft","Quizcorn","Fusion_frames"];

const solo_event=expressAsyncHandler(async(req,res)=>{
  const event =req.params.event;
  const data= [req.body.name,req.body.phone,req.body.email,req.body.college];
  try{
    await register(event,data);
    res.send("Registered Successfully");
  }catch(error){
    console.error('Error registering for Cine_pulse: ', error);
    res.send("Registration Failed");
  }
});

const group_event=expressAsyncHandler(async(req,res)=>{
  const event =req.params.event;
  const team_size=req.body.team_size;
  if (event =="Adapt_tune"){
    if(team_size > 2){
      res.send("Invalid team size for Adapt_tune");
      return;
    }
  }
  if(event =="Quizcorn"){
    if(team_size > 3){
      res.send("Invalid team size for Quizcorn");
      return;
    }
  }
  let data=[];
  if(team_size<1 || team_size>10){
    res.send("Invalid team size");
    return;
  }else{
     data = [`${req.body.team_name}`];
    for (let i = 1; i <= team_size; i++) {
         const participantName = req.body[`name${i}`];
         const participantCollege = req.body[`college${i}`] || req.body.college; // fallback
         data.push( `${participantName}`);
         data.push( `${participantCollege}`);
    }
    const remaining = 10 - team_size;
    for (let j = 0; j < remaining; j++) {
        data.push( ``);
        data.push( ``);
    }
    data.push( req.body.phone);
    data.push(req.body.email);
  }
  try{
    await register(event,data);
    res.send("Registered Successfully");

  }catch(error){
    console.error('Error registering for group event: ', error);
    res.send("Registration Failed");
  }

});

module.exports={solo_event,group_event};