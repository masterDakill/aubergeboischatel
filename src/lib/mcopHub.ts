// src/lib/mcopHub.ts

import type {
  McopEventType,
  McopEventPayload,
  McopOutboundEvent,
  McopObservationCreatedPayload,
  McopObservationUpdatedPayload,
  McopIncidentCreatedPayload,
  McopCareTaskCreatedPayload,
  McopCareTaskStatusChangedPayload,
  McopCareTaskCompletedPayload,
  McopCareExecutionLoggedPayload,
  McopSensorAlertTriggeredPayload,
  McopInvoiceSentPayload,
  McopPaymentCompletedPayload,
  McopStaffClockInPayload,
  McopMaintenanceTicketCreatedPayload,
  McopMaintenanceTicketStatusChangedPayload,
  McopMaintenanceTicketCompletedPayload,
} from '../types/mcop-events';

// Adapte ce type à ton type Env/Hono Bindings
export interface McopEnv {
  MCOP_HUB_URL: string;
  MCOP_HUB_TOKEN?: string;
}

export interface McopHubResult {
  ok: boolean;
  attempts: number;
  status?: number;
  error?: string;
}

interface SendOptions {
  timeoutMs?: number;
  sourceVersion?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 2; // tentative initiale + 1 retry
const INITIAL_BACKOFF_MS = 300;

// Helper backoff
async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(env: McopEnv): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (env.MCOP_HUB_TOKEN) {
    headers.Authorization = `Bearer ${env.MCOP_HUB_TOKEN}`;
  }

  return headers;
}

async function postWithRetry(
  url: string,
  body: unknown,
  env: McopEnv,
  options?: SendOptions
): Promise<McopHubResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let attempts = 0;
  let lastError: string | undefined;
  let lastStatus: number | undefined;

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(env),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      lastStatus = response.status;

      if (response.ok) {
        return { ok: true, attempts, status: response.status };
      }

      // Statut HTTP non-2xx = erreur logique du hub
      lastError = `HTTP ${response.status} - ${await response.text()}`;
      console.error('[MCOP_HUB] Error response:', lastError);

    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error('[MCOP_HUB] Network/timeout error:', lastError);
    }

    if (attempts < MAX_ATTEMPTS) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempts - 1);
      await sleep(backoff);
    }
  }

  // Non-bloquant : on log mais on ne throw pas
  return {
    ok: false,
    attempts,
    status: lastStatus,
    error: lastError,
  };
}

/**
 * Envoi générique type-safe vers le MCOP Hub
 */
export async function sendToMcopHub<
  TType extends McopEventType,
>(
  eventType: TType,
  payload: McopEventPayload<TType>,
  env: McopEnv,
  options?: SendOptions
): Promise<McopHubResult> {
  if (!env.MCOP_HUB_URL) {
    console.warn('[MCOP_HUB] MCOP_HUB_URL is not defined, skipping event:', eventType);
    return { ok: false, attempts: 0, error: 'MCOP_HUB_URL missing' };
  }

  const event: McopOutboundEvent<TType> = {
    type: eventType,
    source: 'CODEX',
    source_version: options?.sourceVersion,
    received_at: new Date().toISOString(),
    payload,
  };

  // Append /api/events to the hub URL
  const eventsUrl = env.MCOP_HUB_URL.replace(/\/$/, '') + '/api/events';
  const result = await postWithRetry(eventsUrl, event, env, options);

  if (result.ok) {
    console.log(`[MCOP_HUB] Event sent: ${eventType} (${result.attempts} attempt(s))`);
  }

  return result;
}

/**
 * Envoi batch : tableau d'événements déjà typés
 * On envoie un array d'enveloppes vers le même endpoint.
 * (Tu peux adapter côté hub pour accepter ce format.)
 */
export async function sendBatchToMcopHub<
  TType extends McopEventType,
>(
  events: Array<{
    type: TType;
    payload: McopEventPayload<TType>;
  }>,
  env: McopEnv,
  options?: SendOptions
): Promise<McopHubResult> {
  if (!env.MCOP_HUB_URL) {
    console.warn('[MCOP_HUB] MCOP_HUB_URL is not defined, skipping batch');
    return { ok: false, attempts: 0, error: 'MCOP_HUB_URL missing' };
  }

  const enveloped = events.map<McopOutboundEvent<TType>>((e) => ({
    type: e.type,
    source: 'CODEX',
    source_version: options?.sourceVersion,
    received_at: new Date().toISOString(),
    payload: e.payload,
  }));

  return postWithRetry(env.MCOP_HUB_URL, enveloped, env, options);
}

/**
 * Helper de test : permet de vérifier la connectivité au hub.
 * On envoie un "dummy event" minimal.
 */
export async function testMcopHubConnection(
  env: McopEnv,
  options?: SendOptions
): Promise<McopHubResult> {
  // Ici on réutilise le mécanisme standard avec un event technique.
  // Tu pourras créer un handler spécifique côté hub si besoin.
  const payload = {
    message: 'ping from CODEX',
    timestamp: new Date().toISOString(),
  };

  return postWithRetry(
    env.MCOP_HUB_URL,
    {
      type: 'system.ping',
      source: 'CODEX',
      received_at: new Date().toISOString(),
      payload,
    },
    env,
    options
  );
}

// -------------------------------------------------------------------
// Helpers spécialisés par type d'événement
// -------------------------------------------------------------------

export function sendObservationCreated(
  payload: McopObservationCreatedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('observation.created', payload, env, options);
}

export function sendObservationUpdated(
  payload: McopObservationUpdatedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('observation.updated', payload, env, options);
}

export function sendIncidentCreated(
  payload: McopIncidentCreatedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('incident.created', payload, env, options);
}

export function sendCareTaskCreated(
  payload: McopCareTaskCreatedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('care_task.created', payload, env, options);
}

export function sendCareTaskStatusChanged(
  payload: McopCareTaskStatusChangedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('care_task.status_changed', payload, env, options);
}

export function sendCareTaskCompleted(
  payload: McopCareTaskCompletedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('care_task.completed', payload, env, options);
}

export function sendCareExecutionLogged(
  payload: McopCareExecutionLoggedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('care_execution.logged', payload, env, options);
}

export function sendSensorAlertTriggered(
  payload: McopSensorAlertTriggeredPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('sensor_alert.triggered', payload, env, options);
}

export function sendInvoiceSent(
  payload: McopInvoiceSentPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('invoice.sent', payload, env, options);
}

export function sendPaymentCompleted(
  payload: McopPaymentCompletedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('payment.completed', payload, env, options);
}

export function sendStaffClockIn(
  payload: McopStaffClockInPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('staff.clock_in', payload, env, options);
}

export function sendMaintenanceTicketCreated(
  payload: McopMaintenanceTicketCreatedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('maintenance_ticket.created', payload, env, options);
}

export function sendMaintenanceTicketStatusChanged(
  payload: McopMaintenanceTicketStatusChangedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('maintenance_ticket.status_changed', payload, env, options);
}

export function sendMaintenanceTicketCompleted(
  payload: McopMaintenanceTicketCompletedPayload,
  env: McopEnv,
  options?: SendOptions
) {
  return sendToMcopHub('maintenance_ticket.completed', payload, env, options);
}
