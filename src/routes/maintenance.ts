// src/routes/maintenance.ts

import { Hono } from 'hono';
import { z } from 'zod';
import {
  sendMaintenanceTicketCreated,
  sendMaintenanceTicketStatusChanged,
  sendMaintenanceTicketCompleted,
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

export const maintenanceRouter = new Hono<AppEnv>();

// ------------------------------------------------------------------
// Zod schemas
// ------------------------------------------------------------------

const createMaintenanceTicketSchema = z.object({
  residenceId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),

  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'HVAC',
    'APPLIANCE',
    'STRUCTURAL',
    'SAFETY',
    'CLEANING',
    'GROUNDS',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']).default('NORMAL'),

  title: z.string().min(3).max(200),
  description: z.string().min(3),
  location: z.string().max(200).optional(),

  reportedByEmployeeId: z.string().uuid().optional(),
  reportedByResidentId: z.string().uuid().optional(),

  scheduledDate: z.string().optional(), // YYYY-MM-DD
  estimatedDurationMinutes: z.number().int().min(1).optional(),
  estimatedCost: z.number().min(0).optional(),

  photos: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateMaintenanceTicketSchema = z.object({
  status: z.enum([
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
  ]).optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  assignedVendorId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']).optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  actualCost: z.number().min(0).optional(),
  partsUsed: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    cost: z.number().min(0).optional(),
  })).optional(),
});

const completeMaintenanceTicketSchema = z.object({
  completedByEmployeeId: z.string().uuid(),
  resolutionNotes: z.string().min(3),
  actualCost: z.number().min(0).optional(),
  actualDurationMinutes: z.number().int().min(1).optional(),
  partsUsed: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    cost: z.number().min(0).optional(),
  })).optional(),
  photos: z.array(z.string().url()).optional(),
});

const listMaintenanceTicketsQuerySchema = z.object({
  residenceId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'HVAC',
    'APPLIANCE',
    'STRUCTURAL',
    'SAFETY',
    'CLEANING',
    'GROUNDS',
    'OTHER',
  ]).optional(),
  status: z.enum([
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
  ]).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY']).optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const getTicketParamsSchema = z.object({
  id: z.string().uuid(),
});

// ------------------------------------------------------------------
// Types de lignes / DTO
// ------------------------------------------------------------------

