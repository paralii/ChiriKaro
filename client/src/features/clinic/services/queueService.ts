import { api, http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';

export type QueueEntry = {
  queueEntryId: string;
  tokenNumber: number;
  kind: 'WALK_IN' | 'APPOINTMENT';
  patientName: string;
  doctorName: string;
  clinicName: string;
  timeZone: string;
  localDate: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
};
export type QueueDay = { localDate: string; timeZone: string; entries: QueueEntry[] };
export type QueueDoctor = { doctorUserId: string; name: string };

type Envelope<T> = { success: boolean; message: string; data?: T };
function requireData<T>(response: Envelope<T>, message: string): T {
  if (!response.data) throw new Error(message);
  return response.data;
}

export const queueService = {
  list: async () => requireData(await api.get<Envelope<QueueDay>>(API_ROUTES.CLINIC.QUEUE), 'The clinic queue was not returned.'),
  doctors: async () => requireData(await api.get<Envelope<QueueDoctor[]>>(API_ROUTES.CLINIC.QUEUE_DOCTORS), 'Queue doctors were not returned.'),
  registerWalkIn: async (body: { doctorUserId: string; patientEmail?: string; guestName?: string }, idempotencyKey: string) => {
    const response = await http.post<Envelope<QueueEntry>>(API_ROUTES.CLINIC.QUEUE_WALK_INS, body, { headers: { 'Idempotency-Key': idempotencyKey } });
    return requireData(response.data, 'The queue token was not returned.');
  },
  checkInAppointment: async (appointmentId: string) =>
    requireData(await api.post<Envelope<QueueEntry>>(API_ROUTES.CLINIC.QUEUE_APPOINTMENT_CHECK_IN(appointmentId)), 'The patient was not checked into the queue.'),
  transition: async (queueEntryId: string, status: QueueEntry['status']) =>
    requireData(await api.patch<Envelope<QueueEntry>>(API_ROUTES.CLINIC.QUEUE_STATUS(queueEntryId), { status }), 'Queue status was not returned.'),
};
