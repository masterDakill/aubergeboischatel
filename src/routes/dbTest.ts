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
      database: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
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

export default dbTest
