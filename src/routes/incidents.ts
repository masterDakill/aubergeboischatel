// src/routes/incidents.ts

import { Hono } from 'hono';
import { z } from 'zod';
import {
  sendIncidentCreated,
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

export const incidentsRouter = new Hono<AppEnv>();

// ------------------------------------------------------------------
// Zod schemas
// ------------------------------------------------------------------

const createIncidentSchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),

  incidentType: z.enum([
    'FALL',
    'MEDICATION_ERROR',
    'BEHAVIOR',
    'INJURY',
    'ELOPEMENT',
    'OTHER',
  ]),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']),

  occurredAt: z.string().datetime(), // ISO 8601
  location: z.string().max(200).optional(),

  title: z.string().min(3).max(200),
  description: z.string().min(3),

  immediateActions: z.string().optional(),
  witnesses: z.array(z.string().max(200)).optional(),

  injuryOccurred: z.boolean().optional(),
  injuryDescription: z.string().optional(),
  medicalAttentionRequired: z.boolean().optional(),
  medicalAttentionDetails: z.string().optional(),

  familyNotified: z.boolean().optional(),

  externalReportRequired: z.boolean().optional(),
  followUpRequired: z.boolean().optional(),

  reportedByEmployeeId: z.string().uuid(),

  metadata: z.record(z.string(), z.any()).optional(),
});

const listIncidentsQuerySchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  status: z
    .enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'])
    .optional(),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(),   // YYYY-MM-DD
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const getIncidentParamsSchema = z.object({
  id: z.string().uuid(),
});

// ------------------------------------------------------------------
// Types de lignes / DTO
// ------------------------------------------------------------------

