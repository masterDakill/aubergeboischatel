import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const auth = new Hono()

/**
 * POST /api/auth/syncUser
 * Synchronize Firebase user to Supabase PostgreSQL
 * 
 * Body: { idToken: string }
 * Returns: { success: boolean, user: object }
 */
auth.post('/syncUser', async (c) => {
  try {
    const body = await c.req.json()
    const { idToken } = body

    if (!idToken) {
      return c.json({ success: false, error: 'idToken is required' }, 400)
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken)
    const { uid, email, name } = decodedToken

    console.log('🔐 Syncing user:', { uid, email })

    // Check if user exists in PostgreSQL
    const existingUserResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [uid]
    )

    let user

    if (existingUserResult.rows.length === 0) {
      // Create new user with CLIENT role by default
      console.log('✨ Creating new user in PostgreSQL')
      
      const insertResult = await query(
        `INSERT INTO users (firebase_uid, email, first_name, last_name, role, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          uid,
          email || '',
          name || email?.split('@')[0] || 'User',
          '', // last_name empty for now
          'CLIENT', // Default role
          true
        ]
      )

      user = insertResult.rows[0]
      console.log('✅ User created:', user.id)
    } else {
      user = existingUserResult.rows[0]
      
      // Update last_login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      )
      
      console.log('✅ User found, last_login updated')
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
        active: user.active
      }
    })
  } catch (error: any) {
    console.error('❌ SyncUser error:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
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
      `SELECT id, firebase_uid, email, first_name, last_name, phone, role, active, created_at, last_login
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
      active: user.active,
      created_at: user.created_at,
      last_login: user.last_login,
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
