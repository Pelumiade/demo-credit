import express from 'express';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { sendNotFound } from './utils/response';

const app = express();

app.use(helmet());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(routes);

app.use((_req, res) => sendNotFound(res, 'Route not found'));

app.use(errorHandler);

export default app;
