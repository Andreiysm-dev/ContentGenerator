import express from 'express';
import { 
    createContentCalendar, 
    getAllContentCalendars, 
    getContentCalendarById, 
    getContentCalendarsByCompanyId,
    getContentCalendarsByDateRange,
    getContentCalendarsByStatus,
    updateContentCalendar, 
    deleteContentCalendar,
    deleteContentCalendarsByCompanyId
} from '../controller/contentCalendarController.js';

const router = express.Router();

// CREATE - POST /api/content-calendar
router.post('/content-calendar', createContentCalendar);

// READ - GET /api/content-calendar (get all)
router.get('/content-calendar', getAllContentCalendars);

// READ - GET /api/content-calendar/date-range (get by date range)
// Query params: startDate, endDate, companyId (optional)
router.get('/content-calendar/date-range', getContentCalendarsByDateRange);

// READ - GET /api/content-calendar/status/:status (get by status)
// Query params: companyId (optional)
router.get('/content-calendar/status/:status', getContentCalendarsByStatus);

// READ - GET /api/content-calendar/:id (get one by ID)
router.get('/content-calendar/:id', getContentCalendarById);

// READ - GET /api/content-calendar/company/:companyId (get all by company)
router.get('/content-calendar/company/:companyId', getContentCalendarsByCompanyId);

// UPDATE - PUT /api/content-calendar/:id
router.put('/content-calendar/:id', updateContentCalendar);

// DELETE - DELETE /api/content-calendar/:id (delete one)
router.delete('/content-calendar/:id', deleteContentCalendar);

// DELETE - DELETE /api/content-calendar/company/:companyId (delete all for a company)
router.delete('/content-calendar/company/:companyId', deleteContentCalendarsByCompanyId);

export default router;