import express from 'express';
import { initiateCall } from '../controllers/call.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/initiate', isAuthenticated, initiateCall);

export default router;
