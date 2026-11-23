import type { AppointmentPaymentStatus } from '@/features/patient/services/appointmentService';
import type { PatientAppointment } from '@/shared/types';

export type PaymentPresentation = { title: string; message: string; tone: 'success' | 'warning' | 'error'; confirmed: boolean; retryAvailable: boolean };

export function getPaymentPresentation(appointment: PatientAppointment, payment: AppointmentPaymentStatus | null): PaymentPresentation {
  const confirmed = appointment.status === 'CONFIRMED' && payment?.appointmentStatus === 'CONFIRMED' && payment.paymentStatus === 'SUCCEEDED';
  if (confirmed) return { title: 'Payment completed · Appointment confirmed', message: 'The server confirms successful payment and a confirmed appointment.', tone: 'success', confirmed: true, retryAvailable: false };
  if (payment?.refundReviewStatus === 'PENDING_REVIEW') return { title: 'Payment captured · Review pending', message: 'Payment was captured after cancellation or hold expiry. Manual refund review is pending; the appointment is not confirmed.', tone: 'warning', confirmed: false, retryAvailable: false };
  if (payment?.paymentStatus === 'SUCCEEDED') return { title: 'Payment received · Appointment not confirmed', message: 'The server reports captured payment but has not confirmed this appointment. Refresh status or contact the clinic before retrying.', tone: 'warning', confirmed: false, retryAvailable: false };
  if (payment?.paymentStatus === 'FAILED') return { title: 'Payment failed', message: appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? 'The server reports a failed payment. You can retry while this payment hold remains active.' : 'The server reports a failed payment. This appointment is not currently payable.', tone: 'error', confirmed: false, retryAvailable: appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired };
  if (appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired) return { title: 'Payment hold expired', message: 'The appointment is not confirmed and this hold can no longer be paid. Start a new booking to request another time.', tone: 'warning', confirmed: false, retryAvailable: false };
  if (appointment.status === 'PENDING_PAYMENT') return { title: 'Payment pending · Appointment not confirmed', message: payment ? 'Payment has not been confirmed by the server yet. Refresh the status or continue secure checkout while the hold is active.' : 'Payment status is not available yet. Refresh the status before retrying checkout.', tone: 'warning', confirmed: false, retryAvailable: !appointment.holdExpired };
  return { title: `Appointment ${appointment.status.toLowerCase().replaceAll('_', ' ')}`, message: payment?.paymentStatus ? `The server reports payment status ${payment.paymentStatus.toLowerCase().replaceAll('_', ' ')}.` : 'Payment status is not available.', tone: 'warning', confirmed: false, retryAvailable: false };
}
