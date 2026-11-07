import type { WorkingHour } from '@/shared/types';

export const defaultHours: WorkingHour[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
].map((day) => ({ day, isOpen: day !== 'Sunday', startTime: '09:00', endTime: '17:00' }));
