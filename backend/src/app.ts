import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './api/routes/index.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('App');

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.env === 'development'
      ? ['http://localhost:5173', 'http://localhost:3000']
      : false,
    credentials: true,
  }));

  app.use(express.json());

  // Request logging in development
  if (config.env === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (!req.path.includes('/health')) {
          logger.debug(`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
          });
        }
      });
      next();
    });
  }

  // API routes
  app.use('/api/v1', routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.env === 'development' ? err.message : undefined,
    });
  });

  return app;
}
