import express from 'express';
import { 
    createCompany, 
    getCompany, 
    getCompanyById, 
    updateCompany, 
    deleteCompany 
} from '../controller/companyController.js';

const router = express.Router();

// CREATE - POST /api/companies
router.post('/company', createCompany);

// READ - GET /api/companies (get all)
router.get('/company', getCompany);

// READ - GET /api/companies/:id (get one)
router.get('/company/:id', getCompanyById);

// UPDATE - PUT /api/companies/:id
router.put('/company/:id', updateCompany);

// DELETE - DELETE /api/companies/:id
router.delete('/company/:id', deleteCompany);

export default router;