import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): void => {
  const body: ApiResponse<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, message: string, data?: T): void => {
  sendSuccess(res, message, data, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  data?: unknown
): void => {
  const body: ApiResponse = { success: false, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, message, 403);
};

export const sendNotFound = (res: Response, message = 'Resource not found'): void => {
  sendError(res, message, 404);
};

export const sendServerError = (res: Response, message = 'Internal server error'): void => {
  sendError(res, message, 500);
};
