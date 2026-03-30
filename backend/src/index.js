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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
