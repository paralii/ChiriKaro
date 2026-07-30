import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";
import { ValidationError } from "../../shared/errors/index.js";

type ValidationSource = "body" | "query" | "params";

export const validate = (
  schema: ObjectSchema,
  source: ValidationSource = "body",
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join(".");
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });
      next(new ValidationError(errors));
      return;
    }

    req[source] = value;
    next();
  };
};
