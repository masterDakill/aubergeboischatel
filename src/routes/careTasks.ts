// src/routes/careTasks.ts

import { Hono } from 'hono';
import { z } from 'zod';
import {
  sendCareTaskCreated,
  sendCareTaskStatusChanged,
  sendCareTaskCompleted,
  sendCareExecutionLogged,
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

export const careTasksRouter = new Hono<AppEnv>();

// ------------------------------------------------------------------
// Zod schemas
// ------------------------------------------------------------------

const createCareTaskSchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid(),
  carePlanItemId: z.string().uuid().optional(),

  category: z.enum([
    'HYGIENE',
    'MEDICATION',
    'NUTRITION',
    'MOBILITY',
    'VITALS',
    'SOCIAL',
    'THERAPY',
    'OTHER',
  ]),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),

  scheduledDate: z.string(), // YYYY-MM-DD
  scheduledTime: z.string().optional(), // HH:MM or HH:MM:SS
  durationMinutes: z.number().int().min(1).max(480).optional(),

  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(), // iCal RRULE format

  assignedEmployeeId: z.string().uuid().optional(),
  requiredSkills: z.array(z.string()).optional(),

  metadata: z.record(z.string(), z.any()).optional(),
});

const updateCareTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'SKIPPED', 'CANCELLED']),
  executedByEmployeeId: z.string().uuid().optional(),
  notes: z.string().optional(),
  metrics: z.record(z.string(), z.any()).optional(),
});

