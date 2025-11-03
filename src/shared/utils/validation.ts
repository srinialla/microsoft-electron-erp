import { z } from 'zod';

/**
 * Extended validation utilities for ERP
 */

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateNumber = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return false;
  const num = typeof value === 'number' ? value : Number(value);
  return !isNaN(num) && isFinite(num);
};

export const validatePositiveNumber = (value: number): boolean => {
  return validateNumber(value) && value > 0;
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};
