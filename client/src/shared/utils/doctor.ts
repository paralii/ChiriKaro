import type { WorkingHour } from '@/shared/types';

export function parseList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function findInvalidHours(hours: WorkingHour[]): WorkingHour | undefined {
  return hours.find((hour) => hour.isOpen && (!hour.startTime || !hour.endTime || hour.startTime >= hour.endTime));
}