const listCareTasksQuerySchema = z.object({
  residenceId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  category: z.enum([
    'HYGIENE',
    'MEDICATION',
    'NUTRITION',
    'MOBILITY',
    'VITALS',
    'SOCIAL',
    'THERAPY',
    'OTHER',
  ]).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'SKIPPED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  scheduledDate: z.string().optional(), // YYYY-MM-DD
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const getCareTaskParamsSchema = z.object({
  id: z.string().uuid(),
});

// ------------------------------------------------------------------
// Types de lignes / DTO
// ------------------------------------------------------------------

type CareTaskRow = {
  id: string;
  residence_id: string;
  resident_id: string;
  care_plan_item_id: string | null;
  category: string;
  title: string;
  description: string | null;
  instructions: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  priority: string;
  status: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  assigned_employee_id: string | null;
  executed_by_employee_id: string | null;
  required_skills: string[] | null;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  completion_notes: string | null;
  completion_metrics: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CareTaskDto = {
  id: string;
  residenceId: string;
  residentId: string;
  carePlanItemId?: string | null;
  category: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  scheduledDate: string;
  scheduledTime?: string | null;
  durationMinutes?: number | null;
  priority: string;
  status: string;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  assignedEmployeeId?: string | null;
  executedByEmployeeId?: string | null;
  requiredSkills?: string[] | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completionNotes?: string | null;
  completionMetrics?: Record<string, any> | null;
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

function mapCareTaskRowToDto(row: CareTaskRow): CareTaskDto {
  return {
    id: row.id,
    residenceId: row.residence_id,
    residentId: row.resident_id,
    carePlanItemId: row.care_plan_item_id,
    category: row.category,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    durationMinutes: row.duration_minutes,
    priority: row.priority,
    status: row.status,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    assignedEmployeeId: row.assigned_employee_id,
    executedByEmployeeId: row.executed_by_employee_id,
    requiredSkills: row.required_skills,
    startedAt: toIso(row.started_at),
    completedAt: toIso(row.completed_at),
    completionNotes: row.completion_notes,
    completionMetrics: row.completion_metrics,
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
// POST /api/care-tasks → création d'une tâche de soin
// ------------------------------------------------------------------

careTasksRouter.post('/', async (c) => {
  const db = c.get('db');

  let data;
  try {
    const body = await c.req.json();
    data = createCareTaskSchema.parse(body);
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
    console.error('[CARE_TASKS] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const {
    residenceId,
    residentId,
    carePlanItemId,
    category,
    title,
    description,
    instructions,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    priority = 'NORMAL',
    isRecurring = false,
    recurrenceRule,
    assignedEmployeeId,
    requiredSkills,
    metadata,
  } = data;

  try {
    const insertSql = `
      INSERT INTO care_tasks (
        id,
        residence_id,
        resident_id,
        care_plan_item_id,
        category,
        title,
        description,
        instructions,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        priority,
        status,
        is_recurring,
        recurrence_rule,
        assigned_employee_id,
        required_skills,
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
        'PENDING',
        $12,
        $13,
        $14,
        $15,
        COALESCE($16::jsonb, '{}'::jsonb)
      )
      RETURNING
        id,
        residence_id,
        resident_id,
        care_plan_item_id,
        category,
        title,
        description,
        instructions,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        priority,
        status,
        is_recurring,
        recurrence_rule,
        assigned_employee_id,
        executed_by_employee_id,
        required_skills,
        started_at,
        completed_at,
        completion_notes,
        completion_metrics,
        metadata,
        created_at,
        updated_at
    `;

    const params = [
      residenceId,
      residentId,
      carePlanItemId ?? null,
      category,
      title,
      description ?? null,
      instructions ?? null,
      scheduledDate,
      scheduledTime ?? null,
      durationMinutes ?? null,
      priority,
      isRecurring,
      recurrenceRule ?? null,
      assignedEmployeeId ?? null,
      requiredSkills ?? null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const { rows } = await db.query<CareTaskRow>(insertSql, params);
    const row = rows[0];
    const dto = mapCareTaskRowToDto(row);

    // Envoi asynchrone vers MCOP Hub (non bloquant)
    sendCareTaskCreated(
      {
        careTaskId: dto.id,
        carePlanItemId: dto.carePlanItemId ?? undefined,
        residentId: dto.residentId,
        residenceId: dto.residenceId,
        category: dto.category,
        title: dto.title,
        scheduledDate: dto.scheduledDate,
        scheduledTime: dto.scheduledTime ?? undefined,
        priority: dto.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
        assignedEmployeeId: dto.assignedEmployeeId ?? undefined,
        createdAt: dto.createdAt,
      },
      getMcopEnvFromBindings(c.env),
    ).then((result) => {
      if (!result.ok) {
        console.error('[CARE_TASKS] MCOP Hub error on create', result);
      }
    }).catch((err) => {
      console.error('[CARE_TASKS] MCOP Hub exception on create', err);
    });

    return c.json(dto, 201);
  } catch (err) {
    console.error('[CARE_TASKS] DB error on insert', err);
    return c.json({ error: 'Failed to create care task' }, 500);
  }
});

// ------------------------------------------------------------------
// PATCH /api/care-tasks/:id/status → mise à jour du statut
// ------------------------------------------------------------------

careTasksRouter.patch('/:id/status', async (c) => {
  const db = c.get('db');

  let taskId;
  try {
    const params = getCareTaskParamsSchema.parse(c.req.param());
    taskId = params.id;
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
    return c.json({ error: 'Invalid task id' }, 400);
  }

  let data;
  try {
    const body = await c.req.json();
    data = updateCareTaskStatusSchema.parse(body);
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
    console.error('[CARE_TASKS] Invalid JSON body', err);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const { status, executedByEmployeeId, notes, metrics } = data;

  try {
    // Récupérer le statut précédent avant mise à jour
    const previousStatusResult = await db.query<{ status: string }>(
      'SELECT status FROM care_tasks WHERE id = $1',
      [taskId]
    );
    const previousStatus = previousStatusResult.rows[0]?.status;

    if (!previousStatus) {
      return c.json({ error: 'Care task not found' }, 404);
    }

    // Determine timestamps to set based on status
    const setStartedAt = status === 'IN_PROGRESS' ? 'NOW()' : 'started_at';
    const setCompletedAt = ['COMPLETED', 'PARTIAL', 'SKIPPED'].includes(status) ? 'NOW()' : 'completed_at';

    // Build SQL with pre-computed timestamp logic (no repeated params)
    const updateSql = `
      UPDATE care_tasks
      SET
        status = $1,
        executed_by_employee_id = COALESCE($2, executed_by_employee_id),
        completion_notes = COALESCE($3, completion_notes),
        completion_metrics = COALESCE($4::jsonb, completion_metrics),
        started_at = COALESCE(started_at, ${setStartedAt === 'NOW()' ? 'NOW()' : 'started_at'}),
        completed_at = ${setCompletedAt === 'NOW()' ? 'NOW()' : 'completed_at'},
        updated_at = NOW()
      WHERE id = $5
      RETURNING
        id,
        residence_id,
        resident_id,
        care_plan_item_id,
        category,
        title,
        description,
        instructions,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        priority,
        status,
        is_recurring,
        recurrence_rule,
        assigned_employee_id,
        executed_by_employee_id,
        required_skills,
        started_at,
        completed_at,
        completion_notes,
        completion_metrics,
        metadata,
        created_at,
        updated_at
    `;

    const params = [
      status,
      executedByEmployeeId ?? null,
      notes ?? null,
      metrics ? JSON.stringify(metrics) : null,
      taskId,
    ];

    const { rows } = await db.query<CareTaskRow>(updateSql, params);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Care task not found' }, 404);
    }

    const dto = mapCareTaskRowToDto(row);

    // Envoi status_changed vers MCOP Hub si le statut a changé
    if (previousStatus !== status) {
      sendCareTaskStatusChanged(
        {
          careTaskId: dto.id,
          carePlanItemId: dto.carePlanItemId ?? undefined,
          residentId: dto.residentId,
          residenceId: dto.residenceId,
          category: dto.category,
          title: dto.title,
          previousStatus,
          newStatus: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'CANCELLED',
          changedAt: dto.updatedAt,
          changedByEmployeeId: executedByEmployeeId ?? undefined,
        },
        getMcopEnvFromBindings(c.env),
      ).then((result) => {
        if (!result.ok) {
          console.error('[CARE_TASKS] MCOP Hub error on status_changed', result);
        }
      }).catch((err) => {
        console.error('[CARE_TASKS] MCOP Hub exception on status_changed', err);
      });
    }

    // Envoi completed vers MCOP Hub si complété
    if (['COMPLETED', 'PARTIAL', 'SKIPPED'].includes(status)) {
      sendCareTaskCompleted(
        {
          careTaskId: dto.id,
          carePlanItemId: dto.carePlanItemId ?? undefined,
          residentId: dto.residentId,
          residenceId: dto.residenceId,
          category: dto.category,
          title: dto.title,
          scheduledDate: dto.scheduledDate,
          scheduledTime: dto.scheduledTime ?? undefined,
          status: status as 'COMPLETED' | 'PARTIAL' | 'SKIPPED',
          completedAt: dto.completedAt!,
          assignedEmployeeId: dto.assignedEmployeeId ?? undefined,
          executedByEmployeeId: dto.executedByEmployeeId ?? undefined,
        },
        getMcopEnvFromBindings(c.env),
      ).then((result) => {
        if (!result.ok) {
          console.error('[CARE_TASKS] MCOP Hub error on completed', result);
        }
      }).catch((err) => {
        console.error('[CARE_TASKS] MCOP Hub exception on completed', err);
      });
    }

    return c.json(dto);
  } catch (err) {
    console.error('[CARE_TASKS] DB error on status update', err);
    return c.json({ error: 'Failed to update care task status' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/care-tasks → liste paginée avec filtres
// ------------------------------------------------------------------

careTasksRouter.get('/', async (c) => {
  const db = c.get('db');

  let queryParams;
  try {
    queryParams = listCareTasksQuerySchema.parse(c.req.query());
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
    console.error('[CARE_TASKS] Invalid query params', err);
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const {
    residenceId,
    residentId,
    assignedEmployeeId,
    category,
    status,
    priority,
    scheduledDate,
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
  if (assignedEmployeeId) {
    whereClauses.push(`assigned_employee_id = $${paramIndex++}`);
    params.push(assignedEmployeeId);
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
  if (scheduledDate) {
    whereClauses.push(`scheduled_date = $${paramIndex++}`);
    params.push(scheduledDate);
  }
  if (from) {
    whereClauses.push(`scheduled_date >= $${paramIndex++}`);
    params.push(from);
  }
  if (to) {
    whereClauses.push(`scheduled_date <= $${paramIndex++}`);
    params.push(to);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      care_plan_item_id,
      category,
      title,
      description,
      instructions,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      priority,
      status,
      is_recurring,
      recurrence_rule,
      assigned_employee_id,
      executed_by_employee_id,
      required_skills,
      started_at,
      completed_at,
      completion_notes,
      completion_metrics,
      metadata,
      created_at,
      updated_at
    FROM care_tasks
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY scheduled_date ASC, scheduled_time ASC NULLS LAST, priority DESC
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  try {
    const { rows } = await db.query<CareTaskRow>(sql, params);
    const items = rows.map(mapCareTaskRowToDto);
    return c.json({
      items,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[CARE_TASKS] DB error on list', err);
    return c.json({ error: 'Failed to list care tasks' }, 500);
  }
});

// ------------------------------------------------------------------
// GET /api/care-tasks/:id → détail d'une tâche
// ------------------------------------------------------------------

careTasksRouter.get('/:id', async (c) => {
  const db = c.get('db');

  let params;
  try {
    params = getCareTaskParamsSchema.parse(c.req.param());
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
    console.error('[CARE_TASKS] Invalid params', err);
    return c.json({ error: 'Invalid care task id' }, 400);
  }

  const sql = `
    SELECT
      id,
      residence_id,
      resident_id,
      care_plan_item_id,
      category,
      title,
      description,
      instructions,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      priority,
      status,
      is_recurring,
      recurrence_rule,
      assigned_employee_id,
      executed_by_employee_id,
      required_skills,
      started_at,
      completed_at,
      completion_notes,
      completion_metrics,
      metadata,
      created_at,
      updated_at
    FROM care_tasks
    WHERE id = $1
    LIMIT 1
  `;

  try {
    const { rows } = await db.query<CareTaskRow>(sql, [params.id]);
    const row = rows[0];

    if (!row) {
      return c.json({ error: 'Care task not found' }, 404);
    }

    const dto = mapCareTaskRowToDto(row);
    return c.json(dto);
  } catch (err) {
    console.error('[CARE_TASKS] DB error on getById', err);
    return c.json({ error: 'Failed to fetch care task' }, 500);
  }
});
