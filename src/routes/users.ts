import { Hono } from 'hono'
import { query } from '../lib/db'
import { verifyIdToken } from '../lib/firebaseAdmin'

const users = new Hono()

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
 * Middleware: Require ADMIN role
 */
function requireAdmin(c: any, next: any) {
  const user = c.get('user')
  
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: Admin role required' }, 403)
  }

  return next()
}

/**
 * GET /api/users
 * Liste tous les utilisateurs (ADMIN uniquement)
 */
users.get('/', authenticate, requireAdmin, async (c) => {
  try {
    const roleFilter = c.req.query('role')
    const activeFilter = c.req.query('active')

    let queryText = `
      SELECT 
        id,
        firebase_uid,
        email,
        first_name,
        last_name,
        phone,
        role,
        active,
        created_at,
        last_login,
        (
          SELECT COUNT(*)
          FROM user_resident_links url
          WHERE url.user_id = users.id
        ) as linked_residents_count
      FROM users
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (roleFilter) {
      queryText += ` AND role = $${paramIndex}`
      params.push(roleFilter)
      paramIndex++
    }

    if (activeFilter !== undefined) {
      queryText += ` AND active = $${paramIndex}`
      params.push(activeFilter === 'true')
      paramIndex++
    }

    queryText += ` ORDER BY created_at DESC`

    const result = await query(queryText, params)

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /users error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/users/:id
 * Obtenir un utilisateur spécifique avec détails
 */
users.get('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')

    const result = await query(
      `SELECT 
        u.*,
        json_agg(
          json_build_object(
            'resident_id', r.id,
            'resident_name', r.full_name,
            'room_number', r.room_number,
            'relation', url.relation,
            'is_primary', url.is_primary_contact
          )
        ) FILTER (WHERE r.id IS NOT NULL) as linked_residents
       FROM users u
       LEFT JOIN user_resident_links url ON url.user_id = u.id
       LEFT JOIN residents r ON r.id = url.resident_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ GET /users/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur (ADMIN uniquement)
 */
users.put('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const adminUser = c.get('user')

    const {
      first_name,
      last_name,
      phone,
      role,
      active
    } = body

    // Validation du rôle
    if (role && !['CLIENT', 'EMPLOYEE', 'ADMIN'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be CLIENT, EMPLOYEE, or ADMIN' }, 400)
    }

    const result = await query(
      `UPDATE users
       SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         active = COALESCE($5, active)
       WHERE id = $6
       RETURNING 
         id, firebase_uid, email, first_name, last_name, phone, role, active, created_at, last_login`,
      [first_name, last_name, phone, role, active, id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        adminUser.id,
        'updated_user',
        `Utilisateur modifié: ${result.rows[0].email} (ID: ${id})`
      ]
    )

    console.log('✅ User updated:', id)
    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ PUT /users/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST /api/users/:user_id/link-resident
 * Lier un utilisateur à un résident (ADMIN uniquement)
 */
users.post('/:user_id/link-resident', authenticate, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('user_id')
    const body = await c.req.json()
    const adminUser = c.get('user')

    const {
      resident_id,
      relation,
      is_primary_contact
    } = body

    if (!resident_id || !relation) {
      return c.json({ error: 'resident_id and relation are required' }, 400)
    }

    // Vérifier si le lien existe déjà
    const existingLink = await query(
      `SELECT id FROM user_resident_links WHERE user_id = $1 AND resident_id = $2`,
      [userId, resident_id]
    )

    if (existingLink.rows.length > 0) {
      return c.json({ error: 'Link already exists' }, 409)
    }

    const result = await query(
      `INSERT INTO user_resident_links (user_id, resident_id, relation, is_primary_contact)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, resident_id, relation, is_primary_contact || false]
    )

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        adminUser.id,
        resident_id,
        'linked_user_resident',
        `Lien créé entre utilisateur (ID: ${userId}) et résident (relation: ${relation})`
      ]
    )

    console.log('✅ User-resident link created:', result.rows[0].id)
    return c.json(result.rows[0], 201)
  } catch (error: any) {
    console.error('❌ POST /users/:user_id/link-resident error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * DELETE /api/users/:user_id/link-resident/:resident_id
 * Supprimer le lien utilisateur-résident (ADMIN uniquement)
 */
users.delete('/:user_id/link-resident/:resident_id', authenticate, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('user_id')
    const residentId = c.req.param('resident_id')
    const adminUser = c.get('user')

    const result = await query(
      `DELETE FROM user_resident_links 
       WHERE user_id = $1 AND resident_id = $2
       RETURNING *`,
      [userId, residentId]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Link not found' }, 404)
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        adminUser.id,
        residentId,
        'unlinked_user_resident',
        `Lien supprimé entre utilisateur (ID: ${userId}) et résident`
      ]
    )

    console.log('✅ User-resident link deleted')
    return c.json({ success: true, message: 'Link deleted' })
  } catch (error: any) {
    console.error('❌ DELETE /users/:user_id/link-resident error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/users/stats
 * Statistiques utilisateurs (ADMIN uniquement)
 */
users.get('/stats/summary', authenticate, requireAdmin, async (c) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'CLIENT') as clients_count,
        COUNT(*) FILTER (WHERE role = 'EMPLOYEE') as employees_count,
        COUNT(*) FILTER (WHERE role = 'ADMIN') as admins_count,
        COUNT(*) FILTER (WHERE active = true) as active_count,
        COUNT(*) FILTER (WHERE active = false) as inactive_count,
        COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_last_week
      FROM users
    `)

    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ GET /users/stats error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default users
