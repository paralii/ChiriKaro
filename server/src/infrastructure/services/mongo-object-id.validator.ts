import { Types } from "mongoose";
import type { IIdentifierValidator } from "@application/interfaces/services/IIdentifierValidator.ts";

export class MongoObjectIdValidator implements IIdentifierValidator {
  isValid(value: string): boolean {
    return Types.ObjectId.isValid(value);
  }
}
