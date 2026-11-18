import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import type { PatientAppointment } from '@/shared/types';

type ApiEnvelope<T> = { data?: T };

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
};
