import { api } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';

export type PatientQueueEntry = {
  tokenNumber: number;
  kind: 'WALK_IN' | 'APPOINTMENT';
  clinicName: string;
  doctorName: string;
  localDate: string;
  timeZone: string;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: string;
  updatedAt: string;
};

export const patientQueueService = {
  list: async () => {
    const response = await api.get<{ data?: PatientQueueEntry[] }>(API_ROUTES.PATIENT.QUEUE);
    if (!response.data) throw new Error('Your queue entries were not returned.');
    return response.data;
  },
};
