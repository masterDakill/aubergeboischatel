import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const documents = new Hono()

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
 * GET /api/documents
 * Liste tous les documents (STAFF) ou documents visibles (CLIENT)
 */
documents.get('/', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const residentId = c.req.query('resident_id')

    let result

    if (user.role === 'EMPLOYEE' || user.role === 'ADMIN') {
      // STAFF voit tous les documents
      let queryText = `
        SELECT 
          d.*,
          r.full_name as resident_name,
          r.room_number,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM documents d
        JOIN residents r ON r.id = d.resident_id
        LEFT JOIN users u ON u.id = d.uploaded_by
      `

      if (residentId) {
        queryText += ` WHERE d.resident_id = $1`
        result = await query(queryText + ` ORDER BY d.created_at DESC`, [residentId])
      } else {
        result = await query(queryText + ` ORDER BY d.created_at DESC`)
      }
    } else {
      // CLIENT ne voit que les documents visibles de ses résidents liés
      const queryText = `
        SELECT 
          d.*,
          r.full_name as resident_name,
          r.room_number,
          url.relation
        FROM documents d
        JOIN residents r ON r.id = d.resident_id
        JOIN user_resident_links url ON url.resident_id = r.id
        WHERE url.user_id = $1 AND d.visible_to_client = true
      `

      if (residentId) {
        result = await query(
          queryText + ` AND d.resident_id = $2 ORDER BY d.created_at DESC`,
          [user.id, residentId]
        )
      } else {
        result = await query(
          queryText + ` ORDER BY d.created_at DESC`,
          [user.id]
        )
      }
    }

    return c.json(result.rows)
  } catch (error: any) {
    console.error('❌ GET /documents error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * GET /api/documents/:id
 * Obtenir un document spécifique
 */
documents.get('/:id', authenticate, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')

    if (user.role === 'EMPLOYEE' || user.role === 'ADMIN') {
      // STAFF peut voir tous les documents
      const result = await query(
        `SELECT 
          d.*,
          r.full_name as resident_name,
          r.room_number,
          u.first_name || ' ' || u.last_name as uploaded_by_name
         FROM documents d
         JOIN residents r ON r.id = d.resident_id
         LEFT JOIN users u ON u.id = d.uploaded_by
         WHERE d.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return c.json({ error: 'Document not found' }, 404)
      }

      return c.json(result.rows[0])
    } else {
      // CLIENT ne peut voir que les documents visibles de ses résidents
      const result = await query(
        `SELECT 
          d.*,
          r.full_name as resident_name,
          r.room_number
         FROM documents d
         JOIN residents r ON r.id = d.resident_id
         JOIN user_resident_links url ON url.resident_id = r.id
         WHERE d.id = $1 AND url.user_id = $2 AND d.visible_to_client = true`,
        [id, user.id]
      )

      if (result.rows.length === 0) {
        return c.json({ error: 'Document not found or access denied' }, 404)
      }

      return c.json(result.rows[0])
    }
  } catch (error: any) {
    console.error('❌ GET /documents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST /api/documents
 * Créer/uploader un document (STAFF uniquement)
 */
documents.post('/', authenticate, async (c) => {
  try {
    const user = c.get('user')

    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Staff role required' }, 403)
    }

    const body = await c.req.json()
    const {
      resident_id,
      title,
      file_url,
      file_type,
      file_size_kb,
      visible_to_client
    } = body

    // Validation
    if (!resident_id || !title || !file_url) {
      return c.json({ error: 'resident_id, title, and file_url are required' }, 400)
    }

    const result = await query(
      `INSERT INTO documents (
        resident_id,
        title,
        file_url,
        file_type,
        file_size_kb,
        uploaded_by,
        visible_to_client
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        resident_id,
        title,
        file_url,
        file_type || null,
        file_size_kb || null,
        user.id,
        visible_to_client !== undefined ? visible_to_client : true
      ]
    )

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        resident_id,
        'uploaded_document',
        `Document uploadé: ${title}`
      ]
    )

    // Si visible aux clients, créer notification pour les familles liées
    if (visible_to_client) {
      const familyResult = await query(
        `SELECT user_id FROM user_resident_links WHERE resident_id = $1`,
        [resident_id]
      )

      for (const row of familyResult.rows) {
        await query(
          `INSERT INTO notifications (recipient_user_id, resident_id, title, message, notification_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            row.user_id,
            resident_id,
            'Nouveau document disponible',
            `Un nouveau document "${title}" a été ajouté.`,
            'DOCUMENT'
          ]
        )
      }
    }

    console.log('✅ Document created:', result.rows[0].id)
    return c.json(result.rows[0], 201)
  } catch (error: any) {
    console.error('❌ POST /documents error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * PUT /api/documents/:id
 * Mettre à jour un document (STAFF uniquement)
 */
documents.put('/:id', authenticate, async (c) => {
  try {
    const user = c.get('user')

    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Staff role required' }, 403)
    }

    const id = c.req.param('id')
    const body = await c.req.json()
    const {
      title,
      file_url,
      file_type,
      visible_to_client
    } = body

    const result = await query(
      `UPDATE documents
       SET
         title = COALESCE($1, title),
         file_url = COALESCE($2, file_url),
         file_type = COALESCE($3, file_type),
         visible_to_client = COALESCE($4, visible_to_client),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, file_url, file_type, visible_to_client, id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Document not found' }, 404)
    }

    console.log('✅ Document updated:', id)
    return c.json(result.rows[0])
  } catch (error: any) {
    console.error('❌ PUT /documents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * DELETE /api/documents/:id
 * Supprimer un document (ADMIN uniquement)
 */
documents.delete('/:id', authenticate, async (c) => {
  try {
    const user = c.get('user')

    if (user.role !== 'ADMIN') {
      return c.json({ error: 'Forbidden: Admin role required' }, 403)
    }

    const id = c.req.param('id')

    const result = await query(
      `DELETE FROM documents WHERE id = $1 RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Document not found' }, 404)
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, resident_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        result.rows[0].resident_id,
        'deleted_document',
        `Document supprimé: ${result.rows[0].title}`
      ]
    )

    console.log('✅ Document deleted:', id)
    return c.json({ success: true, message: 'Document deleted' })
  } catch (error: any) {
    console.error('❌ DELETE /documents/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default documents
