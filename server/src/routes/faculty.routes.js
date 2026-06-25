import express from 'express';
import { isAuthenticated, requireOrganization } from '../middleware/auth.middleware.js';
import { attachInstitutionProfile } from '../middleware/institution-profile.middleware.js';
import { getFacultyDashboardData } from '../controllers/faculty-dashboard.controller.js';

const router = express.Router();

// ======================================================
// GET /api/faculty/dashboard/summary
// Real MongoDB data via Controller layer
// ======================================================
router.get('/dashboard/summary', isAuthenticated, requireOrganization, attachInstitutionProfile(), getFacultyDashboardData);

export default router;
