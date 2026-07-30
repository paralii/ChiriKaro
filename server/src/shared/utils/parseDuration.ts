const UNIT_TO_SECONDS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
} as const;

type DurationUnit = keyof typeof UNIT_TO_SECONDS;

export const parseDurationToSeconds = (duration: string): number => {
  const result = duration.trim().match(/^(\d+)([smhd])$/);

  if (!result) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const [, value, unit] = result;

  return Number(value) * UNIT_TO_SECONDS[unit as DurationUnit];
};