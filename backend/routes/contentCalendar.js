import express from "express";
import {getContentCalendar} from "../controller/contentCalendarController.js"
const router = express.Router();

router.get("/getContentCalendar", getContentCalendar)


export default router;