export interface StoredDocument {
  key: string;
  contentType: string;
  content: Buffer;
}

export interface IDocumentStorage {
  save(content: Buffer, contentType: string): Promise<string>;
  read(key: string): Promise<StoredDocument>;
  delete(key: string): Promise<void>;
}
