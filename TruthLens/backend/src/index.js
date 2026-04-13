require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const analyzeRouter = require('./routes/analyze');
const historyRouter = require('./routes/history');
const similarRouter = require('./routes/similar');

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

// Rate limiting — 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute.' },
});
app.use('/api', limiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);
app.use('/api/similar', similarRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TruthLens Backend', timestamp: new Date().toISOString() });
});

// ─── 404 & Error Handlers ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔍 TruthLens Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Firebase: ${process.env.FIREBASE_SERVICE_ACCOUNT ? '✅ Admin SDK' : '⚠️  REST API (no service account)'}\n`);
});

module.exports = app;
