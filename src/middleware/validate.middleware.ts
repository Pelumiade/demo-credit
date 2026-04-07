import { Request, Response, NextFunction } from 'express';
import { isValidEmailFormat, normalizeEmail } from '../utils/email';
import { sendError } from '../utils/response';

type Rule = {
  field: string;
  type: 'string' | 'number' | 'email' | 'password';
  required?: boolean;
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const validate =
  (rules: Rule[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        sendError(res, `${rule.field} is required`, 400);
        return;
      }

      if (value === undefined || value === null) continue;

      if (rule.type === 'string' && typeof value !== 'string') {
        sendError(res, `${rule.field} must be a string`, 400);
        return;
      }

      if (rule.type === 'password') {
        if (typeof value !== 'string') {
          sendError(res, `${rule.field} must be a string`, 400);
          return;
        }
        if (value.length < MIN_PASSWORD_LENGTH) {
          sendError(res, `${rule.field} must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
          return;
        }
        if (value.length > MAX_PASSWORD_LENGTH) {
          sendError(res, `${rule.field} is too long`, 400);
          return;
        }
      }

      if (rule.type === 'number') {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          sendError(res, `${rule.field} must be a positive number`, 400);
          return;
        }
      }

      if (rule.type === 'email') {
        if (typeof value !== 'string') {
          sendError(res, `${rule.field} must be a string`, 400);
          return;
        }
        if (!isValidEmailFormat(value)) {
          sendError(res, `${rule.field} must be a valid email`, 400);
          return;
        }
        req.body[rule.field] = normalizeEmail(value);
      }
    }

    next();
  };
