import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { createPool, verifyDbConnection } from './config/database';
import { ensureSchema } from './config/schema';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await verifyDbConnection();
  await ensureSchema(createPool());
  console.log('Connected to MySQL and verified schema.');

  app.listen(PORT, () => {
    console.log(`Organization Platform API running on http://localhost:${PORT}/api (${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start backend server. Is MySQL running and are the DATABASE_* values in .env correct?');
  console.error(err);
  process.exit(1);
});
