import { Router } from 'express';
import { register, login, getMe, impersonate, stopImpersonate } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middlewares/validationMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user baru
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data
 * @access  Private (requires authentication)
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/impersonate/:userId
 * @desc    Impersonate a user (admin only)
 * @access  Private (requires authentication)
 */
router.post('/impersonate/:userId', protect, impersonate);

/**
 * @route   POST /api/auth/stop-impersonate
 * @desc    Stop impersonating and return to admin account
 * @access  Private (requires authentication)
 */
router.post('/stop-impersonate', protect, stopImpersonate);

export default router;

