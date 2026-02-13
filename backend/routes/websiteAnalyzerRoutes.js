import express from 'express';
import { analyzeWebsiteUrl } from '../controller/websiteAnalyzerController.js';

const router = express.Router();

router.post('/analyze-website', analyzeWebsiteUrl);

export default router;
