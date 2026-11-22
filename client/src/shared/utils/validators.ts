export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^\+?[0-9 ()-]{7,20}$/;
export const validateEmail = (value: string) => value.trim().length <= 254 && emailPattern.test(value.trim());
export const validatePassword = (value: string) =>
  value.length >= 8 && value.length <= 128 && !/\s/.test(value) &&
  /\p{Lu}/u.test(value) && /\d/.test(value) && /[^\p{L}\p{N}\s]/u.test(value);
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const validatePhone = (value: string) => {
  const trimmed = value.trim();
  if (!/^\+?[0-9 ()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (!validatePhone(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');
  return `${trimmed.startsWith('+') ? '+' : ''}${digits}`;
};

export const isRealDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
};
