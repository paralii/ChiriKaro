import { ValidationError } from "@shared/errors/index.ts";

export function parseResponseObject(raw: string): Record<string, unknown> {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new ValidationError("AI returned a malformed response. Please retry."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("AI returned an invalid response");
  return value as Record<string, unknown>;
}

export function responseText(value: unknown, field: string, maxLength = 1200): string {
  if (typeof value !== "string") throw new ValidationError(`AI response field ${field} is invalid`);
  return value.split("").filter((character) => { const code = character.charCodeAt(0); return code >= 32 || code === 9 || code === 10 || code === 13; }).join("").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function responseTextList(value: unknown, field: string, maxItems = 20): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new ValidationError(`AI response field ${field} is invalid`);
  return value.map((item) => responseText(item, field, 800));
}
