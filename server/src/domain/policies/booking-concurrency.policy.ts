/**
 * Phase 1 concurrency contract. MongoDB remains the durable authority; Redis
 * locks alone must never determine whether an appointment or token is allocated.
 */
export const BOOKING_CONCURRENCY_POLICY = {
  slotAllocation: "conditional-persisted-allocation",
  idempotency: "unique-client-key-per-patient-operation",
  paymentProcessing: "unique-provider-event-and-order-reference",
  queueToken: "unique-clinic-local-date-and-sequence",
  queueRegistrationIdempotency: "unique-clinic-key-with-request-fingerprint",
  redisIsAuthoritative: false,
} as const;

export const BOOKING_DEFAULTS = {
  paymentRequired: true,
  appointmentConfirmation: "verified-payment",
  unpaidSlotHoldMinutes: 10,
  slotTimezone: "clinic-configured-timezone",
  queueScope: "clinic-local-date",
  queueTokenReset: "clinic-local-midnight",
  queueOrdering: "arrival-order",
} as const;
