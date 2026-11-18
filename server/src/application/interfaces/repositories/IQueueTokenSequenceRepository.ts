export interface IQueueTokenSequenceRepository {
  nextNumber(clinicId: string, localDate: string): Promise<number>;
}
