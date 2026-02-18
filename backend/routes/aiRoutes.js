
import express from 'express';
// @ts-ignore
import { generateContent } from '../controller/aiController.js';

const router = express.Router();

router.post('/generate-content', generateContent);

export default router;
