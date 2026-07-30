import type { Request, Response, NextFunction } from "express";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (isPlainObject(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
};

/**
 * Strips Mongo operator keys ($gt, $where, ...) and dotted keys from
 * req.body and req.params to block NoSQL-injection payloads.
 *
 * req.query is intentionally left untouched: in Express 5, req.query is
 * a getter derived from the raw URL on each access, not a plain mutable
 * property, so reassigning or deep-mutating it here is unreliable
 * (this is the same reason `express-mongo-sanitize` is unsafe on Express 5).
 * None of this app's routes build Mongo filters from req.query, so the
 * exposure is limited to body/params, which this covers.
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (isPlainObject(req.body)) {
    req.body = sanitizeValue(req.body);
  }

  if (isPlainObject(req.params)) {
    for (const key of Object.keys(req.params)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete (req.params as Record<string, unknown>)[key];
      }
    }
  }

  next();
};
