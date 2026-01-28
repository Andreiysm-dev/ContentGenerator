import express from 'express';
import { 
    createBrandKB, 
    getAllBrandKBs, 
    getBrandKBById, 
    getBrandKBsByCompanyId,
    updateBrandKB, 
    deleteBrandKB,
    deleteBrandKBsByCompanyId
} from '../controller/companyKbController.js';

const router = express.Router();

// CREATE - POST /api/brandkb
router.post('/brandkb', createBrandKB);

// READ - GET /api/brandkb (get all)
router.get('/brandkb', getAllBrandKBs);

// READ - GET /api/brandkb/:id (get one by ID)
router.get('/brandkb/:id', getBrandKBById);

// READ - GET /api/brandkb/company/:companyId (get all by company)
router.get('/brandkb/company/:companyId', getBrandKBsByCompanyId);

// UPDATE - PUT /api/brandkb/:id
router.put('/brandkb/:id', updateBrandKB);

// DELETE - DELETE /api/brandkb/:id (delete one)
router.delete('/brandkb/:id', deleteBrandKB);

// DELETE - DELETE /api/brandkb/company/:companyId (delete all for a company)
router.delete('/brandkb/company/:companyId', deleteBrandKBsByCompanyId);

export default router;