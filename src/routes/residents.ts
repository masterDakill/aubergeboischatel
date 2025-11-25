import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const residents = new Hono()

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
    
    // Get user from database
    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    )

    if (userResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Store user in context
    c.set('user', userResult.rows[0])
    await next()
  } catch (error: any) {
    console.error('Auth error:', error)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

/**
 * Middleware: Check if user is EMPLOYEE or ADMIN
 */
function requireStaffRole(c: any, next: any) {
  const user = c.get('user')
  
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return c.json({ error: 'Forbidden: Staff role required' }, 403)
  }

  return next()
}

/**
 * GET /api/residents
 * Liste tous les résidents (STAFF uniquement)
 */
residents.get('/', authenticate, requireStaffRole, async (c) => {
  try {
    const result = await query(
      `SELECT 
        id,
        full_name,
        room_number,
        admission_date,
        date_of_birth,
        emergency_contact_name,
        emergency_contact_phone,
        active,
        created_at
       FROM residents
       WHERE active = true
       ORDER BY room_number ASC`
    )

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /residents error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/residents/:id
 * Obtenir un résident spécifique
 */
residents.get('/:id', authenticate, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    // STAFF peut voir tous les résidents
    if (user.role === 'EMPLOYEE' || user.role === 'ADMIN') {
      const result = await query(
        `SELECT 
          r.*,
          json_agg(
            json_build_object(
              'user_id', url.user_id,
              'relation', url.relation,
              'is_primary', url.is_primary_contact
            )
          ) FILTER (WHERE url.id IS NOT NULL) as linked_users
         FROM residents r
         LEFT JOIN user_resident_links url ON url.resident_id = r.id
         WHERE r.id = $1
         GROUP BY r.id`,
        [id]
      )

      if (result.rows.length === 0) {
        return c.json({ error: 'Resident not found' }, 404)
      }

      return c.json(result.rows[0])
    }

    // CLIENT ne peut voir que ses résidents liés
    const result = await query(
      `SELECT 
        r.*,
        url.relation
       FROM residents r
       JOIN user_resident_links url ON url.resident_id = r.id
       WHERE r.id = $1 AND url.user_id = $2`,
      [id, user.id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Resident not found or access denied' }, 404)
    }

    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ GET /residents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST /api/residents
 * Créer un nouveau résident (STAFF uniquement)
 */
residents.post('/', authenticate, requireStaffRole, async (c) => {
  try {
    const body = await c.req.json()
    const user = c.get('user')

    const {
      full_name,
      room_number,
      date_of_birth,
      admission_date,
      medical_notes,
      emergency_contact_name,
      emergency_contact_phone
    } = body

    // Validation
    if (!full_name || !room_number) {
      return c.json({ error: 'full_name and room_number are required' }, 400)
    }

    const result = await query(
      `INSERT INTO residents (
        full_name,
        room_number,
        date_of_birth,
        admission_date,
        medical_notes,
        emergency_contact_name,
        emergency_contact_phone,
        active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        full_name,
        room_number,
        date_of_birth || null,
        admission_date || new Date().toISOString().split('T')[0],
        medical_notes || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        true
      ]
    )

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        result.rows[0].id,
        'created_resident',
        `Résident créé: ${full_name} - Chambre ${room_number}`
      ]
    )

    console.log('✅ Resident created:', result.rows[0].id)
    return c.json(result.rows[0], 201)
  } catch (error: any) {
    console.error('❌ POST /residents error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * PUT /api/residents/:id
 * Mettre à jour un résident (STAFF uniquement)
 */
residents.put('/:id', authenticate, requireStaffRole, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const user = c.get('user')

    const {
      full_name,
      room_number,
      date_of_birth,
      admission_date,
      medical_notes,
      emergency_contact_name,
      emergency_contact_phone,
      active
    } = body

    const result = await query(
      `UPDATE residents
       SET
         full_name = COALESCE($1, full_name),
         room_number = COALESCE($2, room_number),
         date_of_birth = COALESCE($3, date_of_birth),
         admission_date = COALESCE($4, admission_date),
         medical_notes = COALESCE($5, medical_notes),
         emergency_contact_name = COALESCE($6, emergency_contact_name),
         emergency_contact_phone = COALESCE($7, emergency_contact_phone),
         active = COALESCE($8, active)
       WHERE id = $9
       RETURNING *`,
      [
        full_name,
        room_number,
        date_of_birth,
        admission_date,
        medical_notes,
        emergency_contact_name,
        emergency_contact_phone,
        active,
        id
      ]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Resident not found' }, 404)
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        id,
        'updated_resident',
        `Résident modifié: ${result.rows[0].full_name}`
      ]
    )

    console.log('✅ Resident updated:', id)
    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ PUT /residents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * DELETE /api/residents/:id
 * Supprimer (désactiver) un résident (ADMIN uniquement)
 */
residents.delete('/:id', authenticate, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    // Only ADMIN can delete
    if (user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Admin role required' }, 403)
    }

    // Soft delete (set active = false)
    const result = await query(
      `UPDATE residents
       SET active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Resident not found' }, 404)
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        id,
        'deleted_resident',
        `Résident désactivé: ${result.rows[0].full_name}`
      ]
    )

    console.log('✅ Resident deleted (soft):', id)
    return c.json({ success: true, message: 'Resident deactivated' })
  } catch (error: any) {
    console.error('❌ DELETE /residents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/residents/:id/observations
 * Obtenir les observations d'un résident
 */
residents.get('/:id/observations', authenticate, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    // CLIENT ne voit que les observations visibles aux familles
    let visibilityFilter = ''
    if (user.role === 'CLIENT') {
      // Vérifier que le client a accès à ce résident
      const accessCheck = await query(
        `SELECT 1 FROM user_resident_links WHERE user_id = $1 AND resident_id = $2`,
        [user.id, id]
      )

      if (accessCheck.rows.length === 0) {
        return c.json({ error: 'Access denied' }, 403)
      }

      visibilityFilter = 'AND ro.visible_to_family = true'
    }

    const result = await query(
      `SELECT 
        ro.id,
        ro.observation_type,
        ro.title,
        ro.content,
        ro.severity,
        ro.visible_to_family,
        ro.created_at,
        ro.updated_at,
        u.first_name || ' ' || u.last_name as author_name
       FROM resident_observations ro
       JOIN users u ON u.id = ro.author_id
       WHERE ro.resident_id = $1 ${visibilityFilter}
       ORDER BY ro.created_at DESC
       LIMIT 50`,
      [id]
    )

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /residents/:id/observations error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST /api/residents/:id/observations
 * Ajouter une observation (STAFF uniquement)
 */
residents.post('/:id/observations', authenticate, requireStaffRole, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const user = c.get('user')

    const {
      observation_type,
      title,
      content,
      severity,
      visible_to_family
    } = body

    if (!observation_type || !title || !content) {
      return c.json({ error: 'observation_type, title, and content are required' }, 400)
    }

    const result = await query(
      `INSERT INTO resident_observations (
        resident_id,
        author_id,
        observation_type,
        title,
        content,
        severity,
        visible_to_family
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        user.id,
        observation_type,
        title,
        content,
        severity || 'INFO',
        visible_to_family || false
      ]
    )

    console.log('✅ Observation created:', result.rows[0].id)
    return c.json(result.rows[0], 201)
  } catch (error: any) {
    console.error('❌ POST /residents/:id/observations error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default residents
