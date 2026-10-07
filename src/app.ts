import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import newsRoutes from './routes/newsRoutes';
import eventRoutes from './routes/eventRoutes';
import verifyRoutes from './routes/verifyRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import cmsRoutes from './routes/cmsRoutes';
import accessRoutes from './routes/accessRoutes';
import uploadRoutes from './routes/uploadRoutes';

import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests, please try again later.', data: null },
  })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'NMPI Platform API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api', cmsRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, data: null, error: { code: 'NOT_FOUND' } });
});

app.use(errorHandler);

export default app;
