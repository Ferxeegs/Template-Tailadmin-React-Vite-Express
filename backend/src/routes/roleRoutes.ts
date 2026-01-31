import { Router } from 'express';
import { getAllRoles, getRoleById, getAllPermissions, updateRole, updateRolePermissions } from '../controllers/roleController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { hasPermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

/**
 * @route   GET /api/roles
 * @desc    Get all roles (with pagination and search)
 * @access  Private (requires authentication + view_role or view_any_role permission)
 * @query   page, limit, search
 */
router.get('/', protect, hasPermission(['view_role', 'view_any_role']), getAllRoles);

/**
 * @route   GET /api/roles/permissions
 * @desc    Get all permissions
 * @access  Private (requires authentication + view_role or view_any_role permission)
 */
router.get('/permissions', protect, hasPermission(['view_role', 'view_any_role']), getAllPermissions);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private (requires authentication + view_role or view_any_role permission)
 */
router.get('/:id', protect, hasPermission(['view_role', 'view_any_role']), getRoleById);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role details (name, guard_name)
 * @access  Private (requires authentication + update_role permission)
 */
router.put('/:id', protect, hasPermission('update_role'), updateRole);

/**
 * @route   PUT /api/roles/:id/permissions
 * @desc    Update role permissions
 * @access  Private (requires authentication + update_role permission)
 */
router.put('/:id/permissions', protect, hasPermission('update_role'), updateRolePermissions);

export default router;

