import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post(
  '/register',
  validate([
    { field: 'name', type: 'string', required: true },
    { field: 'email', type: 'email', required: true },
    { field: 'phone', type: 'string', required: true },
    { field: 'password', type: 'password', required: true },
  ]),
  register
);

router.post(
  '/login',
  validate([
    { field: 'email', type: 'email', required: true },
    { field: 'password', type: 'password', required: true },
  ]),
  login
);

export default router;
