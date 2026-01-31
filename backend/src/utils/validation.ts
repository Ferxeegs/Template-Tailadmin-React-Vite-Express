/**
 * Utility functions untuk validasi input
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validasi email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validasi password strength
 * Minimal 8 karakter, mengandung huruf dan angka
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

/**
 * Validasi username
 * Hanya alphanumeric, underscore, dan dash, minimal 3 karakter
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
  return usernameRegex.test(username);
};

/**
 * Validasi required fields
 */
export const validateRequired = (
  data: Record<string, any>,
  fields: string[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  fields.forEach((field) => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} wajib diisi`,
      });
    }
  });
  
  return errors;
};

