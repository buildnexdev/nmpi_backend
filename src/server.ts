import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import app from './app';
import { createPool, verifyDbConnection } from './config/database';
import { ensureSchema } from './config/schema';

const PORT = Number(process.env.PORT) || 5000;

let dbReady = false;
let initPromise: Promise<void> | null = null;

function ensureDbReady(): Promise<void> {
  if (dbReady) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      await verifyDbConnection();
      await ensureSchema(createPool());
      dbReady = true;
      console.log('Connected to MySQL and verified schema.');
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

const serverApp = express();

// Bind HTTP port immediately so cloud hosts (e.g. Render) never stall on startup,
// while gating /api routes until MySQL + schema initialization completes.
serverApp.use('/api', async (_req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err: any) {
    console.error('Database initialization failed:', err?.message || err);
    res.status(503).json({
      success: false,
      message: 'Backend database is unavailable. Please try again shortly.',
      data: null,
      error: {
        code: 'DB_UNAVAILABLE',
        detail: err?.message || 'Database connection failed',
      },
    });
  }
});

serverApp.use(app);

serverApp.listen(PORT, '0.0.0.0', () => {
  console.log(`Organization Platform API listening on 0.0.0.0:${PORT}/api (${process.env.NODE_ENV || 'development'})`);
  ensureDbReady().catch((err) => {
    console.error('Initial MySQL connection/schema check failed. Will retry on incoming /api requests.');
    console.error(err);
  });
});
