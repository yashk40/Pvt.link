import { AppError } from './AppError.js';

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => !body?.[field] || String(body[field]).trim() === '');
  if (missing.length) throw new AppError(`Missing required field(s): ${missing.join(', ')}`, 400, 'VALIDATION_ERROR');
};

export const string = (value, name, { min = 1, max = 255 } = {}) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${name} must be between ${min} and ${max} characters`, 400, 'VALIDATION_ERROR');
  }
  return value.trim();
};

export const email = (value) => {
  const normalized = string(value, 'email', { min: 5, max: 254 }).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new AppError('email is invalid', 400, 'VALIDATION_ERROR');
  return normalized;
};

export const id = (value, name = 'id') => {
  const result = string(value, name, { min: 3, max: 128 });
  if (!/^[A-Za-z0-9_-]+$/.test(result)) throw new AppError(`${name} has invalid characters`, 400, 'VALIDATION_ERROR');
  return result;
};

export const pairCode = (value) => string(value, 'pairCode', { min: 6, max: 32 }).toUpperCase().replace(/[^A-Z0-9]/g, '');
