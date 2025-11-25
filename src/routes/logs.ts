import { Hono } from 'hono'
import { query } from '../lib/db'
import { verifyIdToken } from '../lib/firebaseAdmin'

const logs = new Hono()

/**
 * Middleware: Verify authentication
 */
async function authenticate(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  try {
    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await verifyIdToken(idToken)
    
    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    )

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    c.set('user', userResult.rows[0])
    await next()
  } catch (error: any) {
    console.error('Auth error:', error)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

/**
 * GET /api/logs
 * Liste les logs d'activités (STAFF uniquement)
 */
logs.get('/', authenticate, async (c) => {
  try {
    const user = c.get('user')

    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Staff role required' }, 403)
    }

    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const result = await query(
      `SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        r.full_name as resident_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN residents r ON r.id = al.resident_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /logs error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST /api/logs
 * Créer un log d'activité manuel
 */
logs.post('/', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()

    const {
      action,
      details,
      resident_id
    } = body

    if (!action) {
      return c.json({ error: 'action is required' }, 400)
    }

    const result = await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id,
        resident_id || null,
        action,
        details || null,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
      ]
    )

    console.log('✅ Log created:', result.rows[0].id)
    return c.json(result.rows[0], 201)
  } catch (error: any) {
    console.error('❌ POST /logs error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/logs/resident/:resident_id
 * Logs spécifiques à un résident
 */
logs.get('/resident/:resident_id', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const residentId = c.req.param('resident_id')

    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Staff role required' }, 403)
    }

    const result = await query(
      `SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        u.first_name || ' ' || u.last_name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.resident_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [residentId]
    )

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /logs/resident error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default logs
