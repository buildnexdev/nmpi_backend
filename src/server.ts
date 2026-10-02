import app from './app';
import dotenv from 'dotenv';
import { getDbConnection } from './config/database';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await getDbConnection();
  
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Organization Platform Backend Running on Port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`==================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to launch backend server:', err);
});
