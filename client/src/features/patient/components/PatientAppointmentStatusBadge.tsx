import type { PatientAppointment } from '@/shared/types';

export function PatientAppointmentStatusBadge({ appointment }: { appointment: PatientAppointment }) {
  const label = appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'HOLD EXPIRED' : appointment.status.replaceAll('_', ' ');
  const style = appointment.status === 'CONFIRMED' ? 'bg-success-soft text-success'
    : appointment.status === 'CANCELLED' ? 'bg-danger-soft text-danger'
    : appointment.status === 'COMPLETED' ? 'bg-info-soft text-info'
    : appointment.holdExpired ? 'bg-page text-text-muted' : 'bg-warning-soft text-warning';

  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}>{label}</span>;
}
