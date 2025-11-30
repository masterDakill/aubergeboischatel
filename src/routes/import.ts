// src/routes/import.ts
// CSV/Excel Import API for bulk data import

import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const importRoutes = new Hono()

/**
 * Middleware: Verify authentication (STAFF only)
 */
async function authenticateStaff(c: any, next: any) {
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

    const user = userResult.rows[0]
    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return c.json({ error: 'Staff role required' }, 403)
    }

    c.set('user', user)
    await next()
  } catch (error: any) {
    console.error('Auth error:', error)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

/**
 * POST /api/import/residents
 * Import residents from CSV data
 */
importRoutes.post('/residents', authenticateStaff, async (c) => {
  try {
    const body = await c.req.json()
    const { data } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return c.json({ error: 'No data provided' }, 400)
    }

    let imported = 0
    let errors: string[] = []

    for (const row of data) {
      try {
        // Validate required field
        if (!row.full_name) {
          errors.push(`Ligne ignorée: nom manquant`)
          continue
        }

        // Check if resident already exists
        const existing = await query(
          'SELECT id FROM residents WHERE full_name = $1',
          [row.full_name]
        )

        if (existing.rows.length > 0) {
          errors.push(`${row.full_name}: existe déjà`)
          continue
        }

        // Insert resident
        await query(
          `INSERT INTO residents (full_name, room_number, date_of_birth, admission_date, medical_notes, allergies, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
          [
            row.full_name,
            row.room_number || null,
            row.date_of_birth || null,
            row.admission_date || null,
            row.medical_notes || null,
            row.allergies || null
          ]
        )

        imported++
      } catch (rowError: any) {
        console.error('Row import error:', rowError)
        errors.push(`${row.full_name || 'Ligne'}: ${rowError.message}`)
      }
    }

    console.log(`✅ Import residents: ${imported} imported, ${errors.length} errors`)

    return c.json({
      success: true,
      imported,
      errors: errors.slice(0, 10), // Limit error messages
      total: data.length
    })
  } catch (error: any) {
    console.error('❌ Import residents error:', error)
    return c.json({ error: 'Import failed: ' + error.message }, 500)
  }
})

/**
 * POST /api/import/observations
 * Import observations from CSV data
 */
importRoutes.post('/observations', authenticateStaff, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { data } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return c.json({ error: 'No data provided' }, 400)
    }

    // Get residence ID (assuming single residence for now)
    const residenceResult = await query('SELECT id FROM residences LIMIT 1')
    const residenceId = residenceResult.rows[0]?.id || '550e8400-e29b-41d4-a716-446655440000'

    let imported = 0
    let errors: string[] = []

    for (const row of data) {
      try {
        // Find resident by name
        if (!row.resident_name) {
          errors.push('Ligne ignorée: nom résident manquant')
          continue
        }

        const residentResult = await query(
          'SELECT id FROM residents WHERE full_name ILIKE $1',
          [`%${row.resident_name}%`]
        )

        if (residentResult.rows.length === 0) {
          errors.push(`${row.resident_name}: résident non trouvé`)
          continue
        }

        const residentId = residentResult.rows[0].id

        // Map observation type
        const observationType = (row.observation_type || 'GENERAL').toUpperCase()
        const validTypes = ['CLINICAL', 'BEHAVIORAL', 'SOCIAL', 'NUTRITION', 'MOBILITY', 'GENERAL']
        const finalType = validTypes.includes(observationType) ? observationType : 'GENERAL'

        // Map severity
        const severity = (row.severity || 'INFO').toUpperCase()
        const validSeverities = ['INFO', 'WARNING', 'URGENT', 'CRITICAL']
        const finalSeverity = validSeverities.includes(severity) ? severity : 'INFO'

        // Insert observation
        await query(
          `INSERT INTO observations (residence_id, resident_id, author_employee_id, observation_type, severity, content)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            residenceId,
            residentId,
            user.id,
            finalType,
            finalSeverity,
            row.content || 'Observation importée'
          ]
        )

        imported++
      } catch (rowError: any) {
        console.error('Row import error:', rowError)
        errors.push(`${row.resident_name || 'Ligne'}: ${rowError.message}`)
      }
    }

    console.log(`✅ Import observations: ${imported} imported, ${errors.length} errors`)

    return c.json({
      success: true,
      imported,
      errors: errors.slice(0, 10),
      total: data.length
    })
  } catch (error: any) {
    console.error('❌ Import observations error:', error)
    return c.json({ error: 'Import failed: ' + error.message }, 500)
  }
})

/**
 * POST /api/import/care_tasks
 * Import care tasks from CSV data
 */
importRoutes.post('/care_tasks', authenticateStaff, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { data } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return c.json({ error: 'No data provided' }, 400)
    }

    // Get residence ID
    const residenceResult = await query('SELECT id FROM residences LIMIT 1')
    const residenceId = residenceResult.rows[0]?.id || '550e8400-e29b-41d4-a716-446655440000'

    let imported = 0
    let errors: string[] = []

    for (const row of data) {
      try {
        // Find resident by name
        if (!row.resident_name) {
          errors.push('Ligne ignorée: nom résident manquant')
          continue
        }

        const residentResult = await query(
          'SELECT id FROM residents WHERE full_name ILIKE $1',
          [`%${row.resident_name}%`]
        )

        if (residentResult.rows.length === 0) {
          errors.push(`${row.resident_name}: résident non trouvé`)
          continue
        }

        const residentId = residentResult.rows[0].id

        // Map task type
        const taskType = (row.task_type || 'GENERAL').toUpperCase()
        const validTypes = ['HYGIENE', 'MEDICATION', 'NUTRITION', 'MOBILITY', 'MONITORING', 'ACTIVITY', 'MEDICAL', 'OTHER']
        const finalType = validTypes.includes(taskType) ? taskType : 'OTHER'

        // Parse scheduled date
        let scheduledDate = new Date()
        if (row.scheduled_date) {
          const parsed = new Date(row.scheduled_date)
          if (!isNaN(parsed.getTime())) {
            scheduledDate = parsed
          }
        }

        // Insert care task
        await query(
          `INSERT INTO care_tasks (residence_id, resident_id, assigned_employee_id, task_type, description, scheduled_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
          [
            residenceId,
            residentId,
            user.id,
            finalType,
            row.description || 'Tâche importée',
            scheduledDate.toISOString()
          ]
        )

        imported++
      } catch (rowError: any) {
        console.error('Row import error:', rowError)
        errors.push(`${row.resident_name || 'Ligne'}: ${rowError.message}`)
      }
    }

    console.log(`✅ Import care_tasks: ${imported} imported, ${errors.length} errors`)

    return c.json({
      success: true,
      imported,
      errors: errors.slice(0, 10),
      total: data.length
    })
  } catch (error: any) {
    console.error('❌ Import care_tasks error:', error)
    return c.json({ error: 'Import failed: ' + error.message }, 500)
  }
})

export default importRoutes
