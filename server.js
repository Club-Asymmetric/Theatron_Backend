const express =require('express');
const cors = require('cors');
const {send_mail} = require('./mail_sending');
require('dotenv').config();

const reg=require('./routers/registration');
const payment=require('./routers/payment');
const mail=require('./routers/mail');

const app = express();
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use('/register',reg);
app.use('/payment',payment);
app.use('/mail',mail);
app.use('/send_mail',send_mail);
app.get('/ping',(req,res)=>{
    res.send('pong');
});

const port = Number(process.env.PORT || 10000);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
