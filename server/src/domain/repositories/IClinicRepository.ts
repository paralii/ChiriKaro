import { Clinic } from "../entities/clinic.entity.js";

export interface IClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findAll(): Promise<Clinic[]>;
  save(clinic: Clinic): Promise<Clinic>;
}