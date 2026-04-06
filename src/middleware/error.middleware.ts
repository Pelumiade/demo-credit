import { ErrorRequestHandler } from 'express';
import { sendError } from '../utils/response';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const e = err as Error & { statusCode?: number; status?: number };
  const statusCode = e.statusCode ?? e.status ?? 500;
  const message = statusCode < 500 ? e.message || 'Error' : 'Internal server error';

  if (statusCode >= 500) {
    console.error(err);
  }

  sendError(res, message, statusCode);
};
