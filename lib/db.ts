/**
 * PostgreSQL Database Configuration
 * L'Auberge Boischatel - Database Connection Pool
 * 
 * This file manages PostgreSQL connections using pg Pool
 * Compatible with: Supabase, Neon, Railway, Heroku Postgres
 */

import { Pool, PoolConfig } from 'pg';

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Database configuration
 */
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if no connection
};

/**
 * Get or create PostgreSQL pool instance
 * @returns Pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Log successful connection
    pool.on('connect', () => {
      console.log('✅ PostgreSQL connected');
    });
    
    // Log errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected PostgreSQL error:', err);
    });
  }
  
  return pool;
}

/**
 * Execute a query with parameters
 * @param text - SQL query
 * @param params - Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns Pool client
 */
export async function getClient() {
  const pool = getPool();
  const client = await pool.connect();
  
  // Add release method to ensure client is always released
  const originalRelease = client.release.bind(client);
  let released = false;
  
  client.release = () => {
    if (!released) {
      released = true;
      originalRelease();
    }
  };
  
  return client;
}

/**
 * Close all connections in the pool
 * Call this during graceful shutdown
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL pool closed');
  }
}

// Export pool for direct access if needed
export { pool };
export default getPool;
