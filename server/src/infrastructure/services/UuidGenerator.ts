import { randomUUID } from "node:crypto";
import type { IIdGenerator } from "@application/interfaces/services/IIdGenerator.js";

export class IdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}