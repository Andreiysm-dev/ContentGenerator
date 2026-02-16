import express from 'express';
import { deleteAccount, getOwnedCompanies, transferOwnership } from '../controller/accountController.js';

const router = express.Router();

// Get owned companies (for delete confirmation)
router.get('/account/companies', getOwnedCompanies);

// Delete account
router.delete('/account', deleteAccount);

// Transfer ownership
router.post('/company/:companyId/transfer-ownership', transferOwnership);

export default router;
