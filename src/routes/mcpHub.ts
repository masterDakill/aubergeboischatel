// src/routes/mcpHub.ts
// MCP Hub Integration API - Connects chatbot to AIDyn MCP Hub

import { Hono } from 'hono'
import { verifyIdToken } from '../lib/firebaseAdmin'
import { query } from '../lib/db'

const mcpHub = new Hono()

// Allowed MCP tools for Auberge Boischatel
const ALLOWED_TOOLS = [
  'Gmail_Auberge',
  'Calendar_Auberge',
  'Drive_Auberge',
  'Airtable_Auberge',
  'UniFi_Auberge'
]

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
 * GET /api/mcp/health
 * Check MCP Hub connection
 */
mcpHub.get('/health', async (c) => {
  try {
    const env = (globalThis as any).env || {}
    const hubUrl = env.MCOP_HUB_URL || 'https://aidyn-mcp-hub-production.up.railway.app'

    const response = await fetch(`${hubUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return c.json({
        success: true,
        hub_status: 'connected',
        hub_url: hubUrl,
        hub_response: data,
        allowed_tools: ALLOWED_TOOLS
      })
    } else {
      return c.json({
        success: false,
        hub_status: 'error',
        hub_url: hubUrl,
        error: `Hub returned ${response.status}`
      }, 502)
    }
  } catch (error: any) {
    console.error('❌ MCP Hub health check error:', error)
    return c.json({
      success: false,
      hub_status: 'unreachable',
      error: error.message
    }, 503)
  }
})

/**
 * GET /api/mcp/tools
 * List available MCP tools for Auberge
 */
mcpHub.get('/tools', authenticateStaff, async (c) => {
  return c.json({
    success: true,
    tools: ALLOWED_TOOLS.map(tool => ({
      name: tool,
      description: getToolDescription(tool)
    }))
  })
})

/**
 * POST /api/mcp/prompt
 * Send a prompt to MCP Hub AI with context filtering
 */
mcpHub.post('/prompt', authenticateStaff, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { prompt, context } = body

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    const env = (globalThis as any).env || {}
    const hubUrl = env.MCOP_HUB_URL || 'https://aidyn-mcp-hub-production.up.railway.app'
    const apiKey = env.MCOP_HUB_API_KEY || ''

    // Enrich prompt with Auberge context
    const enrichedPrompt = `
[Contexte: Auberge Boischatel - Résidence pour personnes âgées]
[Utilisateur: ${user.first_name} ${user.last_name} (${user.role})]
[Outils disponibles: ${ALLOWED_TOOLS.join(', ')}]

${prompt}
`.trim()

    console.log(`🤖 MCP Hub prompt from ${user.email}: ${prompt.substring(0, 100)}...`)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${hubUrl}/api/ai/prompt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: enrichedPrompt,
        context: {
          ...context,
          source: 'auberge_boischatel',
          allowed_tools: ALLOWED_TOOLS
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ MCP Hub error:', errorText)
      return c.json({
        success: false,
        error: `MCP Hub error: ${response.status}`,
        details: errorText
      }, 502)
    }

    const data = await response.json()

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [user.id, 'mcp_prompt', `Prompt: ${prompt.substring(0, 200)}`]
    )

    return c.json({
      success: true,
      response: data.response || data.message || data,
      provider: data.provider,
      model: data.model
    })
  } catch (error: any) {
    console.error('❌ MCP prompt error:', error)
    return c.json({ error: 'Failed to process prompt: ' + error.message }, 500)
  }
})

/**
 * POST /api/mcp/action
 * Execute a smart action via MCP Hub
 */
mcpHub.post('/action', authenticateStaff, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { action, params } = body

    if (!action) {
      return c.json({ error: 'Action is required' }, 400)
    }

    const env = (globalThis as any).env || {}
    const hubUrl = env.MCOP_HUB_URL || 'https://aidyn-mcp-hub-production.up.railway.app'
    const apiKey = env.MCOP_HUB_API_KEY || ''

    console.log(`🎯 MCP Hub action from ${user.email}: ${action}`)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${hubUrl}/api/ai/actions/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        params: {
          ...params,
          source: 'auberge_boischatel',
          tools_filter: ALLOWED_TOOLS
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ MCP Hub action error:', errorText)
      return c.json({
        success: false,
        error: `MCP Hub action error: ${response.status}`,
        details: errorText
      }, 502)
    }

    const data = await response.json()

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [user.id, 'mcp_action', `Action: ${action}`]
    )

    return c.json({
      success: true,
      result: data
    })
  } catch (error: any) {
    console.error('❌ MCP action error:', error)
    return c.json({ error: 'Failed to execute action: ' + error.message }, 500)
  }
})

/**
 * GET /api/mcp/emails
 * Get Auberge emails via MCP Hub
 */
mcpHub.get('/emails', authenticateStaff, async (c) => {
  try {
    const env = (globalThis as any).env || {}
    const hubUrl = env.MCOP_HUB_URL || 'https://aidyn-mcp-hub-production.up.railway.app'
    const apiKey = env.MCOP_HUB_API_KEY || ''

    const page = c.req.query('page') || '1'
    const limit = c.req.query('limit') || '20'
    const search = c.req.query('search') || ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    // Filter for Auberge account only
    const url = new URL(`${hubUrl}/api/emails`)
    url.searchParams.set('page', page)
    url.searchParams.set('limit', limit)
    url.searchParams.set('account', 'Gmail_Auberge')
    if (search) {
      url.searchParams.set('search', search)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      return c.json({
        success: false,
        error: `Failed to fetch emails: ${response.status}`
      }, 502)
    }

    const data = await response.json()
    return c.json({
      success: true,
      emails: data.emails || data,
      total: data.total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error: any) {
    console.error('❌ MCP emails error:', error)
    return c.json({ error: 'Failed to fetch emails: ' + error.message }, 500)
  }
})

/**
 * GET /api/mcp/calendar
 * Get Auberge calendar events via MCP Hub
 */
mcpHub.get('/calendar', authenticateStaff, async (c) => {
  try {
    const env = (globalThis as any).env || {}
    const hubUrl = env.MCOP_HUB_URL || 'https://aidyn-mcp-hub-production.up.railway.app'
    const apiKey = env.MCOP_HUB_API_KEY || ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    // Use AI prompt to get calendar info via Calendar_Auberge tool
    const response = await fetch(`${hubUrl}/api/ai/prompt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: 'Liste les événements du calendrier de l\'Auberge Boischatel pour les 7 prochains jours.',
        context: {
          tools: ['Calendar_Auberge'],
          format: 'json'
        }
      })
    })

    if (!response.ok) {
      return c.json({
        success: false,
        error: `Failed to fetch calendar: ${response.status}`
      }, 502)
    }

    const data = await response.json()
    return c.json({
      success: true,
      events: data.response || data
    })
  } catch (error: any) {
    console.error('❌ MCP calendar error:', error)
    return c.json({ error: 'Failed to fetch calendar: ' + error.message }, 500)
  }
})

/**
 * Helper: Get tool description
 */
function getToolDescription(tool: string): string {
  const descriptions: Record<string, string> = {
    'Gmail_Auberge': 'Emails admin@aubergeboischatel.com - lecture et recherche',
    'Calendar_Auberge': 'Calendrier Google - événements et horaires',
    'Drive_Auberge': 'Google Drive - documents partagés',
    'Airtable_Auberge': 'Base de données - résidents, registres, sécurité incendie',
    'UniFi_Auberge': 'Contrôleur réseau UniFi - gestion infrastructure'
  }
  return descriptions[tool] || tool
}

export default mcpHub
