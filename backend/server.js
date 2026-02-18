import dotenv from "dotenv";
import express from "express";
import cors from "cors";
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
import assistantRoutes from './routes/assistantRoutes.js';
import authMiddleware from "./middleware/auth.js";

dotenv.config();

// Image generation is hardcoded to Imagen 4.0 in imageGenerationService.js for stability
import { initScheduler } from './services/schedulerService.js';

initScheduler();


const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: true, // Reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Note the leading slash in mount paths
app.use("/api", websiteAnalyzerRoutes); // Before auth - needed for onboarding
app.use("/api", authMiddleware);
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

app.listen(PORT, () => { });