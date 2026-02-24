import express from 'express';
import { getCompanyAuditLogs } from '../controller/auditController.js';

const router = express.Router();

router.get('/:companyId', getCompanyAuditLogs);

export default router;
