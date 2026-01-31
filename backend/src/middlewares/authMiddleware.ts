import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

/**
 * Extend Express Request type untuk include user
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * Middleware untuk proteksi route dengan JWT authentication
 */
export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Akses ditolak, token tidak ditemukan', 401);
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Akses ditolak, token tidak valid', 401);
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET tidak ditemukan di environment variables');
      return sendError(res, 'Konfigurasi server error', 500);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        username: string;
        impersonatedBy?: string;
        isImpersonating?: boolean;
      };

      // Simpan data user ke request object
      (req as AuthRequest).user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };

      // Simpan informasi impersonate jika ada
      if (decoded.isImpersonating && decoded.impersonatedBy) {
        (req as any).impersonatedBy = decoded.impersonatedBy;
        (req as any).isImpersonating = true;
      }

      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return sendError(res, 'Token telah kedaluwarsa', 401);
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return sendError(res, 'Token tidak valid', 401);
      }
      return sendError(res, 'Gagal memverifikasi token', 401);
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return sendError(res, 'Error pada autentikasi', 500);
  }
};

/**
 * Optional middleware - tidak akan error jika token tidak ada
 * Berguna untuk route yang bisa diakses dengan atau tanpa auth
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET;

      if (token && JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            email: string;
            username: string;
          };

          (req as AuthRequest).user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
          };
        } catch (error) {
          // Ignore error untuk optional auth
        }
      }
    }

    next();
  } catch (error) {
    // Ignore error dan lanjutkan
    next();
  }
};

