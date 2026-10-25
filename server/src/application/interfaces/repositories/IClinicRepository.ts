import { Clinic } from "@domain/entities/clinic.entity.ts";

export interface IClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findAll(): Promise<Clinic[]>;
  save(clinic: Clinic): Promise<Clinic>;
}