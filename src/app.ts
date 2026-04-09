import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { sendNotFound } from './utils/response';

const app = express();

app.use(cors());
app.options('*', cors());

app.use(helmet());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => res.json({ message: 'Welcome to Demo Credit API' }));

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use(routes);

app.use((_req: Request, res: Response) => sendNotFound(res, 'Route not found'));

app.use(errorHandler);

export default app;
