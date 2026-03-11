import dotenv from "dotenv";
dotenv.config(); // Must be first so env vars are available to all imports

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import companyRoutes from "./routes/companyRoutes.js";
import contentCalendar from "./routes/contentCalendar.js";
import companyKbRoutes from "./routes/companyKbRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import collaboratorRoutes from './routes/collaboratorRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import websiteAnalyzerRoutes from './routes/websiteAnalyzerRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import authRoutes from './routes/authRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import authMiddleware from "./middleware/auth.js";

// Image generation is hardcoded to Imagen 4.0 in imageGenerationService.js for stability
import { initScheduler, initEmailScheduler } from './services/schedulerService.js';

initScheduler();
initEmailScheduler();


const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

// Trust the first proxy hop (Render/Cloudflare) so Express reads the real
// client IP from X-Forwarded-For instead of the proxy's shared IP.
// Without this, ALL users share one rate-limit bucket in production.
app.set('trust proxy', 1);

// --- Security Headers ---
app.use(helmet());

// --- CORS: Only allow known frontend origins ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'X-Impersonate-User'],
  optionsSuccessStatus: 200
}));

// --- Body Parsing (reduced from 100mb to prevent DoS abuse) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// General limiter: 500 requests per 15 minutes (applies to all /api routes).
// Uses JWT user ID as the key when the token is present — this is accurate
// for authenticated APIs and isn't affected by shared proxy IPs (Cloudflare/Render).
// Falls back to IP for unauthenticated requests (e.g. /api/public).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => {
    // Extract user ID from Bearer token if present
    try {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const payload = JSON.parse(
          Buffer.from(auth.split('.')[1], 'base64').toString()
        );
        if (payload?.sub) return `user:${payload.sub}`;
      }
    } catch { /* ignore malformed tokens */ }
    // Fallback: X-Forwarded-For real IP (trust proxy is set above)
    return req.ip || 'unknown';
  },
});

// AI limiter: 40 requests per minute per user (for expensive AI generation only)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI generation requests, please wait a moment.' },
  keyGenerator: (req) => {
    try {
      const auth = req.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const payload = JSON.parse(
          Buffer.from(auth.split('.')[1], 'base64').toString()
        );
        if (payload?.sub) return `user:${payload.sub}`;
      }
    } catch { /* ignore */ }
    return req.ip || 'unknown';
  },
});


app.use('/api', generalLimiter);
// AI limiter only on genuinely expensive AI endpoints — NOT on content-calendar
// (that route is polled every few seconds and is not an AI call)
app.use('/api/generate-content', aiLimiter);
app.use('/api/analyze-website', aiLimiter);
app.use('/api/generate-image', aiLimiter);
app.use('/api/generate-caption', aiLimiter);
app.use('/api/assistant', aiLimiter);

// Note the leading slash in mount paths
app.use("/api/public", publicRoutes); // Publicly accessible system info
// websiteAnalyzerRoutes moved to after authMiddleware — users are authenticated by onboarding time
app.use("/api", authMiddleware);
app.use("/api", websiteAnalyzerRoutes);
app.use("/api", companyRoutes);
app.use("/api", contentCalendar);
app.use("/api", companyKbRoutes);
app.use("/api", storageRoutes);
app.use("/api", collaboratorRoutes);
app.use("/api", profileRoutes);
app.use("/api", accountRoutes);
app.use("/api", authRoutes);
app.use("/api", socialRoutes);
app.use("/api", aiRoutes);
app.use("/api", assistantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);

app.listen(PORT, () => { });