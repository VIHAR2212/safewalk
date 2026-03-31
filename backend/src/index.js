import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
  if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
},
  credentials: true,
}));
app.use(express.json());

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/sos', rateLimit({ windowMs: 60 * 1000, max: 5 }));

// Routes
app.use('/api', routes);

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'SafeWalk API' }));

app.listen(PORT, () => {
  console.log(`🛡️  SafeWalk backend running on http://localhost:${PORT}`);
});
