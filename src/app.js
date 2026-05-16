require('dotenv').config();

const express = require('express');
const authRouter = require('./routes/auth.router');
const authMiddleware = require('./middlewares/auth.middleware');
const interviewRouter = require('./routes/interview.router');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({
    origin: ['https://loopkit.vercel.app', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
module.exports = app;