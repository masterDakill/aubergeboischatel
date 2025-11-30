import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const auth = new Hono()

/**
 * GET /api/auth/env
 * Debug endpoint to check environment variables (no DB connection)
 */
auth.get('/env', (c) => {
  const env = (globalThis as any).env || {};
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL || '';

  // Mask the password in the URL for security
  let maskedUrl = '';
  try {
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      url.password = '***';
      maskedUrl = url.toString();
    }
  } catch {
    maskedUrl = databaseUrl ? 'invalid URL format' : 'not set';
  }

  return c.json({
    success: true,
    env_check: {
      has_firebase_api_key: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      has_database_url: !!databaseUrl,
      database_url_masked: maskedUrl,
      globalThis_env_keys: Object.keys(env),
      process_env_DATABASE_URL: !!process.env.DATABASE_URL
    }
  });
})

/**
 * GET /api/auth/test
 * Test endpoint to check if auth routes are working
 */
auth.get('/test', async (c) => {
  try {
    // Test database connection
    const dbTest = await query('SELECT NOW() as server_time')

    return c.json({
      success: true,
      message: 'Auth routes working',
      database: 'connected',
      server_time: dbTest.rows[0]?.server_time,
      env_check: {
        has_firebase_api_key: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        has_database_url: !!process.env.DATABASE_URL
      }
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, 500)
  }
})

/**
 * POST /api/auth/syncUser
 * Synchronize Firebase user to PostgreSQL
 *
 * Body: { idToken: string }
 * Returns: { success: boolean, user: object }
 */
auth.post('/syncUser', async (c) => {
  console.log('📥 syncUser called')

  try {
    // Parse body
    let body
    try {
      body = await c.req.json()
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return c.json({ success: false, error: 'Invalid JSON body' }, 400)
    }

    const { idToken } = body

    if (!idToken) {
      console.error('❌ No idToken provided')
      return c.json({ success: false, error: 'idToken is required' }, 400)
    }

    console.log('🔑 Verifying token...')

    // Verify Firebase token
    let decodedToken
    try {
      decodedToken = await verifyIdToken(idToken)
    } catch (tokenError: any) {
      console.error('❌ Token verification failed:', tokenError.message)
      return c.json({ success: false, error: 'Token verification failed: ' + tokenError.message }, 401)
    }

    const { uid, email, name } = decodedToken
    console.log('🔐 Token verified, syncing user:', { uid, email })

    // Check if user exists in PostgreSQL
    let existingUserResult
    try {
      existingUserResult = await query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      )
    } catch (dbError: any) {
      console.error('❌ Database query failed:', dbError.message)
      return c.json({ success: false, error: 'Database error: ' + dbError.message }, 500)
    }

    let user

    if (existingUserResult.rows.length === 0) {
      // Create new user with CLIENT role by default
      console.log('✨ Creating new user in PostgreSQL')

      try {
        const insertResult = await query(
          `INSERT INTO users (firebase_uid, email, first_name, last_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING *`,
          [
            uid,
            email || '',
            name || email?.split('@')[0] || 'User',
            '',
            'CLIENT'
          ]
        )
        user = insertResult.rows[0]
        console.log('✅ User created:', user.id)
      } catch (insertError: any) {
        console.error('❌ Insert failed:', insertError.message)
        return c.json({ success: false, error: 'Failed to create user: ' + insertError.message }, 500)
      }
    } else {
      user = existingUserResult.rows[0]

      // Update last_login
      try {
        await query(
          'UPDATE users SET updated_at = NOW() WHERE id = $1',
          [user.id]
        )
      } catch (updateError) {
        console.warn('⚠️ Failed to update last_login:', updateError)
        // Non-critical, continue
      }

      console.log('✅ User found:', user.email, 'Role:', user.role)
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        active: user.active !== false
      }
    })
  } catch (error: any) {
    console.error('❌ SyncUser unexpected error:', error)
    return c.json({
      success: false,
      error: error.message || 'Internal server error',
      type: error.constructor.name
    }, 500)
  }
})

/**
 * GET /api/auth/me
 * Get current user with linked residents
 *
 * Headers: Authorization: Bearer <idToken>
 * Returns: { id, email, role, residents: [] }
 */
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401)
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken)
    const { uid } = decodedToken

    // Get user from PostgreSQL
    const userResult = await query(
      `SELECT id, firebase_uid, email, first_name, last_name, phone, role, created_at, updated_at
       FROM users
       WHERE firebase_uid = $1`,
      [uid]
    )

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found in database' }, 404)
    }

    const user = userResult.rows[0]

    // Get linked residents
    const residentsResult = await query(
      `SELECT
        r.id as resident_id,
        r.full_name as resident_name,
        r.room_number,
        r.admission_date,
        r.date_of_birth,
        r.emergency_contact_name,
        r.emergency_contact_phone,
        url.relation
       FROM user_resident_links url
       JOIN residents r ON r.id = url.resident_id
       WHERE url.user_id = $1 AND r.active = true
       ORDER BY r.full_name`,
      [user.id]
    )

    return c.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      residents: residentsResult.rows
    })
  } catch (error: any) {
    console.error('❌ /me error:', error)
    return c.json({
      error: error.message || 'Internal server error'
    }, 500)
  }
})

export default auth
