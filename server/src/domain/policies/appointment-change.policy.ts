/** User-approved Phase 6 rules. Cutoff is measured against the appointment's UTC start. */
export const APPOINTMENT_CHANGE_POLICY = {
  cutoffHours: 24,
  maximumReschedules: 1,
  paidCancellationRefund: "MANUAL_REVIEW_NO_AUTOMATIC_REFUND",
  rescheduleScope: "SAME_CLINIC_AND_DOCTOR",
} as const;
