import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { AuthenticatedRequest } from '../types';
import { sendUnauthorized } from '../utils/response';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer faux-token-')) {
    sendUnauthorized(res);
    return;
  }

  const userId = authHeader.replace('Bearer faux-token-', '');
  const user = await UserModel.findById(userId);

  if (!user) {
    sendUnauthorized(res);
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
};