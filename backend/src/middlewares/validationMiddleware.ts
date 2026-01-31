import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  validateRequired,
  type ValidationError,
} from '../utils/validation.js';

/**
 * Middleware untuk validasi register request
 */
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { username, email, password, firstname, lastname } = req.body;
  const errors: ValidationError[] = [];

  // Validasi required fields
  const requiredErrors = validateRequired(req.body, [
    'username',
    'email',
    'password',
    'firstname',
    'lastname',
  ]);
  errors.push(...requiredErrors);

  // Validasi format email
  if (email && !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Format email tidak valid',
    });
  }

  // Validasi format username
  if (username && !isValidUsername(username)) {
    errors.push({
      field: 'username',
      message: 'Username harus minimal 3 karakter dan hanya boleh mengandung huruf, angka, underscore, atau dash',
    });
  }

  // Validasi password strength
  if (password && !isValidPassword(password)) {
    errors.push({
      field: 'password',
      message: 'Password harus minimal 8 karakter dan mengandung huruf serta angka',
    });
  }

  // Validasi panjang nama
  if (firstname && firstname.trim().length < 2) {
    errors.push({
      field: 'firstname',
      message: 'Nama depan minimal 2 karakter',
    });
  }

  if (lastname && lastname.trim().length < 2) {
    errors.push({
      field: 'lastname',
      message: 'Nama belakang minimal 2 karakter',
    });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validasi gagal',
      400,
      errors.map((e) => `${e.field}: ${e.message}`).join(', ')
    );
  }

  next();
};

/**
 * Middleware untuk validasi login request
 */
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const { email, password } = req.body;
  const errors: ValidationError[] = [];

  // Validasi required fields
  const requiredErrors = validateRequired(req.body, ['email', 'password']);
  errors.push(...requiredErrors);

  // Validasi format email
  if (email && !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Format email tidak valid',
    });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validasi gagal',
      400,
      errors.map((e) => `${e.field}: ${e.message}`).join(', ')
    );
  }

  next();
};

