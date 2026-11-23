import { DetailList } from '@/components/molecules/DetailList';
import { Notice } from '@/components/atoms/Notice';
import type { AppointmentPaymentStatus } from '@/features/patient/services/appointmentService';
import { getPaymentPresentation } from '@/features/patient/components/paymentPresentation';
import type { PatientAppointment } from '@/shared/types';

export function PatientPaymentSummary({ appointment, payment, amountMinor, compact = false }: { appointment: PatientAppointment; payment: AppointmentPaymentStatus | null; amountMinor?: number; compact?: boolean }) {
  const status = getPaymentPresentation(appointment, payment);
  const amount = amountMinor ?? appointment.feeAmountMinor;
  return <div className="grid gap-4">
    <DetailList items={[
      ...(!compact ? [
        ['Appointment reference', appointment.appointmentId] as [string, string],
        ['Clinic', appointment.clinicName] as [string, string],
        ['Doctor', appointment.doctorName] as [string, string],
        ['Appointment date', appointment.localDate] as [string, string],
        ['Appointment time', `${appointment.localStartTime}–${appointment.localEndTime} (${appointment.timeZone})`] as [string, string],
        ['Consultation fee', new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(appointment.feeAmountMinor / 100)] as [string, string],
      ] : []),
      ['Payment amount', new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(amount / 100)],
      ['Appointment status', (payment?.appointmentStatus ?? appointment.status).replaceAll('_', ' ')],
      ['Payment status', payment?.paymentStatus.replaceAll('_', ' ') ?? 'Not checked'],
      ...(payment?.refundReviewStatus && payment.refundReviewStatus !== 'NOT_REQUIRED' ? [['Refund review', payment.refundReviewStatus.replaceAll('_', ' ')] as [string, string]] : []),
    ]} />
    <Notice tone={status.tone}><strong>{status.title}</strong><span className="block mt-1">{status.message}</span></Notice>
  </div>;
}
