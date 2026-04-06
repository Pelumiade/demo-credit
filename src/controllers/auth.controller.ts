import { Request, Response, NextFunction } from 'express';
import { registerUser } from '../services/auth.service';
import { sendCreated } from '../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone } = req.body;
    const result = await registerUser({ name, email, phone });
    sendCreated(res, 'Account created', result);
  } catch (err) {
    next(err);
  }
};
