import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import aiRoutes from './routes/aiRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

const app = express();

// Trust reverse proxy (Vercel, Render, Railway, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiter for general and AI endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 45,
  message: { error: 'Voice queries rate limit exceeded. Please wait a moment.' }
});

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VELO AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      openAiConfigured: Boolean(config.openaiApiKey),
      supabaseConfigured: Boolean(config.supabaseUrl && config.supabaseKey)
    }
  });
});

// Mount Routes
app.use('/api/ai', aiRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening
const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 VELO AI Server running on http://localhost:${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🤖 OpenAI Voice AI: ${config.openaiApiKey ? 'Enabled' : 'Bilingual Local NLP Engine Active'}`);
  console.log(`⚡ Supabase: ${config.supabaseUrl ? 'Enabled' : 'In-Memory Realtime Store Active'}`);
  console.log(`===============================================`);
});

export default app;
