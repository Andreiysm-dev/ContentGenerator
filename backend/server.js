import dotenv from 'dotenv';
import express from "express";
import companyRoutes from "./routes/companyRoutes"
import contentCalendar from "./routes/contentCalendar"
import companyKbRoutes from "./routes/companyKbRoutes"

dotenv.config();
const app = express();
const cors = require('cors');

const PORT = process.env.BACKEND_PORT;


app.use(cors());
app.use(express.json());


app.use("api/company", companyRoutes);
app.use("api/companyCalendar", contentCalendar);
app.use("api/companyKb", companyKbRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});