type MaintenanceTicketRow = {
  id: string;
  ticket_number: string | null;
  residence_id: string;
  unit_id: string | null;
  equipment_id: string | null;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  location: string | null;
  reported_by_employee_id: string | null;
  reported_by_resident_id: string | null;
  assigned_employee_id: string | null;
  assigned_vendor_id: string | null;
  scheduled_date: string | null;
  estimated_duration_minutes: number | null;
  estimated_cost: number | null;
  actual_duration_minutes: number | null;
  actual_cost: number | null;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  completed_by_employee_id: string | null;
  resolution_notes: string | null;
  parts_used: any[] | null;
  photos: string[] | null;
  work_notes: string | null;
  metadata: Record<string, any> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type MaintenanceTicketDto = {
  id: string;
  ticketNumber?: string | null;
  residenceId: string;
  unitId?: string | null;
  equipmentId?: string | null;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  location?: string | null;
  reportedByEmployeeId?: string | null;
  reportedByResidentId?: string | null;
  assignedEmployeeId?: string | null;
  assignedVendorId?: string | null;
  scheduledDate?: string | null;
  estimatedDurationMinutes?: number | null;
  estimatedCost?: number | null;
  actualDurationMinutes?: number | null;
  actualCost?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByEmployeeId?: string | null;
  resolutionNotes?: string | null;
  partsUsed?: any[] | null;
  photos?: string[] | null;
  workNotes?: string | null;
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

function mapTicketRowToDto(row: MaintenanceTicketRow): MaintenanceTicketDto {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    residenceId: row.residence_id,
    unitId: row.unit_id,
    equipmentId: row.equipment_id,
    category: row.category,
    priority: row.priority,
    status: row.status,
    title: row.title,
    description: row.description,
    location: row.location,
    reportedByEmployeeId: row.reported_by_employee_id,
    reportedByResidentId: row.reported_by_resident_id,
    assignedEmployeeId: row.assigned_employee_id,
    assignedVendorId: row.assigned_vendor_id,
    scheduledDate: row.scheduled_date,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    estimatedCost: row.estimated_cost,
    actualDurationMinutes: row.actual_duration_minutes,
    actualCost: row.actual_cost,
    startedAt: toIso(row.started_at),
    completedAt: toIso(row.completed_at),
    completedByEmployeeId: row.completed_by_employee_id,
    resolutionNotes: row.resolution_notes,
    partsUsed: row.parts_used,
    photos: row.photos,
    workNotes: row.work_notes,
    metadata: row.metadata,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

// ------------------------------------------------------------------
// Helper: Get McopEnv from bindings
// ------------------------------------------------------------------

function getMcopEnvFromBindings(bindings: Bindings): McopEnv {
  return {
    MCOP_HUB_URL: bindings.MCOP_HUB_URL,
    MCOP_HUB_TOKEN: bindings.MCOP_HUB_TOKEN,
  };
}

// ------------------------------------------------------------------
// POST /api/maintenance → création d'un ticket
// ------------------------------------------------------------------

maintenanceRouter.post('/', async (c) => {
  const db = c.get('db');

  let data;
  try {
    const body = await c.req.json();
    data = createMaintenanceTicketSchema.parse(body);
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
    console.error('[MAINTENANCE] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const {
    residenceId,
    unitId,
    equipmentId,
    category,
    priority = 'NORMAL',
    title,
    description,
    location,
    reportedByEmployeeId,
    reportedByResidentId,
    scheduledDate,
    estimatedDurationMinutes,
    estimatedCost,
    photos,
    metadata,
  } = data;

  try {
    const insertSql = `
      INSERT INTO maintenance_tickets (
        id,
        ticket_number,
        residence_id,
        unit_id,
        equipment_id,
        category,
        priority,
        status,
        title,
        description,
        location,
        reported_by_employee_id,
        reported_by_resident_id,
        scheduled_date,
        estimated_duration_minutes,
        estimated_cost,
        photos,
        metadata
      )
      VALUES (
        gen_random_uuid(),
        'MT-' || LPAD(nextval('maintenance_ticket_number_seq')::text, 6, '0'),
        $1,
        $2,
        $3,
        $4,
        $5,
        'OPEN',
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        COALESCE($15::jsonb, '{}'::jsonb)
      )
      RETURNING
        id,
        ticket_number,
        residence_id,
        unit_id,
        equipment_id,
        category,
        priority,
        status,
        title,
        description,
        location,
        reported_by_employee_id,
        reported_by_resident_id,
        assigned_employee_id,
        assigned_vendor_id,
        scheduled_date,
        estimated_duration_minutes,
        estimated_cost,
        actual_duration_minutes,
        actual_cost,
        started_at,
        completed_at,
        completed_by_employee_id,
        resolution_notes,
        parts_used,
        photos,
        work_notes,
        metadata,
        created_at,
        updated_at
    `;

    const params = [
      residenceId,
      unitId ?? null,
      equipmentId ?? null,
      category,
      priority,
      title,
      description,
      location ?? null,
      reportedByEmployeeId ?? null,
      reportedByResidentId ?? null,
      scheduledDate ?? null,
      estimatedDurationMinutes ?? null,
      estimatedCost ?? null,
      photos ?? null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const { rows } = await db.query<MaintenanceTicketRow>(insertSql, params);
    const row = rows[0];
    const dto = mapTicketRowToDto(row);

    // Envoi asynchrone vers MCOP Hub (non bloquant)
    sendMaintenanceTicketCreated(
      {
        ticketId: dto.id,
        ticketNumber: dto.ticketNumber,
        residenceId: dto.residenceId,
        category: dto.category as any,
        priority: dto.priority as any,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        reportedByEmployeeId: dto.reportedByEmployeeId,
        reportedByResidentId: dto.reportedByResidentId,
        createdAt: dto.createdAt,
      },
      getMcopEnvFromBindings(c.env),
    ).then((result) => {
      if (!result.ok) {
        console.error('[MAINTENANCE] MCOP Hub error', result);
      }
    }).catch((err) => {
      console.error('[MAINTENANCE] MCOP Hub exception', err);
    });

    return c.json(dto, 201);
  } catch (err) {
    console.error('[MAINTENANCE] DB error on insert', err);
    return c.json({ error: 'Failed to create maintenance ticket' }, 500);
  }
});

// ------------------------------------------------------------------
// PATCH /api/maintenance/:id → mise à jour d'un ticket
// ------------------------------------------------------------------

maintenanceRouter.patch('/:id', async (c) => {
  const db = c.get('db');

  let ticketId;
  try {
    const params = getTicketParamsSchema.parse(c.req.param());
    ticketId = params.id;
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
    return c.json({ error: 'Invalid ticket id' }, 400);
  }

  let data;
  try {
    const body = await c.req.json();
    data = updateMaintenanceTicketSchema.parse(body);
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
    console.error('[MAINTENANCE] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  try {
    // Récupérer le statut précédent si on change le statut
    let previousStatus: string | undefined;
    if (data.status) {
      const prevResult = await db.query<{ status: string }>(
        'SELECT status FROM maintenance_tickets WHERE id = $1',
        [ticketId]
      );
      previousStatus = prevResult.rows[0]?.status;
      if (!previousStatus) {
        return c.json({ error: 'Maintenance ticket not found' }, 404);
      }
    }

    // Build update fields - only include non-null values
    // This avoids complex CASE/COALESCE that break with parameterized queries
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);

      if (data.status === 'IN_PROGRESS') {
        updates.push(`started_at = COALESCE(started_at, NOW())`);
      }
    }
    if (data.assignedEmployeeId) {
      updates.push(`assigned_employee_id = $${paramIndex++}`);
      params.push(data.assignedEmployeeId);
    }
    if (data.assignedVendorId) {
      updates.push(`assigned_vendor_id = $${paramIndex++}`);
      params.push(data.assignedVendorId);
    }
    if (data.priority) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(data.priority);
    }
    if (data.scheduledDate) {
      updates.push(`scheduled_date = $${paramIndex++}`);
      params.push(data.scheduledDate);
    }
    if (data.notes) {
      updates.push(`work_notes = COALESCE(work_notes, '') || $${paramIndex++}`);
      params.push('\n' + data.notes);
    }
    if (data.actualCost !== undefined) {
      updates.push(`actual_cost = $${paramIndex++}`);
      params.push(data.actualCost);
    }
    if (data.partsUsed) {
      updates.push(`parts_used = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(data.partsUsed));
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = NOW()');
    params.push(ticketId);

    const updateSql = `
      UPDATE maintenance_tickets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        ticket_number,
        residence_id,
        unit_id,
        equipment_id,
        category,
        priority,
        status,
        title,
        description,
        location,
        reported_by_employee_id,
        reported_by_resident_id,
        assigned_employee_id,
        assigned_vendor_id,
        scheduled_date,
        estimated_duration_minutes,
        estimated_cost,
        actual_duration_minutes,
        actual_cost,
        started_at,
        completed_at,
        completed_by_employee_id,
        resolution_notes,
        parts_used,
        photos,
        work_notes,
        metadata,
        created_at,
        updated_at
    `;

    const { rows } = await db.query<MaintenanceTicketRow>(updateSql, params);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Maintenance ticket not found' }, 404);
    }

    const dto = mapTicketRowToDto(row);

    // Envoi status_changed vers MCOP Hub si le statut a changé
    if (data.status && previousStatus && previousStatus !== data.status) {
      sendMaintenanceTicketStatusChanged(
        {
          ticketId: dto.id,
          ticketNumber: dto.ticketNumber ?? undefined,
          residenceId: dto.residenceId,
          previousStatus,
          newStatus: data.status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
          changedAt: dto.updatedAt,
          assignedEmployeeId: dto.assignedEmployeeId ?? undefined,
          assignedVendorId: dto.assignedVendorId ?? undefined,
        },
        getMcopEnvFromBindings(c.env),
      ).then((result) => {
        if (!result.ok) {
          console.error('[MAINTENANCE] MCOP Hub error on status_changed', result);
        }
      }).catch((err) => {
        console.error('[MAINTENANCE] MCOP Hub exception on status_changed', err);
      });
    }

    return c.json(dto);
  } catch (err) {
    console.error('[MAINTENANCE] DB error on update', err);
    return c.json({ error: 'Failed to update maintenance ticket' }, 500);
  }
});

// ------------------------------------------------------------------
// POST /api/maintenance/:id/complete → compléter un ticket
// ------------------------------------------------------------------

maintenanceRouter.post('/:id/complete', async (c) => {
  const db = c.get('db');

  let ticketId;
  try {
    const params = getTicketParamsSchema.parse(c.req.param());
    ticketId = params.id;
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
    return c.json({ error: 'Invalid ticket id' }, 400);
  }

  let data;
  try {
    const body = await c.req.json();
    data = completeMaintenanceTicketSchema.parse(body);
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
    console.error('[MAINTENANCE] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const {
    completedByEmployeeId,
    resolutionNotes,
    actualCost,
    actualDurationMinutes,
    partsUsed,
    photos,
  } = data;

  try {
    // Build dynamic updates to avoid COALESCE with params (Neon driver issue)
    const updates: string[] = [
      "status = 'COMPLETED'",
      'completed_at = NOW()',
      'updated_at = NOW()',
    ];
    const params: any[] = [];
    let paramIndex = 1;

    // Required fields
    updates.push(`completed_by_employee_id = $${paramIndex++}`);
    params.push(completedByEmployeeId);

    updates.push(`resolution_notes = $${paramIndex++}`);
    params.push(resolutionNotes);

    // Optional fields - only add if provided
    if (actualCost !== undefined) {
      updates.push(`actual_cost = $${paramIndex++}`);
      params.push(actualCost);
    }
    if (actualDurationMinutes !== undefined) {
      updates.push(`actual_duration_minutes = $${paramIndex++}`);
      params.push(actualDurationMinutes);
    }
    if (partsUsed) {
      updates.push(`parts_used = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(partsUsed));
    }
    if (photos) {
      updates.push(`photos = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(photos));
    }

    params.push(ticketId);

    const updateSql = `
      UPDATE maintenance_tickets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND status != 'COMPLETED' AND status != 'CANCELLED'
      RETURNING
        id,
        ticket_number,
        residence_id,
        unit_id,
        equipment_id,
        category,
        priority,
        status,
        title,
        description,
        location,
        reported_by_employee_id,
        reported_by_resident_id,
        assigned_employee_id,
        assigned_vendor_id,
        scheduled_date,
        estimated_duration_minutes,
        estimated_cost,
        actual_duration_minutes,
        actual_cost,
        started_at,
        completed_at,
        completed_by_employee_id,
        resolution_notes,
        parts_used,
        photos,
        work_notes,
        metadata,
        created_at,
        updated_at
    `;

    const { rows } = await db.query<MaintenanceTicketRow>(updateSql, params);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Maintenance ticket not found or already completed/cancelled' }, 404);
    }

    const dto = mapTicketRowToDto(row);

    // Envoi asynchrone vers MCOP Hub (non bloquant)
    sendMaintenanceTicketCompleted(
      {
        ticketId: dto.id,
        ticketNumber: dto.ticketNumber,
        residenceId: dto.residenceId,
        category: dto.category,
        priority: dto.priority,
        title: dto.title,
        completedByEmployeeId: dto.completedByEmployeeId,
        resolutionNotes: dto.resolutionNotes,
        actualCost: dto.actualCost,
        actualDurationMinutes: dto.actualDurationMinutes,
        completedAt: dto.completedAt,
      },
      getMcopEnvFromBindings(c.env),
    ).then((result) => {
      if (!result.ok) {
        console.error('[MAINTENANCE] MCOP Hub error on complete', result);
      }
    }).catch((err) => {
      console.error('[MAINTENANCE] MCOP Hub exception on complete', err);
    });

    return c.json(dto);
  } catch (err) {
    console.error('[MAINTENANCE] DB error on complete', err);
    return c.json({ error: 'Failed to complete maintenance ticket' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/maintenance → liste paginée avec filtres
// ------------------------------------------------------------------

maintenanceRouter.get('/', async (c) => {
  const db = c.get('db');

  let queryParams;
  try {
    queryParams = listMaintenanceTicketsQuerySchema.parse(c.req.query());
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
    console.error('[MAINTENANCE] Invalid query params', err);
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const {
    residenceId,
    unitId,
    equipmentId,
    category,
    status,
    priority,
    assignedEmployeeId,
    from,
    to,
    limit,
    offset,
  } = queryParams;

  const whereClauses: string[] = ['residence_id = $1'];
  const params: any[] = [residenceId];
  let paramIndex = 2;

  if (unitId) {
    whereClauses.push(`unit_id = $${paramIndex++}`);
    params.push(unitId);
  }
  if (equipmentId) {
    whereClauses.push(`equipment_id = $${paramIndex++}`);
    params.push(equipmentId);
  }
  if (category) {
    whereClauses.push(`category = $${paramIndex++}`);
    params.push(category);
  }
  if (status) {
    whereClauses.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (priority) {
    whereClauses.push(`priority = $${paramIndex++}`);
    params.push(priority);
  }
  if (assignedEmployeeId) {
    whereClauses.push(`assigned_employee_id = $${paramIndex++}`);
    params.push(assignedEmployeeId);
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
      ticket_number,
      residence_id,
      unit_id,
      equipment_id,
      category,
      priority,
      status,
      title,
      description,
      location,
      reported_by_employee_id,
      reported_by_resident_id,
      assigned_employee_id,
      assigned_vendor_id,
      scheduled_date,
      estimated_duration_minutes,
      estimated_cost,
      actual_duration_minutes,
      actual_cost,
      started_at,
      completed_at,
      completed_by_employee_id,
      resolution_notes,
      parts_used,
      photos,
      work_notes,
      metadata,
      created_at,
      updated_at
    FROM maintenance_tickets
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY
      CASE priority
        WHEN 'EMERGENCY' THEN 1
        WHEN 'URGENT' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'NORMAL' THEN 4
        WHEN 'LOW' THEN 5
      END,
      created_at DESC
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  try {
    const { rows } = await db.query<MaintenanceTicketRow>(sql, params);
    const items = rows.map(mapTicketRowToDto);
    return c.json({
      items,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[MAINTENANCE] DB error on list', err);
    return c.json({ error: 'Failed to list maintenance tickets' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/maintenance/:id → détail d'un ticket
// ------------------------------------------------------------------

maintenanceRouter.get('/:id', async (c) => {
  const db = c.get('db');

  let params;
  try {
    params = getTicketParamsSchema.parse(c.req.param());
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
    console.error('[MAINTENANCE] Invalid params', err);
    return c.json({ error: 'Invalid ticket id' }, 400);
  }

  const sql = `
    SELECT
      id,
      ticket_number,
      residence_id,
      unit_id,
      equipment_id,
      category,
      priority,
      status,
      title,
      description,
      location,
      reported_by_employee_id,
      reported_by_resident_id,
      assigned_employee_id,
      assigned_vendor_id,
      scheduled_date,
      estimated_duration_minutes,
      estimated_cost,
      actual_duration_minutes,
      actual_cost,
      started_at,
      completed_at,
      completed_by_employee_id,
      resolution_notes,
      parts_used,
      photos,
      work_notes,
      metadata,
      created_at,
      updated_at
    FROM maintenance_tickets
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const { rows } = await db.query<MaintenanceTicketRow>(sql, [params.id]);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Maintenance ticket not found' }, 404);
    }

    const dto = mapTicketRowToDto(row);
    return c.json(dto);
  } catch (err) {
    console.error('[MAINTENANCE] DB error on getById', err);
    return c.json({ error: 'Failed to fetch maintenance ticket' }, 500);
  }
});
