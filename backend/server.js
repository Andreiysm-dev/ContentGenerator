import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
import contentCalendar from "./routes/contentCalendar.js";
import companyKbRoutes from "./routes/companyKbRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import collaboratorRoutes from './routes/collaboratorRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import authMiddleware from "./middleware/auth.js";

dotenv.config();

console.log('DEBUG: Backend started');
console.log('DEBUG: Working directory:', process.cwd());
// Image generation is hardcoded to Imagen 4.0 in imageGenerationService.js for stability


const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

// Note the leading slash in mount paths
app.use("/api", webhookRoutes);
app.use("/api", authMiddleware);
app.use("/api", companyRoutes);
app.use("/api", contentCalendar);
app.use("/api", companyKbRoutes);
app.use("/api", storageRoutes);
app.use("/api", collaboratorRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});