type IncidentRow = {
  id: string;
  residence_id: string;
  resident_id: string | null;
  unit_id: string | null;
  incident_number: string | null;
  incident_type: string;
  severity: string;
  occurred_at: string | Date;
  location: string | null;
  title: string;
  description: string;
  immediate_actions: string | null;
  witnesses: string[] | null;
  injury_occurred: boolean | null;
  injury_description: string | null;
  medical_attention_required: boolean | null;
  medical_attention_details: string | null;
  family_notified: boolean | null;
  external_report_required: boolean | null;
  external_report_submitted: boolean | null;
  external_report_date: string | Date | null;
  status: string;
  follow_up_required: boolean | null;
  follow_up_notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | Date | null;
  resolved_by: string | null;
  reported_by: string;
  metadata: any | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type IncidentDto = {
  id: string;
  residenceId: string;
  residentId?: string | null;
  unitId?: string | null;
  incidentNumber?: string | null;
  incidentType: string;
  severity: string;
  occurredAt: string;
  location?: string | null;
  title: string;
  description: string;
  status: string;

  immediateActions?: string | null;
  witnesses?: string[] | null;
  injuryOccurred?: boolean | null;
  injuryDescription?: string | null;
  medicalAttentionRequired?: boolean | null;
  medicalAttentionDetails?: string | null;
  familyNotified?: boolean | null;
  externalReportRequired?: boolean | null;
  externalReportSubmitted?: boolean | null;
  externalReportDate?: string | null;
  followUpRequired?: boolean | null;
  followUpNotes?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;

  metadata?: any | null;
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

function mapIncidentRowToDto(row: IncidentRow): IncidentDto {
  return {
    id: row.id,
    residenceId: row.residence_id,
    residentId: row.resident_id,
    unitId: row.unit_id,
    incidentNumber: row.incident_number,
    incidentType: row.incident_type,
    severity: row.severity,
    occurredAt: toIso(row.occurred_at)!,
    location: row.location,
    title: row.title,
    description: row.description,
    status: row.status,

    immediateActions: row.immediate_actions,
    witnesses: row.witnesses,
    injuryOccurred: row.injury_occurred,
    injuryDescription: row.injury_description,
    medicalAttentionRequired: row.medical_attention_required,
    medicalAttentionDetails: row.medical_attention_details,
    familyNotified: row.family_notified,
    externalReportRequired: row.external_report_required,
    externalReportSubmitted: row.external_report_submitted,
    externalReportDate: toIso(row.external_report_date),
    followUpRequired: row.follow_up_required,
    followUpNotes: row.follow_up_notes,
    resolutionNotes: row.resolution_notes,
    resolvedAt: toIso(row.resolved_at),
    resolvedBy: row.resolved_by,

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
// POST /api/incidents  → création d'un incident
// ------------------------------------------------------------------

incidentsRouter.post('/', async (c) => {
  const db = c.get('db');

  let data;
  try {
    const body = await c.req.json();
    data = createIncidentSchema.parse(body);
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
    console.error('[INCIDENTS] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const {
    residenceId,
    residentId,
    unitId,
    incidentType,
    severity,
    occurredAt,
    location,
    title,
    description,
    immediateActions,
    witnesses,
    injuryOccurred,
    injuryDescription,
    medicalAttentionRequired,
    medicalAttentionDetails,
    familyNotified = false,
    externalReportRequired = false,
    followUpRequired = false,
    reportedByEmployeeId,
    metadata,
  } = data;

  try {
    const insertSql = `
      INSERT INTO incidents (
        id,
        residence_id,
        resident_id,
        unit_id,
        incident_number,
        incident_type,
        severity,
        occurred_at,
        location,
        title,
        description,
        immediate_actions,
        witnesses,
        injury_occurred,
        injury_description,
        medical_attention_required,
        medical_attention_details,
        family_notified,
        external_report_required,
        follow_up_required,
        status,
        reported_by,
        metadata
      )
      VALUES (
        gen_random_uuid(),
        $1,  -- residence_id
        $2,  -- resident_id
        $3,  -- unit_id
        LPAD(nextval('incident_number_seq')::text, 8, '0'),
        $4,  -- incident_type
        $5,  -- severity
        $6,  -- occurred_at
        $7,  -- location
        $8,  -- title
        $9,  -- description
        $10, -- immediate_actions
        $11, -- witnesses
        $12, -- injury_occurred
        $13, -- injury_description
        $14, -- medical_attention_required
        $15, -- medical_attention_details
        $16, -- family_notified
        $17, -- external_report_required
        $18, -- follow_up_required
        'OPEN',
        $19, -- reported_by
        COALESCE($20::jsonb, '{}'::jsonb)
      )
      RETURNING
        id,
        residence_id,
        resident_id,
        unit_id,
        incident_number,
        incident_type,
        severity,
        occurred_at,
        location,
        title,
        description,
        immediate_actions,
        witnesses,
        injury_occurred,
        injury_description,
        medical_attention_required,
        medical_attention_details,
        family_notified,
        external_report_required,
        external_report_submitted,
        external_report_date,
        status,
        follow_up_required,
        follow_up_notes,
        resolution_notes,
        resolved_at,
        resolved_by,
        reported_by,
        metadata,
        created_at,
        updated_at
    `;

    const params = [
      residenceId,
      residentId ?? null,
      unitId ?? null,
      incidentType,
      severity,
      occurredAt,
      location ?? null,
      title,
      description,
      immediateActions ?? null,
      witnesses ?? null,
      injuryOccurred ?? null,
      injuryDescription ?? null,
      medicalAttentionRequired ?? null,
      medicalAttentionDetails ?? null,
      familyNotified,
      externalReportRequired,
      followUpRequired,
      reportedByEmployeeId,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const { rows } = await db.query<IncidentRow>(insertSql, params);
    const row = rows[0];
    const dto = mapIncidentRowToDto(row);

    // Envoi asynchrone vers MCOP Hub (non bloquant pour la réponse)
    sendIncidentCreated(
      {
        incidentId: dto.id,
        residenceId: dto.residenceId,
        residentId: dto.residentId ?? undefined,
        unitId: dto.unitId ?? undefined,
        incidentNumber: dto.incidentNumber ?? undefined,
        incidentType: dto.incidentType as any,
        severity: dto.severity as any,
        occurredAt: dto.occurredAt,
        location: dto.location ?? undefined,
        title: dto.title,
        description: dto.description,
        reportedByEmployeeId,
        familyNotified: dto.familyNotified ?? false,
      },
      getMcopEnvFromBindings(c.env),
    ).then((result) => {
      if (!result.ok) {
        console.error('[INCIDENTS] MCOP Hub error', result);
      }
    }).catch((err) => {
      console.error('[INCIDENTS] MCOP Hub exception', err);
    });

    return c.json(dto, 201);
  } catch (err) {
    console.error('[INCIDENTS] DB error on insert', err);
    return c.json({ error: 'Failed to create incident' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/incidents  → liste paginée avec filtres
// ------------------------------------------------------------------

incidentsRouter.get('/', async (c) => {
  const db = c.get('db');

  let queryParams;
  try {
    queryParams = listIncidentsQuerySchema.parse(c.req.query());
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
    console.error('[INCIDENTS] Invalid query params', err);
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const {
    residenceId,
    residentId,
    status,
    severity,
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
  if (status) {
    whereClauses.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (severity) {
    whereClauses.push(`severity = $${paramIndex++}`);
    params.push(severity);
  }
  if (from) {
    whereClauses.push(`occurred_at >= $${paramIndex++}::date`);
    params.push(from);
  }
  if (to) {
    whereClauses.push(`occurred_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
    params.push(to);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      unit_id,
      incident_number,
      incident_type,
      severity,
      occurred_at,
      location,
      title,
      description,
      immediate_actions,
      witnesses,
      injury_occurred,
      injury_description,
      medical_attention_required,
      medical_attention_details,
      family_notified,
      external_report_required,
      external_report_submitted,
      external_report_date,
      status,
      follow_up_required,
      follow_up_notes,
      resolution_notes,
      resolved_at,
      resolved_by,
      reported_by,
      metadata,
      created_at,
      updated_at
    FROM incidents
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY occurred_at DESC
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  try {
    const { rows } = await db.query<IncidentRow>(sql, params);
    const items = rows.map(mapIncidentRowToDto);
    return c.json({
      items,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[INCIDENTS] DB error on list', err);
    return c.json({ error: 'Failed to list incidents' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/incidents/:id  → détail d'un incident
// ------------------------------------------------------------------

incidentsRouter.get('/:id', async (c) => {
  const db = c.get('db');

  let params;
  try {
    params = getIncidentParamsSchema.parse(c.req.param());
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
    console.error('[INCIDENTS] Invalid params', err);
    return c.json({ error: 'Invalid incident id' }, 400);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      unit_id,
      incident_number,
      incident_type,
      severity,
      occurred_at,
      location,
      title,
      description,
      immediate_actions,
      witnesses,
      injury_occurred,
      injury_description,
      medical_attention_required,
      medical_attention_details,
      family_notified,
      external_report_required,
      external_report_submitted,
      external_report_date,
      status,
      follow_up_required,
      follow_up_notes,
      resolution_notes,
      resolved_at,
      resolved_by,
      reported_by,
      metadata,
      created_at,
      updated_at
    FROM incidents
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const { rows } = await db.query<IncidentRow>(sql, [params.id]);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Incident not found' }, 404);
    }

    const dto = mapIncidentRowToDto(row);
    return c.json(dto);
  } catch (err) {
    console.error('[INCIDENTS] DB error on getById', err);
    return c.json({ error: 'Failed to fetch incident' }, 500);
  }
});
