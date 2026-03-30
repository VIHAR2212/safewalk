import express from 'express';
import { register, login, demoLogin, getMe } from '../controllers/authController.js';
import { triggerSOS, resolveEmergency, getActiveEmergency } from '../controllers/sosController.js';
import {
  getVolunteerStats,
  updateAvailability,
  updateLocation,
  getMyVolunteerProfile,
} from '../controllers/volunteerController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/demo', demoLogin);
router.get('/auth/me', authMiddleware, getMe);

// SOS
router.post('/sos', authMiddleware, triggerSOS);
router.post('/sos/resolve', authMiddleware, resolveEmergency);
router.get('/sos/active', authMiddleware, getActiveEmergency);

// Volunteers
router.get('/volunteers', authMiddleware, getVolunteerStats);
router.patch('/volunteers/availability', authMiddleware, requireRole('volunteer'), updateAvailability);
router.patch('/volunteers/location', authMiddleware, requireRole('volunteer'), updateLocation);
router.get('/volunteers/profile', authMiddleware, requireRole('volunteer'), getMyVolunteerProfile);

export default router;
