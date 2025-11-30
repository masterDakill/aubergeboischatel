// src/routes/observations.ts

import { Hono } from 'hono';
import { z } from 'zod';
import {
  sendObservationCreated,
  sendObservationUpdated,
  type McopEnv,
} from '../lib/mcopHub';

// ------------------------------------------------------------------
// Types d'environnement / DB
// ------------------------------------------------------------------

type DbClient = {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>;
};

type Bindings = {
  MCOP_HUB_URL: string;
  MCOP_HUB_TOKEN?: string;
};

type Variables = {
  db: DbClient;
};

type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export const observationsRouter = new Hono<AppEnv>();

// ------------------------------------------------------------------
// Zod schemas
// ------------------------------------------------------------------

const createObservationSchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid(),
  authorEmployeeId: z.string().uuid().optional(),

  observationType: z.enum([
    'CLINICAL',
    'BEHAVIORAL',
    'SOCIAL',
    'NUTRITION',
    'MOBILITY',
    'GENERAL',
  ]),
  severity: z.enum(['INFO', 'WARNING', 'URGENT', 'CRITICAL']),

  title: z.string().min(3).max(200).optional(),
  content: z.string().min(3),

  visibleToFamily: z.boolean().default(false),
  requiresFollowUp: z.boolean().default(false),
  followUpNotes: z.string().optional(),

  relatedCarePlanItemId: z.string().uuid().optional(),
  relatedIncidentId: z.string().uuid().optional(),

  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    painLevel: z.number().min(0).max(10).optional(),
  }).optional(),

  metadata: z.record(z.string(), z.any()).optional(),
});

const listObservationsQuerySchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  observationType: z.enum([
    'CLINICAL',
    'BEHAVIORAL',
    'SOCIAL',
    'NUTRITION',
    'MOBILITY',
    'GENERAL',
  ]).optional(),
  severity: z.enum(['INFO', 'WARNING', 'URGENT', 'CRITICAL']).optional(),
  visibleToFamily: z.coerce.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const getObservationParamsSchema = z.object({
  id: z.string().uuid(),
});

