import express from 'express';
import { getProfile, updateProfile, getNotificationSettings, updateNotificationSettings } from '../controller/profileController.js';

const router = express.Router();

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/profile/notifications/:companyId', getNotificationSettings);
router.put('/profile/notifications/:companyId', updateNotificationSettings);

export default router;
