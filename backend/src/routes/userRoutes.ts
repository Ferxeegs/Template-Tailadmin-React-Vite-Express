import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRoles,
  deleteUser,
  getDeletedUsers,
  forceDeleteUser,
  verifyUserEmail,
  sendVerificationEmail,
  resetPassword,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { hasPermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination and search)
 * @access  Private (requires authentication + view_user or view_any_user permission)
 * @query   page, limit, search
 */
router.get('/', protect, hasPermission(['view_user', 'view_any_user']), getAllUsers);

/**
 * @route   GET /api/users/deleted
 * @desc    Get all deleted users (with pagination and search)
 * @access  Private (requires authentication + view_user or view_any_user permission)
 * @query   page, limit, search
 */
router.get('/deleted', protect, hasPermission(['view_user', 'view_any_user']), getDeletedUsers);

/**
 * @route   POST /api/users
 * @desc    Create new user (admin)
 * @access  Private (requires authentication + create_user permission)
 */
router.post('/', protect, hasPermission('create_user'), createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires authentication + view_user or view_any_user permission)
 */
router.get('/:id', protect, hasPermission(['view_user', 'view_any_user']), getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (requires authentication + update_user permission)
 */
router.put('/:id', protect, hasPermission('update_user'), updateUser);

/**
 * @route   PUT /api/users/:id/roles
 * @desc    Update user roles
 * @access  Private (requires authentication + update_user permission)
 */
router.put('/:id/roles', protect, hasPermission('update_user'), updateUserRoles);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (requires authentication + delete_user or delete_any_user permission)
 */
router.delete('/:id', protect, hasPermission(['delete_user', 'delete_any_user']), deleteUser);

/**
 * @route   DELETE /api/users/:id/force
 * @desc    Force delete user (hard delete)
 * @access  Private (requires authentication + force_delete_user or force_delete_any_user permission)
 */
router.delete('/:id/force', protect, hasPermission(['force_delete_user', 'force_delete_any_user']), forceDeleteUser);

/**
 * @route   POST /api/users/:id/verify-email
 * @desc    Verify user email
 * @access  Private (requires authentication)
 */
router.post('/:id/verify-email', protect, verifyUserEmail);

/**
 * @route   POST /api/users/:id/send-verification-email
 * @desc    Send verification email to user
 * @access  Private (requires authentication)
 */
router.post('/:id/send-verification-email', protect, sendVerificationEmail);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (admin only)
 * @access  Private (requires authentication + update_user permission)
 */
router.post('/:id/reset-password', protect, hasPermission('update_user'), resetPassword);

export default router;

