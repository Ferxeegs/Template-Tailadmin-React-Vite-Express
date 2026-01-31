import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controller untuk registrasi user baru
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email, password, firstname, lastname } = req.body;

    // 1. Cek apakah email atau username sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return sendError(res, 'Email sudah digunakan', 409);
      }
      if (existingUser.username === username) {
        return sendError(res, 'Username sudah digunakan', 409);
      }
    }

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Generate fullname jika tidak ada
    const fullname = `${firstname.trim()} ${lastname.trim()}`;

    // 4. Simpan user ke database
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        fullname,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Jangan sertakan password di response
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        fullname: true,
        created_at: true,
      },
    });

    return sendSuccess(res, 'Registrasi berhasil', user, 201);
  } catch (error: any) {
    console.error('Register error:', error);
    
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
      'Gagal melakukan registrasi',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk login user
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        firstname: true,
        lastname: true,
        fullname: true,
        deleted_at: true,
      },
    });

    if (!user) {
      return sendError(res, 'Email atau password salah', 401);
    }

    // 2. Cek apakah user sudah dihapus (soft delete)
    if (user.deleted_at) {
      return sendError(res, 'Akun telah dinonaktifkan', 403);
    }

    // 3. Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Email atau password salah', 401);
    }

    // 4. Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET tidak ditemukan di environment variables');
      return sendError(res, 'Konfigurasi server error', 500);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as SignOptions
    );

    // 5. Response dengan user data (tanpa password) dan token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      fullname: user.fullname,
    };

    return sendSuccess(res, 'Login berhasil', {
      user: userData,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return sendError(
      res,
      'Gagal melakukan login',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk mendapatkan data user yang sedang login
 */
export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    // req.user diisi oleh authMiddleware
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            id: true,
            role: {
              select: {
                id: true,
                name: true,
                guard_name: true,
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
            },
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    // Collect all unique permissions from user's roles
    const userPermissions: { [key: string]: { id: string; name: string; guard_name: string } } = {};
    user.roles.forEach((userRole: any) => {
      userRole.role.permissions.forEach((rolePermission: any) => {
        const perm = rolePermission.permission;
        if (!userPermissions[perm.name]) {
          userPermissions[perm.name] = {
            id: perm.id.toString(),
            name: perm.name,
            guard_name: perm.guard_name,
          };
        }
      });
    });

    // Format roles
    const formattedUser = {
      ...user,
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
      permissions: Object.values(userPermissions),
    };

    // Check if user is being impersonated
    const isImpersonating = (req as any).isImpersonating;
    const impersonatedByUserId = (req as any).impersonatedBy;

    let impersonatedBy = null;
    if (isImpersonating && impersonatedByUserId) {
      // Fetch admin info who is impersonating
      const admin = await prisma.user.findUnique({
        where: { id: impersonatedByUserId },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });

      if (admin) {
        impersonatedBy = {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        };
      }
    }

    return sendSuccess(res, 'Data user berhasil diambil', {
      ...formattedUser,
      ...(impersonatedBy && { impersonatedBy }),
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    return sendError(
      res,
      'Gagal mengambil data user',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk impersonate user (admin only)
 */
export const impersonate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId?.[0];
    const adminId = (req as any).user?.id; // Admin yang melakukan impersonate

    if (!adminId) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!userId) {
      return sendError(res, 'User ID tidak valid', 400);
    }

    // Cek apakah user yang akan di-impersonate ada
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
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
            id: true,
            role: {
              select: {
                id: true,
                name: true,
                guard_name: true,
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
            },
          },
        },
      },
    });

    if (!targetUser) {
      return sendError(res, 'User tidak ditemukan', 404);
    }

    if (targetUser.deleted_at) {
      return sendError(res, 'Tidak dapat impersonate user yang sudah dihapus', 400);
    }

    // Cek apakah admin yang melakukan impersonate ada dan memiliki role superadmin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
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

    if (!admin) {
      return sendError(res, 'Admin tidak ditemukan', 404);
    }

    // Cek apakah admin memiliki role superadmin
    const hasSuperAdminRole = admin.roles.some((ur: any) => ur.role.name === 'superadmin');
    
    if (!hasSuperAdminRole) {
      return sendError(res, 'Hanya user dengan role superadmin yang dapat melakukan impersonate', 403);
    }

    // Generate token untuk impersonate
    // Token berisi informasi user yang di-impersonate dan admin yang melakukan impersonate
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return sendError(res, 'Konfigurasi server error', 500);
    }

    const tokenPayload = {
      id: targetUser.id,
      email: targetUser.email,
      username: targetUser.username,
      impersonatedBy: adminId, // ID admin yang melakukan impersonate
      isImpersonating: true,
    };

    const tokenOptions: SignOptions = {
      expiresIn: '24h', // Token impersonate berlaku 24 jam
    };

    const impersonateToken = jwt.sign(tokenPayload, JWT_SECRET, tokenOptions);

    // Collect all unique permissions from target user's roles
    const targetUserPermissions: { [key: string]: { id: string; name: string; guard_name: string } } = {};
    targetUser.roles.forEach((userRole: any) => {
      userRole.role.permissions.forEach((rolePermission: any) => {
        const perm = rolePermission.permission;
        if (!targetUserPermissions[perm.name]) {
          targetUserPermissions[perm.name] = {
            id: perm.id.toString(),
            name: perm.name,
            guard_name: perm.guard_name,
          };
        }
      });
    });

    // Format roles and permissions for the target user
    const formattedTargetUser = {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      firstname: targetUser.firstname,
      lastname: targetUser.lastname,
      fullname: targetUser.fullname,
      phone_number: targetUser.phone_number,
      created_at: targetUser.created_at,
      updated_at: targetUser.updated_at,
      roles: targetUser.roles.map((ur: any) => ({
        id: ur.role.id.toString(),
        name: ur.role.name,
        guard_name: ur.role.guard_name,
      })),
      permissions: Object.values(targetUserPermissions),
      user_profile: targetUser.user_profile,
    };

    // Return data user yang di-impersonate dan token
    return sendSuccess(res, 'Impersonate berhasil', {
      user: formattedTargetUser,
      token: impersonateToken,
      impersonatedBy: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error: any) {
    console.error('Impersonate error:', error);
    return sendError(
      res,
      'Gagal melakukan impersonate',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

/**
 * Controller untuk stop impersonate (kembali ke admin)
 */
export const stopImpersonate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!token || !JWT_SECRET) {
      return sendError(res, 'Token tidak ditemukan', 401);
    }

    // Decode token untuk mendapatkan admin ID
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      impersonatedBy?: string;
      isImpersonating?: boolean;
    };

    if (!decoded.impersonatedBy || !decoded.isImpersonating) {
      return sendError(res, 'Anda tidak sedang dalam mode impersonate', 400);
    }

    // Ambil data admin asli
    const admin = await prisma.user.findUnique({
      where: { id: decoded.impersonatedBy },
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

    if (!admin) {
      return sendError(res, 'Admin tidak ditemukan', 404);
    }

    // Generate token baru untuk admin (tanpa impersonate)
    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
    };

    const tokenOptions: SignOptions = {
      expiresIn: '7d',
    };

    const adminToken = jwt.sign(tokenPayload, JWT_SECRET, tokenOptions);

    return sendSuccess(res, 'Berhasil keluar dari impersonate', {
      user: admin,
      token: adminToken,
    });
  } catch (error: any) {
    console.error('Stop impersonate error:', error);
    return sendError(
      res,
      'Gagal keluar dari impersonate',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
};

