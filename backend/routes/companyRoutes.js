import express from "express";
import {getCompany} from "../controller/companyController.js"
const router = express.Router();

router.get("/getCompany", getCompany);

export default router;