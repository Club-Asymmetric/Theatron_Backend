const express =require('express');
const cors = require('cors');
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

app.listen(port,(req,res)=>{
    console.log(`Server is running on localhost:${port}`)
})
