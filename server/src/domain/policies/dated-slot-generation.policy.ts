import type { ClinicWorkingHour } from "@domain/entities/clinic.entity.ts";
import type { DoctorBreak, DoctorDayOfWeek, DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";
import { InvalidDoctorDataError } from "@domain/error/DomainError.ts";

export interface DatedSlot {
  startAt: Date;
  endAt: Date;
  localStartTime: string;
  localEndTime: string;
}

const DAYS: DoctorDayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function minutes(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new InvalidDoctorDataError("Schedule contains an invalid time");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new InvalidDoctorDataError("Schedule contains an invalid time");
  return hour * 60 + minute;
}

function formatTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function zonedInstant(date: string, time: string, timeZone: string): Date | null {
  const dateMatch = DATE_PATTERN.exec(date);
  if (!dateMatch) throw new InvalidDoctorDataError("date must use YYYY-MM-DD format");
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const minute = minutes(time);
  const target = Date.UTC(year, month - 1, day, Math.floor(minute / 60), minute % 60);
  const checkDate = new Date(target);
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 || checkDate.getUTCDate() !== day) {
    throw new InvalidDoctorDataError("date is not a calendar date");
  }
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new InvalidDoctorDataError("Clinic timezone must be a valid IANA timezone");
  }
  let candidate = target;
  for (let index = 0; index < 5; index += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const delta = target - represented;
    candidate += delta;
    if (delta === 0) break;
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
  if (Number(parts.year) !== year || Number(parts.month) !== month || Number(parts.day) !== day ||
    Number(parts.hour) !== Math.floor(minute / 60) || Number(parts.minute) !== minute % 60) return null;
  return new Date(candidate);
}

function subtractBreaks(start: number, end: number, breaks: readonly DoctorBreak[]): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = [];
  let cursor = start;
  for (const pause of [...breaks].sort((left, right) => left.startTime.localeCompare(right.startTime))) {
    const breakStart = minutes(pause.startTime);
    const breakEnd = minutes(pause.endTime);
    if (breakEnd <= cursor || breakStart >= end) continue;
    if (breakStart > cursor) segments.push({ start: cursor, end: breakStart });
    cursor = Math.max(cursor, breakEnd);
  }
  if (cursor < end) segments.push({ start: cursor, end });
  return segments;
}

export function generateDatedSlots(input: {
  date: string;
  timeZone: string;
  clinicHours: readonly ClinicWorkingHour[];
  doctorHours: readonly DoctorWorkingHour[];
  doctorBreaks: readonly DoctorBreak[];
  slotDurationMinutes: number;
  bufferTimeMinutes: number;
  now?: Date;
}): DatedSlot[] {
  if (!Number.isInteger(input.slotDurationMinutes) || input.slotDurationMinutes < 5 ||
    !Number.isInteger(input.bufferTimeMinutes) || input.bufferTimeMinutes < 0) {
    throw new InvalidDoctorDataError("Slot duration or buffer is invalid");
  }
  const dateMatch = DATE_PATTERN.exec(input.date);
  if (!dateMatch) throw new InvalidDoctorDataError("date must use YYYY-MM-DD format");
  const calendarDate = new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])));
  if (calendarDate.toISOString().slice(0, 10) !== input.date) throw new InvalidDoctorDataError("date is not a calendar date");
  const day = DAYS[calendarDate.getUTCDay()];
  if (!day) return [];
  const clinicHours = input.clinicHours.find((hour) => hour.day.toUpperCase() === day && hour.isOpen);
  const doctorHours = input.doctorHours.find((hour) => hour.day === day && hour.isOpen);
  if (!clinicHours || !doctorHours) return [];
  const start = Math.max(minutes(clinicHours.startTime), minutes(doctorHours.startTime));
  const end = Math.min(minutes(clinicHours.endTime), minutes(doctorHours.endTime));
  if (start >= end) return [];
  const pauses = input.doctorBreaks.filter((item) => item.day === day);
  const now = input.now ?? new Date();
  const slots: DatedSlot[] = [];
  const step = input.slotDurationMinutes + input.bufferTimeMinutes;
  for (const segment of subtractBreaks(start, end, pauses)) {
    for (let cursor = segment.start; cursor + input.slotDurationMinutes <= segment.end; cursor += step) {
      const localStartTime = formatTime(cursor);
      const localEndTime = formatTime(cursor + input.slotDurationMinutes);
      const startAt = zonedInstant(input.date, localStartTime, input.timeZone);
      const endAt = zonedInstant(input.date, localEndTime, input.timeZone);
      if (startAt && endAt && startAt > now) slots.push({ startAt, endAt, localStartTime, localEndTime });
    }
  }
  return slots;
}
