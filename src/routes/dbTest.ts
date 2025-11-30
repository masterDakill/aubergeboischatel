import { Hono } from 'hono'
import { query } from '../lib/db'

const dbTest = new Hono()

/**
 * GET /api/dbTest
 * Simple endpoint to test PostgreSQL connection
 *
 * Returns: { success: boolean, timestamp: string, message: string }
 */
dbTest.get('/', async (c) => {
  try {
    console.log('🔍 Testing database connection...')

    // Execute simple query to get current timestamp
    const result = await query('SELECT NOW() as current_time')

    const timestamp = result.rows[0].current_time

    console.log('✅ Database connection successful:', timestamp)

    return c.json({
      success: true,
      timestamp: timestamp,
      message: 'Database connection successful',
      database: 'Connected'
    })
  } catch (error: any) {
    console.error('❌ Database connection error:', error)

    return c.json({
      success: false,
      error: error.message || 'Database connection failed',
      hint: 'Check DATABASE_URL environment variable'
    }, 500)
  }
})

/**
 * GET /api/dbTest/tables
 * List all tables in the database
 */
dbTest.get('/tables', async (c) => {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    return c.json({
      success: true,
      tables: result.rows.map((r: any) => r.table_name)
    })
  } catch (error: any) {
    console.error('❌ Tables query error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to list tables'
    }, 500)
  }
})

/**
 * GET /api/dbTest/describe/:table
 * Get table columns and constraints
 */
dbTest.get('/describe/:table', async (c) => {
  try {
    const table = c.req.param('table')

    // Get columns
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table])

    // Get constraints
    const constraints = await query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = $1::regclass
    `, [table])

    return c.json({
      success: true,
      table,
      columns: columns.rows,
      constraints: constraints.rows
    })
  } catch (error: any) {
    console.error('❌ Describe table error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to describe table'
    }, 500)
  }
})

/**
 * POST /api/dbTest/init-notifications
 * Create notifications table if it doesn't exist
 */
dbTest.post('/init-notifications', async (c) => {
  try {
    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_user_id UUID NOT NULL,
        resident_id UUID,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'INFO',
        read BOOLEAN DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC) WHERE read = false
    `)

    return c.json({
      success: true,
      message: 'Notifications table created/verified'
    })
  } catch (error: any) {
    console.error('❌ Init notifications error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to create notifications table'
    }, 500)
  }
})

export default dbTest
