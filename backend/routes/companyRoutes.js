import express from "express";
import {} from "../controller/companyController"
const router = express.Router();

router.get("/getCompany", getCompany)

export default router;