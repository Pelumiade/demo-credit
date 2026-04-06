import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

type Rule = { field: string; type: 'string' | 'number' | 'email'; required?: boolean };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

      if (rule.type === 'number') {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          sendError(res, `${rule.field} must be a positive number`, 400);
          return;
        }
      }

      if (rule.type === 'email' && !EMAIL_REGEX.test(value)) {
        sendError(res, `${rule.field} must be a valid email`, 400);
        return;
      }
    }

    next();
  };