const updateObservationSchema = z.object({
  observationType: z.enum([
    'CLINICAL',
    'BEHAVIORAL',
    'SOCIAL',
    'NUTRITION',
    'MOBILITY',
    'GENERAL',
  ]).optional(),
  severity: z.enum(['INFO', 'WARNING', 'URGENT', 'CRITICAL']).optional(),
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(3).optional(),
  visibleToFamily: z.boolean().optional(),
  requiresFollowUp: z.boolean().optional(),
  followUpNotes: z.string().optional(),
  followUpCompleted: z.boolean().optional(),
  followUpCompletedByEmployeeId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ------------------------------------------------------------------
// Types de lignes / DTO
// ------------------------------------------------------------------

type ObservationRow = {
  id: string;
  residence_id: string;
  resident_id: string;
  author_employee_id: string | null;
  observation_type: string;
  severity: string;
  title: string | null;
  content: string;
  visible_to_family: boolean;
  requires_follow_up: boolean;
  follow_up_notes: string | null;
  follow_up_completed: boolean;
  follow_up_completed_at: string | Date | null;
  follow_up_completed_by: string | null;
  related_care_plan_item_id: string | null;
  related_incident_id: string | null;
  vital_signs: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type ObservationDto = {
  id: string;
  residenceId: string;
  residentId: string;
  authorEmployeeId?: string | null;
  observationType: string;
  severity: string;
  title?: string | null;
  content: string;
  visibleToFamily: boolean;
  requiresFollowUp: boolean;
  followUpNotes?: string | null;
  followUpCompleted: boolean;
  followUpCompletedAt?: string | null;
  followUpCompletedBy?: string | null;
  relatedCarePlanItemId?: string | null;
  relatedIncidentId?: string | null;
  vitalSigns?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapObservationRowToDto(row: ObservationRow): ObservationDto {
  return {
    id: row.id,
    residenceId: row.residence_id,
    residentId: row.resident_id,
    authorEmployeeId: row.author_employee_id,
    observationType: row.observation_type,
    severity: row.severity,
    title: row.title,
    content: row.content,
    visibleToFamily: row.visible_to_family,
    requiresFollowUp: row.requires_follow_up,
    followUpNotes: row.follow_up_notes,
    followUpCompleted: row.follow_up_completed,
    followUpCompletedAt: toIso(row.follow_up_completed_at),
    followUpCompletedBy: row.follow_up_completed_by,
    relatedCarePlanItemId: row.related_care_plan_item_id,
    relatedIncidentId: row.related_incident_id,
    vitalSigns: row.vital_signs,
    metadata: row.metadata,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function getMcopEnvFromBindings(bindings: Bindings): McopEnv {
  return {
    MCOP_HUB_URL: bindings.MCOP_HUB_URL,
    MCOP_HUB_TOKEN: bindings.MCOP_HUB_TOKEN,
  };
}

// ------------------------------------------------------------------
// POST /api/observations → création d'une observation
// ------------------------------------------------------------------

observationsRouter.post('/', async (c) => {
  const db = c.get('db');

  let data;
  try {
    const body = await c.req.json();
    data = createObservationSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.flatten(),
        },
        400,
      );
    }
    console.error('[OBSERVATIONS] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const {
    residenceId,
    residentId,
    authorEmployeeId,
    observationType,
    severity,
    title,
    content,
    visibleToFamily = false,
    requiresFollowUp = false,
    followUpNotes,
    relatedCarePlanItemId,
    relatedIncidentId,
    vitalSigns,
    metadata,
  } = data;

  try {
    const insertSql = `
      INSERT INTO observations (
        id,
        residence_id,
        resident_id,
        author_employee_id,
        observation_type,
        severity,
        title,
        content,
        visible_to_family,
        requires_follow_up,
        follow_up_notes,
        related_care_plan_item_id,
        related_incident_id,
        vital_signs,
        metadata
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        COALESCE($13::jsonb, '{}'::jsonb),
        COALESCE($14::jsonb, '{}'::jsonb)
      )
      RETURNING
        id,
        residence_id,
        resident_id,
        author_employee_id,
        observation_type,
        severity,
        title,
        content,
        visible_to_family,
        requires_follow_up,
        follow_up_notes,
        follow_up_completed,
        follow_up_completed_at,
        follow_up_completed_by,
        related_care_plan_item_id,
        related_incident_id,
        vital_signs,
        metadata,
        created_at,
        updated_at
    `;

    const params = [
      residenceId,
      residentId,
      authorEmployeeId ?? null,
      observationType,
      severity,
      title ?? null,
      content,
      visibleToFamily,
      requiresFollowUp,
      followUpNotes ?? null,
      relatedCarePlanItemId ?? null,
      relatedIncidentId ?? null,
      vitalSigns ? JSON.stringify(vitalSigns) : null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const { rows } = await db.query<ObservationRow>(insertSql, params);
    const row = rows[0];
    const dto = mapObservationRowToDto(row);

    // Envoi asynchrone vers MCOP Hub
    sendObservationCreated(
      {
        observationId: dto.id,
        residentId: dto.residentId,
        residenceId: dto.residenceId,
        authorEmployeeId: dto.authorEmployeeId ?? undefined,
        observationType: dto.observationType as any,
        severity: dto.severity as any,
        title: dto.title ?? undefined,
        content: dto.content,
        createdAt: dto.createdAt,
        visibleToFamily: dto.visibleToFamily,
      },
      getMcopEnvFromBindings(c.env),
    ).then((result) => {
      if (!result.ok) {
        console.error('[OBSERVATIONS] MCOP Hub error', result);
      }
    }).catch((err) => {
      console.error('[OBSERVATIONS] MCOP Hub exception', err);
    });

    return c.json(dto, 201);
  } catch (err) {
    console.error('[OBSERVATIONS] DB error on insert', err);
    return c.json({ error: 'Failed to create observation' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/observations → liste paginée avec filtres
// ------------------------------------------------------------------

observationsRouter.get('/', async (c) => {
  const db = c.get('db');

  let queryParams;
  try {
    queryParams = listObservationsQuerySchema.parse(c.req.query());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.flatten(),
        },
        400,
      );
    }
    console.error('[OBSERVATIONS] Invalid query params', err);
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const {
    residenceId,
    residentId,
    observationType,
    severity,
    visibleToFamily,
    from,
    to,
    limit,
    offset,
  } = queryParams;

  const whereClauses: string[] = ['residence_id = $1'];
  const params: any[] = [residenceId];
  let paramIndex = 2;

  if (residentId) {
    whereClauses.push(`resident_id = $${paramIndex++}`);
    params.push(residentId);
  }
  if (observationType) {
    whereClauses.push(`observation_type = $${paramIndex++}`);
    params.push(observationType);
  }
  if (severity) {
    whereClauses.push(`severity = $${paramIndex++}`);
    params.push(severity);
  }
  if (visibleToFamily !== undefined) {
    whereClauses.push(`visible_to_family = $${paramIndex++}`);
    params.push(visibleToFamily);
  }
  if (from) {
    whereClauses.push(`created_at >= $${paramIndex++}::date`);
    params.push(from);
  }
  if (to) {
    whereClauses.push(`created_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
    params.push(to);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      author_employee_id,
      observation_type,
      severity,
      title,
      content,
      visible_to_family,
      requires_follow_up,
      follow_up_notes,
      follow_up_completed,
      follow_up_completed_at,
      follow_up_completed_by,
      related_care_plan_item_id,
      related_incident_id,
      vital_signs,
      metadata,
      created_at,
      updated_at
    FROM observations
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  try {
    const { rows } = await db.query<ObservationRow>(sql, params);
    const items = rows.map(mapObservationRowToDto);
    return c.json({
      items,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[OBSERVATIONS] DB error on list', err);
    return c.json({ error: 'Failed to list observations' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/observations/:id → détail d'une observation
// ------------------------------------------------------------------

observationsRouter.get('/:id', async (c) => {
  const db = c.get('db');

  let params;
  try {
    params = getObservationParamsSchema.parse(c.req.param());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.flatten(),
        },
        400,
      );
    }
    console.error('[OBSERVATIONS] Invalid params', err);
    return c.json({ error: 'Invalid observation id' }, 400);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      author_employee_id,
      observation_type,
      severity,
      title,
      content,
      visible_to_family,
      requires_follow_up,
      follow_up_notes,
      follow_up_completed,
      follow_up_completed_at,
      follow_up_completed_by,
      related_care_plan_item_id,
      related_incident_id,
      vital_signs,
      metadata,
      created_at,
      updated_at
    FROM observations
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const { rows } = await db.query<ObservationRow>(sql, [params.id]);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Observation not found' }, 404);
    }

    const dto = mapObservationRowToDto(row);
    return c.json(dto);
  } catch (err) {
    console.error('[OBSERVATIONS] DB error on getById', err);
    return c.json({ error: 'Failed to fetch observation' }, 500);
  }
});

// ------------------------------------------------------------------
// PATCH /api/observations/:id → mise à jour d'une observation
// ------------------------------------------------------------------

observationsRouter.patch('/:id', async (c) => {
  const db = c.get('db');

  let observationId;
  try {
    const params = getObservationParamsSchema.parse(c.req.param());
    observationId = params.id;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.flatten(),
        },
        400,
      );
    }
    return c.json({ error: 'Invalid observation id' }, 400);
  }

  let data;
  try {
    const body = await c.req.json();
    data = updateObservationSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.flatten(),
        },
        400,
      );
    }
    console.error('[OBSERVATIONS] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  // Check if there's anything to update
  if (Object.keys(data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  try {
    // 1. Fetch previous state before update
    const previousResult = await db.query<ObservationRow>(
      `SELECT
        observation_type, severity, title, content,
        visible_to_family, requires_follow_up, follow_up_notes,
        follow_up_completed, vital_signs, metadata,
        residence_id, resident_id
      FROM observations WHERE id = $1`,
      [observationId]
    );

    if (previousResult.rows.length === 0) {
      return c.json({ error: 'Observation not found' }, 404);
    }

    const previousRow = previousResult.rows[0];

    // Build snapshot of previous state (only fields that can be updated)
    const previousSnapshot = {
      observationType: previousRow.observation_type,
      severity: previousRow.severity,
      title: previousRow.title ?? undefined,
      content: previousRow.content,
      visibleToFamily: previousRow.visible_to_family,
      requiresFollowUp: previousRow.requires_follow_up,
      followUpNotes: previousRow.follow_up_notes ?? undefined,
      followUpCompleted: previousRow.follow_up_completed,
      vitalSigns: previousRow.vital_signs ?? undefined,
      metadata: previousRow.metadata ?? undefined,
    };

    // 2. Build dynamic UPDATE query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    const changedFields: string[] = [];

    if (data.observationType !== undefined) {
      updates.push(`observation_type = $${paramIndex++}`);
      params.push(data.observationType);
      if (data.observationType !== previousRow.observation_type) {
        changedFields.push('observationType');
      }
    }
    if (data.severity !== undefined) {
      updates.push(`severity = $${paramIndex++}`);
      params.push(data.severity);
      if (data.severity !== previousRow.severity) {
        changedFields.push('severity');
      }
    }
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
      if (data.title !== previousRow.title) {
        changedFields.push('title');
      }
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(data.content);
      if (data.content !== previousRow.content) {
        changedFields.push('content');
      }
    }
    if (data.visibleToFamily !== undefined) {
      updates.push(`visible_to_family = $${paramIndex++}`);
      params.push(data.visibleToFamily);
      if (data.visibleToFamily !== previousRow.visible_to_family) {
        changedFields.push('visibleToFamily');
      }
    }
    if (data.requiresFollowUp !== undefined) {
      updates.push(`requires_follow_up = $${paramIndex++}`);
      params.push(data.requiresFollowUp);
      if (data.requiresFollowUp !== previousRow.requires_follow_up) {
        changedFields.push('requiresFollowUp');
      }
    }
    if (data.followUpNotes !== undefined) {
      updates.push(`follow_up_notes = $${paramIndex++}`);
      params.push(data.followUpNotes);
      if (data.followUpNotes !== previousRow.follow_up_notes) {
        changedFields.push('followUpNotes');
      }
    }
    if (data.followUpCompleted !== undefined) {
      updates.push(`follow_up_completed = $${paramIndex++}`);
      params.push(data.followUpCompleted);
      if (data.followUpCompleted !== previousRow.follow_up_completed) {
        changedFields.push('followUpCompleted');
      }
      if (data.followUpCompleted) {
        updates.push(`follow_up_completed_at = NOW()`);
        if (data.followUpCompletedByEmployeeId) {
          updates.push(`follow_up_completed_by = $${paramIndex++}`);
          params.push(data.followUpCompletedByEmployeeId);
        }
      }
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(data.metadata));
      // Compare JSON stringified for metadata
      if (JSON.stringify(data.metadata) !== JSON.stringify(previousRow.metadata)) {
        changedFields.push('metadata');
      }
    }

    updates.push('updated_at = NOW()');
    params.push(observationId);

    const updateSql = `
      UPDATE observations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        residence_id,
        resident_id,
        author_employee_id,
        observation_type,
        severity,
        title,
        content,
        visible_to_family,
        requires_follow_up,
        follow_up_notes,
        follow_up_completed,
        follow_up_completed_at,
        follow_up_completed_by,
        related_care_plan_item_id,
        related_incident_id,
        vital_signs,
        metadata,
        created_at,
        updated_at
    `;

    const { rows } = await db.query<ObservationRow>(updateSql, params);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Observation not found' }, 404);
    }

    const dto = mapObservationRowToDto(row);

    // Build current snapshot
    const currentSnapshot = {
      observationType: dto.observationType,
      severity: dto.severity,
      title: dto.title ?? undefined,
      content: dto.content,
      visibleToFamily: dto.visibleToFamily,
      requiresFollowUp: dto.requiresFollowUp,
      followUpNotes: dto.followUpNotes ?? undefined,
      followUpCompleted: dto.followUpCompleted,
      vitalSigns: dto.vitalSigns ?? undefined,
      metadata: dto.metadata ?? undefined,
    };

    // 3. Envoi asynchrone vers MCOP Hub avec diff (non bloquant)
    if (changedFields.length > 0) {
      sendObservationUpdated(
        {
          observationId: dto.id,
          residentId: dto.residentId,
          residenceId: dto.residenceId,
          updatedAt: dto.updatedAt,
          changedFields,
          previous: previousSnapshot,
          current: currentSnapshot,
        },
        getMcopEnvFromBindings(c.env),
      ).then((result) => {
        if (!result.ok) {
          console.error('[OBSERVATIONS] MCOP Hub error on update', result);
        }
      }).catch((err) => {
        console.error('[OBSERVATIONS] MCOP Hub exception on update', err);
      });
    }

    return c.json(dto);
  } catch (err) {
    console.error('[OBSERVATIONS] DB error on update', err);
    return c.json({ error: 'Failed to update observation' }, 500);
  }
});
