
import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

export function createPool(): Pool {
  if (!pool) {
    const host = (process.env.DATABASE_HOST || '127.0.0.1').trim();
    const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim();

    pool = mysql.createPool({
      host,
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: (process.env.DATABASE_USER || 'root').trim(),
      password: process.env.DATABASE_PASSWORD || '',
      database: (process.env.DATABASE_NAME || 'org_platform_db').trim(),

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',

      ...(ca
        ? {
            ssl: {
              ca,
              rejectUnauthorized: true,
            },
          }
        : {}),
    });
  }

  return pool;
}

export async function getDbConnection(): Promise<Pool> {
  return createPool();
}

export async function verifyDbConnection(): Promise<void> {
  const conn = await createPool().getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
