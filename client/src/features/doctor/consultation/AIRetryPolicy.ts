export function retryDelaySeconds(status: number | undefined, suppliedDelay: unknown, networkFailure: boolean, attempt: number): number | null {
  if (status !== 429 && status !== 503 && !networkFailure) return null;
  if (typeof suppliedDelay === 'number' && Number.isFinite(suppliedDelay) && suppliedDelay >= 0) return Math.min(3600, Math.ceil(suppliedDelay));
  return Math.min(300, 2 ** Math.max(1, attempt));
}

export function retryCountdownSeconds(retryAt: number | null, now: number): number {
  return retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));
}
