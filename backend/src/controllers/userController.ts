import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controller untuk mendapatkan semua users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause for search
    const where: any = {
      deleted_at: null, // Only get non-deleted users
    };

    if (search) {
      const searchTerm = search as string;
      // MySQL doesn't support case-insensitive mode, so we use contains
      // For case-insensitive search in MySQL, we can use LOWER() in raw query if needed
      where.OR = [
        { username: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { firstname: { contains: searchTerm } },
        { lastname: { contains: searchTerm } },
        { fullname: { contains: searchTerm } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNumber,
        select: {
          id: true,
          username: true,
          email: true,
          firstname: true,
          lastname: true,
          fullname: true,
          phone_number: true,
          created_at: true,
          updated_at: true,
          user_profile: {
            select: {
              id: true,
              nim: true,
              major: true,
              faculty: true,
              room_number: true,
              is_verified: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  guard_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Format users with roles
    const formattedUsers = users.map((user: any) => ({
      ...user,
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
    }));

    return sendSuccess(res, 'Data users berhasil diambil', {
      users: formattedUsers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return sendError(
      res,
      'Gagal mengambil data users',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk mendapatkan user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        fullname: true,
        phone_number: true,
        email_verified_at: true,
        created_at: true,
        updated_at: true,
        user_profile: {
          select: {
            id: true,
            nim: true,
            major: true,
            faculty: true,
            room_number: true,
            is_verified: true,
          },
        },
        roles: {
          select: {
            id: true,
            role: {
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

    if (!user) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Format roles
    const formattedUser = {
      ...user,
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
    };

    return sendSuccess(res, 'Data user berhasil diambil', formattedUser);
  } catch (error: any) {
    console.error('Get user by id error:', error);
    return sendError(
      res,
      'Gagal mengambil data user',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk create user baru (admin)
 */
export const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { 
      username, 
      email, 
      password, 
      firstname, 
      lastname,
      fullname,
      phone_number,
      roleIds,
      // User profile fields (optional, only for mahasiswa)
      nim,
      major,
      faculty,
      room_number,
      is_verified,
    } = req.body;

    // Validasi input
    if (!firstname || firstname.trim().length < 2) {
      return sendError(res, 'Nama depan minimal 2 karakter', 400);
    }

    if (!lastname || lastname.trim().length < 2) {
      return sendError(res, 'Nama belakang minimal 2 karakter', 400);
    }

    if (!username || username.trim().length < 3) {
      return sendError(res, 'Username minimal 3 karakter', 400);
    }

    if (!/^[a-zA-Z0-9_-]{3,}$/.test(username.trim())) {
      return sendError(res, 'Username harus minimal 3 karakter dan hanya boleh mengandung huruf, angka, underscore, atau dash', 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, 'Format email tidak valid', 400);
    }

    if (!password || password.length < 8) {
      return sendError(res, 'Password minimal 8 karakter', 400);
    }

    // Cek apakah email sudah digunakan
    const emailExists = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deleted_at: null,
      },
    });

    if (emailExists) {
      return sendError(res, 'Email sudah digunakan', 400);
    }

    // Cek apakah username sudah digunakan
    const usernameExists = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        deleted_at: null,
      },
    });

    if (usernameExists) {
      return sendError(res, 'Username sudah digunakan', 400);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate fullname jika tidak ada
    const userFullname = fullname?.trim() || `${firstname.trim()} ${lastname.trim()}`;

    // Format phone number
    let formattedPhoneNumber = null;
    if (phone_number && phone_number.trim()) {
      let phoneNum = phone_number.trim();
      // Remove any existing country code prefix
      if (phoneNum.startsWith("+62")) {
        phoneNum = phoneNum.substring(3);
      } else if (phoneNum.startsWith("+1")) {
        phoneNum = phoneNum.substring(2);
      }
      // Default to +62 for Indonesian numbers
      if (phoneNum.startsWith("0")) {
        phoneNum = phoneNum.substring(1);
      }
      formattedPhoneNumber = "+62" + phoneNum;
    }

    // Check if user has mahasiswa role
    let hasMahasiswaRole = false;
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds.map((id: string) => BigInt(id)) },
        },
      });
      hasMahasiswaRole = roles.some((r: { name: string }) => r.name === 'mahasiswa');
    }

    // Cek apakah NIM sudah digunakan (jika ada)
    if (nim && hasMahasiswaRole) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: {
          nim: nim.trim(),
        },
      });

      if (existingProfile) {
        return sendError(res, 'NIM sudah digunakan', 400);
      }
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        fullname: userFullname,
        phone_number: formattedPhoneNumber,
        created_at: new Date(),
        updated_at: new Date(),
        // Create user_profile if has mahasiswa role
        ...(hasMahasiswaRole && {
          user_profile: {
            create: {
              nim: nim?.trim() || '',
              major: major?.trim() || null,
              faculty: faculty?.trim() || null,
              room_number: room_number?.trim() || null,
              is_verified: is_verified === true || is_verified === 'true' || false,
            },
          },
        }),
        // Assign roles if provided
        ...(roleIds && Array.isArray(roleIds) && roleIds.length > 0 && {
          roles: {
            create: roleIds.map((roleId: string) => ({
              role_id: BigInt(roleId),
            })),
          },
        }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        fullname: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
        user_profile: {
          select: {
            id: true,
            nim: true,
            major: true,
            faculty: true,
            room_number: true,
            is_verified: true,
          },
        },
        roles: {
          select: {
            role: {
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

    // Format response - convert BigInt to string
    const formattedUser = {
      ...newUser,
      roles: newUser.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
    };

    return sendSuccess(res, 'User berhasil dibuat', formattedUser, 201);
  } catch (error: any) {
    console.error('Create user error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return sendError(
        res,
        `${field === 'email' ? 'Email' : 'Username'} sudah digunakan`,
        409
      );
    }

    return sendError(
      res,
      'Gagal membuat user',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk update user
 */
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { 
      firstname, 
      lastname, 
      fullname, 
      phone_number, 
      email, 
      username,
      // User profile fields
      nim,
      major,
      faculty,
      room_number,
      is_verified,
    } = req.body;

    // Validasi input
    if (!firstname || firstname.trim().length < 2) {
      return sendError(res, 'Nama depan minimal 2 karakter', 400);
    }

    if (!lastname || lastname.trim().length < 2) {
      return sendError(res, 'Nama belakang minimal 2 karakter', 400);
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, 'Format email tidak valid', 400);
    }

    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!existingUser) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Cek apakah email sudah digunakan oleh user lain
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          id: { not: id as string },
          deleted_at: null,
        },
      });

      if (emailExists) {
        return sendError(res, 'Email sudah digunakan', 400);
      }
    }

    // Cek apakah username sudah digunakan oleh user lain
    if (username && username !== existingUser.username) {
      // Validasi format username
      if (!/^[a-zA-Z0-9_-]{3,}$/.test(username.trim())) {
        return sendError(res, 'Username harus minimal 3 karakter dan hanya boleh mengandung huruf, angka, underscore, atau dash', 400);
      }

      const usernameExists = await prisma.user.findFirst({
        where: {
          username: username.trim(),
          id: { not: id as string },
          deleted_at: null,
        },
      });

      if (usernameExists) {
        return sendError(res, 'Username sudah digunakan', 400);
      }
    }

    // Check if user has mahasiswa role
    const userWithRoles = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const hasMahasiswaRole = userWithRoles?.roles.some((ur: { role: { name: string } }) => ur.role.name === 'mahasiswa') || false;

    // Only allow user_profile update if user has mahasiswa role
    if ((nim || major !== undefined || faculty !== undefined || room_number !== undefined || is_verified !== undefined) && !hasMahasiswaRole) {
      return sendError(res, 'User profile hanya dapat diisi untuk user dengan role mahasiswa', 400);
    }

    // Cek apakah NIM sudah digunakan oleh user lain (jika NIM diubah)
    if (nim && hasMahasiswaRole) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: {
          nim: nim.trim(),
          user_id: { not: id as string },
        },
      });

      if (existingProfile) {
        return sendError(res, 'NIM sudah digunakan', 400);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        fullname: fullname?.trim() || null,
        phone_number: phone_number?.trim() || null,
        email: email?.trim() || existingUser.email,
        username: username?.trim() || existingUser.username,
        updated_at: new Date(),
        // Update or create user_profile - only if user has mahasiswa role
        ...(hasMahasiswaRole && {
          user_profile: {
            upsert: {
              create: {
                nim: nim?.trim() || '',
                major: major?.trim() || null,
                faculty: faculty?.trim() || null,
                room_number: room_number?.trim() || null,
                is_verified: is_verified === true || is_verified === 'true' || false,
              },
              update: {
                ...(nim && { nim: nim.trim() }),
                ...(major !== undefined && { major: major?.trim() || null }),
                ...(faculty !== undefined && { faculty: faculty?.trim() || null }),
                ...(room_number !== undefined && { room_number: room_number?.trim() || null }),
                ...(is_verified !== undefined && { is_verified: is_verified === true || is_verified === 'true' }),
              },
            },
          },
        }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        fullname: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
        user_profile: {
          select: {
            id: true,
            nim: true,
            major: true,
            faculty: true,
            room_number: true,
            is_verified: true,
          },
        },
      },
    });

    return sendSuccess(res, 'User berhasil diupdate', updatedUser);
  } catch (error: any) {
    console.error('Update user error:', error);
    return sendError(
      res,
      'Gagal mengupdate user',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk update user roles
 */
export const updateUserRoles = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role_ids } = req.body;

    if (!Array.isArray(role_ids)) {
      return sendError(res, 'role_ids harus berupa array', 400);
    }

    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!existingUser) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Validasi role_ids (harus berupa array of strings yang bisa dikonversi ke BigInt)
    const validRoleIds: bigint[] = role_ids
      .map((rid: any) => {
        try {
          return BigInt(rid);
        } catch {
          return null;
        }
      })
      .filter((rid: bigint | null): rid is bigint => rid !== null);

    // Cek apakah semua role ada
    const roles = await prisma.role.findMany({
      where: {
        id: { in: validRoleIds },
      },
    });

    if (roles.length !== validRoleIds.length) {
      return sendError(res, 'Beberapa role tidak ditemukan', 400);
    }

    // Hapus semua role user yang ada dan tambahkan role baru menggunakan transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing roles through user relation
      const user = await (tx as any).user.findUnique({
        where: { id: id as string },
      });
      
      if (user) {
        await (tx as any).user.update({
          where: { id: id as string },
          data: {
            roles: {
              deleteMany: {},
            },
          },
        });

        // Add new roles
        if (validRoleIds.length > 0) {
          await (tx as any).user.update({
            where: { id: id as string },
            data: {
              roles: {
                create: validRoleIds.map((roleId: bigint) => ({
                  role_id: roleId,
                })),
              },
            },
          });
        }
      }
    });

    // Get updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        roles: {
          select: {
            id: true,
            role: {
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

    const formattedRoles = updatedUser?.roles.map((ur: any) => ({
      id: ur.role.id.toString(),
      name: ur.role.name,
      guard_name: ur.role.guard_name,
    })) || [];

    return sendSuccess(res, 'User roles berhasil diupdate', { roles: formattedRoles });
  } catch (error: any) {
    console.error('Update user roles error:', error);
    return sendError(
      res,
      'Gagal mengupdate user roles',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk verify email user
 */
export const verifyUserEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!user) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Update email_verified_at
    await prisma.user.update({
      where: { id: id as string },
      data: {
        email_verified_at: new Date(),
      },
    });

    return sendSuccess(res, 'Email berhasil diverifikasi', {
      email_verified_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Verify user email error:', error);
    return sendError(
      res,
      'Gagal memverifikasi email',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk send verification email
 */
/**
 * Controller untuk mendapatkan semua deleted users
 */
export const getDeletedUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause for search - only get deleted users
    const where: any = {
      deleted_at: { not: null }, // Only get deleted users
    };

    if (search) {
      const searchTerm = search as string;
      where.OR = [
        { username: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { firstname: { contains: searchTerm } },
        { lastname: { contains: searchTerm } },
        { fullname: { contains: searchTerm } },
      ];
    }

    // Get deleted users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNumber,
        select: {
          id: true,
          username: true,
          email: true,
          firstname: true,
          lastname: true,
          fullname: true,
          phone_number: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          user_profile: {
            select: {
              id: true,
              nim: true,
              major: true,
              faculty: true,
              room_number: true,
              is_verified: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  guard_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          deleted_at: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Format users with roles
    const formattedUsers = users.map((user: any) => ({
      ...user,
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
    }));

    return sendSuccess(res, 'Data deleted users berhasil diambil', {
      users: formattedUsers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    console.error('Get deleted users error:', error);
    return sendError(
      res,
      'Gagal mengambil data deleted users',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk delete user (soft delete)
 */
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!existingUser) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Cek apakah user sudah dihapus
    if (existingUser.deleted_at) {
      return sendError(res, 'User sudah dihapus', 400);
    }

    // Get current user from token (for deleted_by)
    const currentUserId = (req as any).user?.id;

    // Soft delete user
    await prisma.user.update({
      where: { id: id as string },
      data: {
        deleted_at: new Date(),
        deleted_by: currentUserId || null,
        updated_at: new Date(),
      },
    });

    return sendSuccess(res, 'User berhasil dihapus', null);
  } catch (error: any) {
    console.error('Delete user error:', error);
    return sendError(
      res,
      'Gagal menghapus user',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk force delete user (hard delete)
 */
export const forceDeleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!existingUser) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Hard delete user (akan cascade delete user_profile dan user_roles karena onDelete: Cascade)
    await prisma.user.delete({
      where: { id: id as string },
    });

    return sendSuccess(res, 'User berhasil dihapus permanen', null);
  } catch (error: any) {
    console.error('Force delete user error:', error);
    return sendError(
      res,
      'Gagal menghapus user permanen',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk send verification email
 */
export const sendVerificationEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!user) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // TODO: Implement actual email sending logic here
    // For now, just return success
    return sendSuccess(res, 'Email verifikasi berhasil dikirim', {
      message: 'Email verifikasi telah dikirim ke ' + user.email,
    });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return sendError(
      res,
      'Gagal mengirim email verifikasi',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk reset password user (admin only)
 */
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { password, confirm_password } = req.body;

    if (!id) {
      return sendError(res, 'User ID tidak valid', 400);
    }

    // Validasi password
    if (!password || password.length < 8) {
      return sendError(res, 'Password minimal 8 karakter', 400);
    }

    if (password !== confirm_password) {
      return sendError(res, 'Password dan konfirmasi password tidak cocok', 400);
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: id as string },
    });

    if (!user) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    if (user.deleted_at) {
      return sendError(res, 'Tidak dapat reset password user yang sudah dihapus', 400);
    }

    // Hash password baru
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: id as string },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return sendSuccess(res, 'Password berhasil direset', {
      message: 'Password user berhasil direset',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return sendError(
      res,
      'Gagal reset password',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

