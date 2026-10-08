const express =require('express');
const cors = require('cors');
const {send_mail} = require('./mail_sending');
require('dotenv').config();

const reg=require('./routers/registration');
const payment=require('./routers/payment');
const mail=require('./routers/mail');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || process.env.FRONTEND_URL === '*') return callback(null, true);
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed.includes(',')) {
        return allowed.split(',').map((s) => s.trim()).includes(origin);
      }
      return allowed === origin;
    }) || /\.vercel\.app$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin);

    if (isAllowed) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

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
