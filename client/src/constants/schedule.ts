import type { WorkingHour } from '@/types';

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const defaultHours: WorkingHour[] = days.map((day, i) => ({ day, isOpen: i < 5, startTime: '09:00', endTime: '17:00' }));