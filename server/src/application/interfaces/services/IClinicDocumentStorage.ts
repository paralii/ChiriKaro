export interface StoredClinicDocument {
  key: string;
  contentType: string;
  content: Buffer;
}

export interface IClinicDocumentStorage {
  save(content: Buffer, contentType: string): Promise<string>;
  read(key: string): Promise<StoredClinicDocument>;
}
