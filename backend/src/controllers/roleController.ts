import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controller untuk mendapatkan semua roles
 */
export const getAllRoles = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause for search
    const where: any = {};

    if (search) {
      const searchTerm = search as string;
      where.OR = [
        { name: { contains: searchTerm } },
        { guard_name: { contains: searchTerm } },
      ];
    }

    // Get roles with pagination
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limitNumber,
        select: {
          id: true,
          name: true,
          guard_name: true,
          created_at: true,
          updated_at: true,
          permissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  guard_name: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  fullname: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.role.count({ where }),
    ]);

    // Format response
    const formattedRoles = roles.map((role: any) => ({
      id: role.id.toString(),
      name: role.name,
      guard_name: role.guard_name,
      permissions_count: role.permissions.length,
      users_count: role.users.length,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id.toString(),
        name: rp.permission.name,
        guard_name: rp.permission.guard_name,
      })),
      created_at: role.created_at,
      updated_at: role.updated_at,
    }));

    return sendSuccess(res, 'Data roles berhasil diambil', {
      roles: formattedRoles,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    console.error('Get all roles error:', error);
    return sendError(
      res,
      'Gagal mengambil data roles',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk mendapatkan role by ID
 */
export const getRoleById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'ID role tidak valid', 400);
    }

    const role = await prisma.role.findUnique({
      where: { id: BigInt(id as string) },
      select: {
        id: true,
        name: true,
        guard_name: true,
        created_at: true,
        updated_at: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                guard_name: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                fullname: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return sendError(res, 'Role tidak ditemukan', 404);
    }

    // Format response
    const formattedRole = {
      id: role.id.toString(),
      name: role.name,
      guard_name: role.guard_name,
      permissions_count: role.permissions.length,
      users_count: role.users.length,
      permissions: role.permissions.map((rp: any) => ({
        id: rp.permission.id.toString(),
        name: rp.permission.name,
        guard_name: rp.permission.guard_name,
      })),
      users: role.users.map((ur: any) => ({
        id: ur.user.id,
        username: ur.user.username,
        email: ur.user.email,
        fullname: ur.user.fullname,
      })),
      created_at: role.created_at,
      updated_at: role.updated_at,
    };

    return sendSuccess(res, 'Data role berhasil diambil', formattedRole);
  } catch (error: any) {
    console.error('Get role by id error:', error);
    return sendError(
      res,
      'Gagal mengambil data role',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk mendapatkan semua permissions
 */
export const getAllPermissions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        guard_name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format response - convert BigInt to string
    const formattedPermissions = permissions.map((permission: any) => ({
      id: permission.id.toString(),
      name: permission.name,
      guard_name: permission.guard_name,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    }));

    return sendSuccess(res, 'Data permissions berhasil diambil', {
      permissions: formattedPermissions,
    });
  } catch (error: any) {
    console.error('Get all permissions error:', error);
    return sendError(
      res,
      'Gagal mengambil data permissions',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk update role details (name, guard_name)
 */
export const updateRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, guard_name } = req.body;

    if (!id) {
      return sendError(res, 'ID role tidak valid', 400);
    }

    if (!name || !guard_name) {
      return sendError(res, 'Name dan guard_name harus diisi', 400);
    }

    // Cek apakah role ada
    const existingRole = await prisma.role.findUnique({
      where: { id: BigInt(id as string) },
    });

    if (!existingRole) {
      return sendError(res, 'Role tidak ditemukan', 404);
    }

    // Cek apakah name sudah digunakan oleh role lain
    const nameExists = await prisma.role.findFirst({
      where: {
        name: name.trim(),
        id: { not: BigInt(id as string) },
      },
    });

    if (nameExists) {
      return sendError(res, 'Nama role sudah digunakan', 400);
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: BigInt(id as string) },
      data: {
        name: name.trim(),
        guard_name: guard_name.trim(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        guard_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Format response
    const formattedRole = {
      id: updatedRole.id.toString(),
      name: updatedRole.name,
      guard_name: updatedRole.guard_name,
      created_at: updatedRole.created_at,
      updated_at: updatedRole.updated_at,
    };

    return sendSuccess(res, 'Role berhasil diupdate', formattedRole);
  } catch (error: any) {
    console.error('Update role error:', error);
    return sendError(
      res,
      'Gagal mengupdate role',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk update role permissions
 */
export const updateRolePermissions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    if (!id) {
      return sendError(res, 'ID role tidak valid', 400);
    }

    if (!Array.isArray(permission_ids)) {
      return sendError(res, 'permission_ids harus berupa array', 400);
    }

    // Cek apakah role ada
    const existingRole = await prisma.role.findUnique({
      where: { id: BigInt(id as string) },
    });

    if (!existingRole) {
      return sendError(res, 'Role tidak ditemukan', 404);
    }

    // Validasi permission_ids (harus berupa array of strings yang bisa dikonversi ke BigInt)
    const validPermissionIds: bigint[] = [];
    for (const pid of permission_ids) {
      try {
        validPermissionIds.push(BigInt(pid));
      } catch {
        // Skip invalid permission IDs
      }
    }

    // Cek apakah semua permission ada
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: validPermissionIds },
      },
    });

    if (permissions.length !== validPermissionIds.length) {
      return sendError(res, 'Beberapa permission tidak ditemukan', 400);
    }

    // Hapus semua permission role yang ada
    await prisma.roleHasPermission.deleteMany({
      where: { role_id: BigInt(id as string) },
    });

    // Tambahkan permission baru
    if (validPermissionIds.length > 0) {
      await prisma.roleHasPermission.createMany({
        data: validPermissionIds.map((permissionId: bigint) => ({
          role_id: BigInt(id as string),
          permission_id: permissionId,
        })),
      });
    }

    // Update updated_at role
    await prisma.role.update({
      where: { id: BigInt(id as string) },
      data: {
        updated_at: new Date(),
      },
    });

    // Get updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: BigInt(id as string) },
      select: {
        id: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                guard_name: true,
              },
            },
          },
        },
      },
    });

    const formattedPermissions = updatedRole?.permissions.map((rp: any) => ({
      id: rp.permission.id.toString(),
      name: rp.permission.name,
      guard_name: rp.permission.guard_name,
    })) || [];

    return sendSuccess(res, 'Permissions role berhasil diupdate', {
      permissions: formattedPermissions,
    });
  } catch (error: any) {
    console.error('Update role permissions error:', error);
    return sendError(
      res,
      'Gagal mengupdate permissions role',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

