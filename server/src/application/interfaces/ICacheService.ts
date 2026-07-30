export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(...key: string[]): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  increment(key: string, by?: number): Promise<number>;
  setNX<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  flushDatabase(): Promise<void>;
}
