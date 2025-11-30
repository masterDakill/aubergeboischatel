/**
 * Neon Database Client - Compatible Cloudflare Workers
 * Uses Neon Serverless HTTP driver
 */

import { neon } from '@neondatabase/serverless';

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

let sql: ReturnType<typeof neon> | null = null;

/**
 * Initialize Neon database connection
 * @param databaseUrl Neon PostgreSQL connection string
 */
export function initDb(databaseUrl: string) {
  sql = neon(databaseUrl);
  console.log('✅ Neon DB client initialized');
}

/**
 * Get SQL client (auto-init from env if needed)
 */
function getClient(): ReturnType<typeof neon> {
  if (!sql) {
    // Try to get from globalThis (Cloudflare Workers env)
    const env = (globalThis as any).env || {};
    const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('Database not initialized. Call initDb() or set DATABASE_URL');
    }

    sql = neon(databaseUrl);
    console.log('✅ Neon DB client auto-initialized');
  }
  return sql;
}

/**
 * Execute a SQL query using tagged template literal
 * @param text SQL query string with $1, $2, etc. placeholders
 * @param params Query parameters
 * @returns Query result with rows and rowCount
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const client = getClient();
  const start = Date.now();

  try {
    let result;

    if (params && params.length > 0) {
      // Use tagged template literal format for parameterized queries
      // Build the template parts and values
      const parts = text.split(/\$\d+/);
      const templateStrings = parts as unknown as TemplateStringsArray;

      // Create a raw array for the template
      Object.defineProperty(templateStrings, 'raw', { value: parts });

      // Call the sql function with template literal style
      result = await client(templateStrings, ...params);
    } else {
      // For queries without parameters, use template literal directly
      const templateStrings = [text] as unknown as TemplateStringsArray;
      Object.defineProperty(templateStrings, 'raw', { value: [text] });
      result = await client(templateStrings);
    }

    const duration = Date.now() - start;
    const rows = Array.isArray(result) ? result : [result];

    console.log('Executed query', {
      text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
      duration: `${duration}ms`,
      rows: rows.length
    });

    return {
      rows: rows as T[],
      rowCount: rows.length
    };
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text.substring(0, 200));
    throw error;
  }
}

/**
 * Execute a raw SQL string (for simple queries without parameters)
 */
export async function rawQuery<T = any>(sqlString: string): Promise<QueryResult<T>> {
  const client = getClient();
  const start = Date.now();

  try {
    // Use tagged template literal
    const result = await client`${sqlString}`;

    const duration = Date.now() - start;
    const rows = Array.isArray(result) ? result : [result];

    return {
      rows: rows as T[],
      rowCount: rows.length
    };
  } catch (error: any) {
    console.error('❌ Raw query error:', error.message);
    throw error;
  }
}

/**
 * Simple SELECT helper
 */
export async function selectFrom<T = any>(
  table: string,
  columns: string = '*',
  where?: string,
  params?: any[]
): Promise<T[]> {
  let queryText = `SELECT ${columns} FROM ${table}`;
  if (where) {
    queryText += ` WHERE ${where}`;
  }

  const result = await query<T>(queryText, params);
  return result.rows;
}

/**
 * Simple INSERT helper
 */
export async function insertInto<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  const queryText = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await query<T>(queryText, values);
  return result.rows[0];
}

/**
 * Simple UPDATE helper
 */
export async function updateTable(
  table: string,
  data: Record<string, any>,
  where: string,
  whereParams: any[]
): Promise<void> {
  const columns = Object.keys(data);
  const values = Object.values(data);

  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const whereClauseWithOffset = where.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + columns.length}`);

  const queryText = `UPDATE ${table} SET ${setClause} WHERE ${whereClauseWithOffset}`;

  await query(queryText, [...values, ...whereParams]);
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const client = getClient();
  try {
    const result = await client`SELECT NOW() as current_time`;
    console.log('✅ Database connection test successful:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// ------------------------------------------------------------------
// DbClient factory for Hono c.set('db') pattern
// ------------------------------------------------------------------

export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>;
}

/**
 * Create a DbClient instance for use with Hono middleware
 * Usage: c.set('db', createDbClient(c.env.DATABASE_URL))
 */
export function createDbClient(databaseUrl: string): DbClient {
  // Ensure the singleton is initialized
  if (!sql) {
    initDb(databaseUrl);
  }

  return {
    query: async <T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> => {
      const result = await query<T>(text, params);
      return { rows: result.rows };
    },
  };
}
