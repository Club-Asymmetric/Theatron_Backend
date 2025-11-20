const express =require('express');
const cors = require('cors');
const {send_mail} = require('./mail_sending');
require('dotenv').config();

const reg=require('./routers/registration');
const payment=require('./routers/payment');
const mail=require('./routers/mail');

const app = express();
const port = process.env.port;

app.use(express.json());
app.use(cors());

app.use('/register',reg);
app.use('/payment',payment);
app.use('/mail',mail);
app.use('/send_mail',send_mail);
app.get('/ping',(req,res)=>{
    const ip = req.ip;
    console.log(`received req from ${ip}`);
    res.send('pong');
});

app.listen(port,(req,res)=>{
    console.log(`Server is running on localhost:${port}`)
})
