import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool: Pool | null = null;

export function createPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'org_platform_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

export async function getDbConnection(): Promise<Pool> {
  return createPool();
}

export async function verifyDbConnection(): Promise<void> {
  const conn = await createPool().getConnection();
  conn.release();
}
