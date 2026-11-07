import { Clinic } from "@domain/entities/clinic.entity.ts";

export interface IClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findAll(): Promise<Clinic[]>;
  findPage(options: { skip: number; limit: number }): Promise<{
    clinics: Clinic[];
    totalItems: number;
  }>;
  save(clinic: Clinic): Promise<Clinic>;
  deleteById(id: string): Promise<void>;
}
