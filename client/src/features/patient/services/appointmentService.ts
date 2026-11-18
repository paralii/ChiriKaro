import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import type { PatientAppointment } from '@/shared/types';

type ApiEnvelope<T> = { data?: T };

export type PaymentOrder = { appointmentId: string; orderId: string; amountMinor: number; currency: string; keyId: string; mode: 'MOCK' | 'RAZORPAY'; status: string };
export type AppointmentPaymentStatus = { appointmentId: string; paymentStatus: string; appointmentStatus: PatientAppointment['status']; refundReviewStatus?: 'NOT_REQUIRED' | 'PENDING_REVIEW' };

export const appointmentService = {
  create: async (input: { listingId: string; date: string; startsAt: string }, idempotencyKey: string) => {
    const response = await http.post<ApiEnvelope<PatientAppointment>>(API_ROUTES.PATIENT.APPOINTMENTS, input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    if (!response.data.data) throw new Error('Appointment hold was not returned.');
    return response.data.data;
  },
  list: async () => {
    const response = await http.get<ApiEnvelope<PatientAppointment[]>>(API_ROUTES.PATIENT.APPOINTMENTS);
    if (!response.data.data) throw new Error('Appointments were not returned.');
    return response.data.data;
  },
  get: async (appointmentId: string) => {
    const response = await http.get<ApiEnvelope<PatientAppointment>>(API_ROUTES.PATIENT.APPOINTMENT_BY_ID(appointmentId));
    if (!response.data.data) throw new Error('Appointment was not returned.');
    return response.data.data;
  },
  createPaymentOrder: async (appointmentId: string) => {
    const response = await http.post<ApiEnvelope<PaymentOrder>>(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_ORDER(appointmentId));
    if (!response.data.data) throw new Error('Payment order was not returned.');
    return response.data.data;
  },
  verifyPayment: async (appointmentId: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const response = await http.post<ApiEnvelope<AppointmentPaymentStatus>>(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_VERIFY(appointmentId), payload);
    if (!response.data.data) throw new Error('Payment status was not returned.');
    return response.data.data;
  },
  confirmTestPayment: async (appointmentId: string) => {
    const response = await http.post<ApiEnvelope<AppointmentPaymentStatus>>(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_TEST_CONFIRM(appointmentId));
    if (!response.data.data) throw new Error('Test payment status was not returned.');
    return response.data.data;
  },
  getPaymentStatus: async (appointmentId: string) => {
    const response = await http.get<ApiEnvelope<AppointmentPaymentStatus>>(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_STATUS(appointmentId));
    if (!response.data.data) throw new Error('Payment status was not returned.');
    return response.data.data;
  },
  cancel: async (appointmentId: string) => {
    const response = await http.post<ApiEnvelope<PatientAppointment>>(API_ROUTES.PATIENT.APPOINTMENT_CANCEL(appointmentId));
    if (!response.data.data) throw new Error('Cancelled appointment was not returned.');
    return response.data.data;
  },
  reschedule: async (appointmentId: string, input: { listingId: string; date: string; startsAt: string }) => {
    const response = await http.post<ApiEnvelope<PatientAppointment>>(API_ROUTES.PATIENT.APPOINTMENT_RESCHEDULE(appointmentId), input);
    if (!response.data.data) throw new Error('Rescheduled appointment was not returned.');
    return response.data.data;
  },
};
