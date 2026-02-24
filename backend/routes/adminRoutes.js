import express from 'express';
import {
    getAdminStats,
    getAllUsers,
    updateUserRole,
    resetOnboardingStatus,
    getAllCompanies,
    getAuditLogs,
    getSystemHealth,
    getSystemSettings,
    updateSystemSetting,
    logImpersonation,
    sendBroadcast,
    clearAuditLogs,
    adminDeleteCompany
} from '../controller/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users/role', updateUserRole);
router.post('/users/reset-onboarding', resetOnboardingStatus);
router.get('/companies', getAllCompanies);
router.get('/logs', getAuditLogs);
router.post('/logs/clear', clearAuditLogs);
router.get('/health', getSystemHealth);
router.get('/settings', getSystemSettings);
router.post('/settings', updateSystemSetting);
router.post('/audit/impersonate', logImpersonation);
router.post('/broadcast', sendBroadcast);
router.delete('/companies/:companyId', adminDeleteCompany);

export default router;
