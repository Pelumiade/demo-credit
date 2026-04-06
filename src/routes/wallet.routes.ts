import { Router } from 'express';
import { getBalance, fund, transfer, withdraw, getTransactions } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);

router.post(
  '/fund',
  validate([{ field: 'amount', type: 'number', required: true }]),
  fund
);

router.post(
  '/transfer',
  validate([
    { field: 'recipient_email', type: 'email', required: true },
    { field: 'amount', type: 'number', required: true },
  ]),
  transfer
);

router.post(
  '/withdraw',
  validate([{ field: 'amount', type: 'number', required: true }]),
  withdraw
);

export default router;
