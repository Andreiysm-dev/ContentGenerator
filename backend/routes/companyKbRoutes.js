import express from "express";
import {getCompanyKb} from "../controller/companyKbController.js"
const router = express.Router();

router.get("/getCompanyKb", getCompanyKb);

export default router;