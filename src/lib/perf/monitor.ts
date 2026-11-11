export interface PerfTimingEntry {
  name: string;
  durationMs: number;
  description?: string;
}

const DEFAULT_SLOW_THRESHOLD_MS = Number(process.env.SLOW_OP_THRESHOLD_MS || 500);

export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { slowThresholdMs?: number; logSlow?: boolean }
): Promise<{ result: T; durationMs: number }> {
  const start = nowMs();
  try {
    const result = await fn();
    const durationMs = nowMs() - start;
    const threshold = options?.slowThresholdMs ?? DEFAULT_SLOW_THRESHOLD_MS;
    if ((options?.logSlow ?? true) && durationMs >= threshold) {
      console.warn(`[perf] slow=${label} dur=${durationMs.toFixed(1)}ms`);
    }
    return { result, durationMs };
  } catch (error) {
    const durationMs = nowMs() - start;
    if (options?.logSlow ?? true) {
      console.warn(`[perf] fail=${label} dur=${durationMs.toFixed(1)}ms`);
    }
    throw error;
  }
}

export function formatServerTiming(entries: PerfTimingEntry[]): string {
  return entries
    .filter((entry) => Number.isFinite(entry.durationMs) && entry.durationMs >= 0)
    .map((entry) => {
      const safeName = entry.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const dur = entry.durationMs.toFixed(1);
      if (entry.description) {
        const safeDesc = entry.description.replace(/["\\]/g, '');
        return `${safeName};dur=${dur};desc="${safeDesc}"`;
      }
      return `${safeName};dur=${dur}`;
    })
    .join(', ');
}

