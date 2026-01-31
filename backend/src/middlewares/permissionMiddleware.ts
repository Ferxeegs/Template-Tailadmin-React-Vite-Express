import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendError } from '../utils/response.js';
import type { AuthRequest } from './authMiddleware.js';

/**
 * Middleware untuk check permission
 * Usage: hasPermission('view_user') atau hasPermission(['view_user', 'view_any_user'])
 */
export const hasPermission = (permissionNames: string | string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const userId = (req as AuthRequest).user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Convert single permission to array
      const permissions = Array.isArray(permissionNames) 
        ? permissionNames 
        : [permissionNames];

      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  permissions: {
                    select: {
                      permission: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return sendError(res, 'User tidak ditemukan', 404);
      }

      // Collect all permissions from user's roles
      const userPermissions: string[] = [];
      user.roles.forEach((userRole) => {
        userRole.role.permissions.forEach((rolePermission) => {
          const permissionName = rolePermission.permission.name;
          if (!userPermissions.includes(permissionName)) {
            userPermissions.push(permissionName);
          }
        });
      });

      // Check if user has at least one of the required permissions
      const hasRequiredPermission = permissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return sendError(
          res,
          `Akses ditolak. Diperlukan permission: ${permissions.join(', ')}`,
          403
        );
      }

      // Attach user permissions to request for use in controllers
      (req as any).userPermissions = userPermissions;

      next();
    } catch (error: any) {
      console.error('Permission middleware error:', error);
      return sendError(res, 'Error pada permission check', 500);
    }
  };
};

/**
 * Middleware untuk check multiple permissions (AND logic - user must have ALL permissions)
 */
export const hasAllPermissions = (permissionNames: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const userId = (req as AuthRequest).user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  permissions: {
                    select: {
                      permission: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return sendError(res, 'User tidak ditemukan', 404);
      }

      // Collect all permissions from user's roles
      const userPermissions: string[] = [];
      user.roles.forEach((userRole) => {
        userRole.role.permissions.forEach((rolePermission) => {
          const permissionName = rolePermission.permission.name;
          if (!userPermissions.includes(permissionName)) {
            userPermissions.push(permissionName);
          }
        });
      });

      // Check if user has ALL required permissions
      const hasAllRequiredPermissions = permissionNames.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllRequiredPermissions) {
        const missingPermissions = permissionNames.filter(
          (permission) => !userPermissions.includes(permission)
        );
        return sendError(
          res,
          `Akses ditolak. Permission yang kurang: ${missingPermissions.join(', ')}`,
          403
        );
      }

      // Attach user permissions to request for use in controllers
      (req as any).userPermissions = userPermissions;

      next();
    } catch (error: any) {
      console.error('Permission middleware error:', error);
      return sendError(res, 'Error pada permission check', 500);
    }
  };
};

