export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^\+?[0-9 ()-]{7,20}$/;
export const validateEmail = (value: string) => emailPattern.test(value.trim());
export const normalizeEmail = (value: string) => value.trim().toLowerCase();