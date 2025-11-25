import { Pool } from "pg";

/**
 * PostgreSQL connection pool for Supabase
 * Uses DATABASE_URL from environment variables
 */
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Helper function to execute queries with error handling
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
