import express, { Request, Response } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import openapiDocument from './docs/openapi.json';
import { errorHandler } from './middleware/error.middleware';
import { sendNotFound } from './utils/response';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      },
    },
  })
);
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument as Record<string, unknown>, {
    customSiteTitle: 'Demo Credit API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

app.use(routes);

app.use((_req: Request, res: Response) => sendNotFound(res, 'Route not found'));

app.use(errorHandler);

export default app;
