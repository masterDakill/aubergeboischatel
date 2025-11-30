// src/types/mcop-events.ts

export type McopEventType =
  | 'observation.created'
  | 'observation.updated'
  | 'incident.created'
  | 'care_task.created'
  | 'care_task.status_changed'
  | 'care_task.completed'
  | 'care_execution.logged'
  | 'sensor_alert.triggered'
  | 'invoice.sent'
  | 'payment.completed'
  | 'staff.clock_in'
  | 'maintenance_ticket.created'
  | 'maintenance_ticket.status_changed'
  | 'maintenance_ticket.completed';

// --- Payloads détaillés par type d'événement ---

export interface McopObservationCreatedPayload {
  observationId: string;
  residentId: string;
  residenceId: string;
  authorEmployeeId?: string;
  observationType:
    | 'CLINICAL'
    | 'BEHAVIORAL'
    | 'SOCIAL'
    | 'NUTRITION'
    | 'MOBILITY'
    | 'GENERAL';
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  title?: string;
  content: string;
  createdAt: string; // ISO
  visibleToFamily: boolean;
}

// Snapshot des champs clés d'une observation (pour diff previous/current)
export interface ObservationSnapshot {
  observationType:
    | 'CLINICAL'
    | 'BEHAVIORAL'
    | 'SOCIAL'
    | 'NUTRITION'
    | 'MOBILITY'
    | 'GENERAL';
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  title?: string;
  content: string;
  visibleToFamily: boolean;
  requiresFollowUp: boolean;
  followUpNotes?: string;
  followUpCompleted: boolean;
  vitalSigns?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface McopObservationUpdatedPayload {
  observationId: string;
  residentId: string;
  residenceId: string;
  updatedAt: string; // ISO
  changedFields: string[]; // Liste des champs modifiés
  previous: Partial<ObservationSnapshot>;
  current: Partial<ObservationSnapshot>;
}

export interface McopIncidentCreatedPayload {
  incidentId: string;
  residenceId: string;
  residentId?: string;
  unitId?: string;
  incidentNumber?: string;
  incidentType:
    | 'FALL'
    | 'MEDICATION_ERROR'
    | 'BEHAVIOR'
    | 'INJURY'
    | 'ELOPEMENT'
    | 'OTHER';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
  occurredAt: string; // ISO
  location?: string;
  title: string;
  description: string;
  reportedByEmployeeId: string;
  familyNotified: boolean;
}

export interface McopCareTaskCreatedPayload {
  careTaskId: string;
  carePlanItemId?: string;
  residentId: string;
  residenceId: string;
  category: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM:SS
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedEmployeeId?: string;
  createdAt: string; // ISO
}

export interface McopCareTaskStatusChangedPayload {
  careTaskId: string;
  carePlanItemId?: string;
  residentId: string;
  residenceId: string;
  category: string;
  title: string;
  previousStatus: string;
  newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'CANCELLED';
  changedAt: string; // ISO
  changedByEmployeeId?: string;
}

export interface McopCareTaskCompletedPayload {
  careTaskId: string;
  carePlanItemId?: string;
  residentId: string;
  residenceId: string;
  category: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM:SS
  status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED';
  completedAt: string; // ISO
  assignedEmployeeId?: string;
  executedByEmployeeId?: string;
}

export interface McopCareExecutionLoggedPayload {
  careExecutionId: string;
  careTaskId: string;
  residentId: string;
  residenceId: string;
  executedByEmployeeId: string;
  startedAt: string; // ISO
  completedAt?: string; // ISO
  status: 'COMPLETED' | 'PARTIAL' | 'REFUSED' | 'UNABLE';
  notes?: string;
  metrics?: Record<string, unknown>;
}

export interface McopSensorAlertTriggeredPayload {
  sensorAlertId: string;
  sensorId: string;
  residenceId: string;
  unitId?: string;
  residentId?: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  triggeredAt: string; // ISO
  triggerValue?: number;
  thresholdValue?: number;
  messageTitle: string;
  messageDescription?: string;
}

export interface McopInvoiceSentPayload {
  invoiceId: string;
  residenceId: string;
  leaseId: string;
  residentId: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  total: number;
  balanceDue: number;
  status: 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE';
}

export interface McopPaymentCompletedPayload {
  paymentId: string;
  residenceId: string;
  paymentNumber?: string;
  leasePartyId?: string;
  payerName?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string; // YYYY-MM-DD
  status: 'COMPLETED' | 'REFUNDED';
}

export interface McopStaffClockInPayload {
  timeEntryId: string;
  employeeId: string;
  residenceId: string;
  shiftAssignmentId?: string;
  entryType: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string; // ISO
  source: 'MANUAL' | 'BIOMETRIC' | 'APP' | 'ADMIN';
}

export interface McopMaintenanceTicketCreatedPayload {
  ticketId: string;
  ticketNumber: string;
  residenceId: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'SAFETY' | 'CLEANING' | 'GROUNDS' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  title: string;
  description: string;
  location?: string;
  reportedByEmployeeId?: string;
  reportedByResidentId?: string;
  createdAt: string; // ISO
}

export interface McopMaintenanceTicketStatusChangedPayload {
  ticketId: string;
  ticketNumber?: string;
  residenceId: string;
  previousStatus: string;
  newStatus: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  changedAt: string; // ISO
  assignedEmployeeId?: string;
  assignedVendorId?: string;
}

export interface McopMaintenanceTicketCompletedPayload {
  ticketId: string;
  ticketNumber?: string;
  residenceId: string;
  category: string;
  priority: string;
  title: string;
  completedByEmployeeId?: string;
  resolutionNotes?: string;
  actualCost?: number;
  actualDurationMinutes?: number;
  completedAt?: string; // ISO
}

// --- Mapping type-safe eventType -> payload ---

export interface McopEventPayloadMap {
  'observation.created': McopObservationCreatedPayload;
  'observation.updated': McopObservationUpdatedPayload;
  'incident.created': McopIncidentCreatedPayload;
  'care_task.created': McopCareTaskCreatedPayload;
  'care_task.status_changed': McopCareTaskStatusChangedPayload;
  'care_task.completed': McopCareTaskCompletedPayload;
  'care_execution.logged': McopCareExecutionLoggedPayload;
  'sensor_alert.triggered': McopSensorAlertTriggeredPayload;
  'invoice.sent': McopInvoiceSentPayload;
  'payment.completed': McopPaymentCompletedPayload;
  'staff.clock_in': McopStaffClockInPayload;
  'maintenance_ticket.created': McopMaintenanceTicketCreatedPayload;
  'maintenance_ticket.status_changed': McopMaintenanceTicketStatusChangedPayload;
  'maintenance_ticket.completed': McopMaintenanceTicketCompletedPayload;
}

export type McopEventPayload<TType extends McopEventType = McopEventType> =
  McopEventPayloadMap[TType];

// Enveloppe standard envoyée au hub
export interface McopOutboundEvent<TType extends McopEventType = McopEventType> {
  type: TType;
  source: 'CODEX';
  source_version?: string;
  received_at: string; // ISO côté CODEX
  payload: McopEventPayload<TType>;
}
