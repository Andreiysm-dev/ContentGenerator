import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
import contentCalendar from "./routes/contentCalendar.js";
import companyKbRoutes from "./routes/companyKbRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

// Note the leading slash in mount paths
app.use("/api/company", companyRoutes);
app.use("/api/companyCalendar", contentCalendar);
app.use("/api/companyKb", companyKbRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});