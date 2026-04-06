import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post(
  '/register',
  validate([
    { field: 'name', type: 'string', required: true },
    { field: 'email', type: 'email', required: true },
    { field: 'phone', type: 'string', required: true },
  ]),
  register
);

export default router;
