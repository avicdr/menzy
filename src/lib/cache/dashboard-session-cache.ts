'use client';

const CACHE_KEY_PREFIX = 'menzy:sess:v1:';
const CACHE_SCOPE_STORAGE_KEY = 'menzy:sess:scope:v1';
const DEFAULT_MAX_AGE_MS = 30 * 60_000;

export const SESSION_CACHE_TTLS = {
  AUTH_ME_FRESH_MS: 30_000,
  AUTH_ME_MAX_MS: 10 * 60_000,
  MENU_ITEMS_FRESH_MS: 3 * 60_000,
  BILLING_FRESH_MS: 2 * 60_000,
  SETTINGS_FRESH_MS: 5 * 60_000,
  ANALYTICS_FRESH_MS: 2 * 60_000,
  QR_FRESH_MS: 15 * 60_000,
  TABLES_FRESH_MS: 5 * 60_000,
  TABLES_MAX_MS: 30 * 60_000,
  STAFF_FRESH_MS: 5 * 60_000,
  STAFF_MAX_MS: 30 * 60_000,
  ORDERS_LIVE_MAX_MS: 5 * 60_000,
  ORDERS_HISTORY_FRESH_MS: 60_000,
  ORDERS_HISTORY_MAX_MS: 10 * 60_000,
  ORDERS_ANALYTICS_FRESH_MS: 60_000,
  ORDERS_ANALYTICS_MAX_MS: 15 * 60_000,
} as const;

export const ACTIVE_TABLE_ORDER_STATUSES = new Set([
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
]);

export interface CachedSessionEnvelope<T> {
  v: 1;
  updatedAt: number;
  data: T;
}

const memoryCache = new Map<string, CachedSessionEnvelope<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
let currentScope: string | null = null;

function getSessionStorageSafe(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getFullStorageKey(key: string): string {
  return `${CACHE_KEY_PREFIX}${key}`;
}

function evictOldestSessionEntries(storage: Storage, minToRemove = 3): number {
  const candidates: Array<{ fullKey: string; shortKey: string; updatedAt: number }> = [];

  for (let i = 0; i < storage.length; i++) {
    const fullKey = storage.key(i);
    if (!fullKey || !fullKey.startsWith(CACHE_KEY_PREFIX)) continue;

    let updatedAt = 0;
    try {
      const raw = storage.getItem(fullKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.updatedAt === 'number') {
          updatedAt = parsed.updatedAt;
        }
      }
    } catch {
      updatedAt = 0;
    }

    candidates.push({
      fullKey,
      shortKey: fullKey.slice(CACHE_KEY_PREFIX.length),
      updatedAt,
    });
  }

  candidates.sort((a, b) => a.updatedAt - b.updatedAt);
  let removed = 0;
  for (const item of candidates.slice(0, minToRemove)) {
    try {
      storage.removeItem(item.fullKey);
    } catch {
      // Ignore storage removal errors
    }
    memoryCache.delete(item.shortKey);
    removed++;
  }
  return removed;
}

export const cacheKeys = {
  authMe: () => 'auth:me',
  menuItems: (restaurantId: string) => `rest:${restaurantId}:menuItems`,
  billingUsage: (restaurantId: string) => `rest:${restaurantId}:billing`,
  restaurantSettings: (restaurantId: string) => `rest:${restaurantId}:settings`,
  restaurantAnalytics: (restaurantId: string) => `rest:${restaurantId}:analytics`,
  qrStudio: (slug: string) => `qrStudio:${slug}`,
  tables: (restaurantId: string) => `rest:${restaurantId}:tables`,
  qrExport: (restaurantId: string) => `rest:${restaurantId}:qrExport`,
  tableQrPreview: (tableId: string, qrVersion: number) => `tableQr:${tableId}:v${qrVersion}`,
  staff: (restaurantId: string) => `rest:${restaurantId}:staff`,
  ordersLive: (restaurantId: string) => `rest:${restaurantId}:ordersLive`,
  ordersHistory: (restaurantId: string, queryKey: string) =>
    `rest:${restaurantId}:ordersHistory:${queryKey}`,
  ordersAnalytics: (restaurantId: string) => `rest:${restaurantId}:ordersAnalytics`,
  orderingSettings: (restaurantId: string) => `rest:${restaurantId}:orderingSettings`,
} as const;

export function clearAllDashboardSessionCaches(): void {
  memoryCache.clear();
  inFlightRequests.clear();
  currentScope = null;

  const storage = getSessionStorageSafe();
  if (!storage) return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && (k.startsWith(CACHE_KEY_PREFIX) || k === CACHE_SCOPE_STORAGE_KEY)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
    }
  } catch {
    // Ignore storage cleanup errors
  }
}

export function setSessionCacheScope(scopeId: string | null | undefined): void {
  const normalized = scopeId?.trim() || null;
  if (!normalized) {
    clearAllDashboardSessionCaches();
    return;
  }

  const storage = getSessionStorageSafe();
  const persistedScope = (() => {
    if (currentScope) return currentScope;
    if (!storage) return null;
    try {
      return storage.getItem(CACHE_SCOPE_STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  if (persistedScope && persistedScope !== normalized) {
    clearAllDashboardSessionCaches();
  }

  currentScope = normalized;
  if (storage) {
    try {
      storage.setItem(CACHE_SCOPE_STORAGE_KEY, normalized);
    } catch {
      // Ignore quota issues for tiny scope key
    }
  }
}

export function readSessionCache<T>(
  key: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS
): CachedSessionEnvelope<T> | null {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.v === 1 && now - mem.updatedAt <= maxAgeMs) {
      return mem as CachedSessionEnvelope<T>;
    }
    memoryCache.delete(key);
  }

  const storage = getSessionStorageSafe();
  if (!storage) return null;

  const fullKey = getFullStorageKey(key);
  try {
    const raw = storage.getItem(fullKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSessionEnvelope<T>;
    if (
      !parsed ||
      parsed.v !== 1 ||
      typeof parsed.updatedAt !== 'number' ||
      now - parsed.updatedAt > maxAgeMs
    ) {
      storage.removeItem(fullKey);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    try {
      storage.removeItem(fullKey);
    } catch {
      // Ignore cleanup error
    }
    return null;
  }
}

export function isCacheFresh(
  envelope: Pick<CachedSessionEnvelope<any>, 'updatedAt'> | null | undefined,
  freshMs: number
): boolean {
  if (!envelope || typeof envelope.updatedAt !== 'number') return false;
  return Date.now() - envelope.updatedAt <= freshMs;
}

export function writeSessionCache<T>(
  key: string,
  data: T,
  options?: { updatedAt?: number }
): CachedSessionEnvelope<T> {
  const envelope: CachedSessionEnvelope<T> = {
    v: 1,
    updatedAt: options?.updatedAt ?? Date.now(),
    data,
  };
  memoryCache.set(key, envelope);

  const storage = getSessionStorageSafe();
  if (!storage) return envelope;

  const fullKey = getFullStorageKey(key);
  const serialized = JSON.stringify(envelope);

  try {
    storage.setItem(fullKey, serialized);
  } catch {
    // Handle QuotaExceededError cleanly by evicting oldest cached session entries
    try {
      const removed = evictOldestSessionEntries(storage, 5);
      if (removed > 0) {
        storage.setItem(fullKey, serialized);
      }
    } catch {
      // Keep in-memory entry only if sessionStorage remains full
    }
  }

  return envelope;
}

export function removeSessionCache(key: string): void {
  memoryCache.delete(key);
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.removeItem(getFullStorageKey(key));
  } catch {
    // Ignore storage removal errors
  }
}

export function invalidateSessionCacheByPrefix(prefix: string): void {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  const storage = getSessionStorageSafe();
  if (!storage) return;

  const fullPrefix = getFullStorageKey(prefix);
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
    }
  } catch {
    // Ignore prefix cleanup errors
  }
}

export type RestaurantCacheScope =
  | 'tables'
  | 'qrExport'
  | 'staff'
  | 'ordersLive'
  | 'ordersHistory'
  | 'ordersAnalytics'
  | 'orderingSettings'
  | 'restaurantAnalytics'
  | 'restaurantSettings'
  | 'menuItems'
  | 'billingUsage'
  | 'authMe';

export function invalidateRestaurantSessionCache(
  restaurantId: string,
  scopes?: RestaurantCacheScope[]
): void {
  const targetScopes: RestaurantCacheScope[] = scopes ?? [
    'tables',
    'qrExport',
    'staff',
    'ordersLive',
    'ordersHistory',
    'ordersAnalytics',
    'orderingSettings',
    'restaurantAnalytics',
    'restaurantSettings',
    'menuItems',
    'billingUsage',
  ];

  for (const scope of targetScopes) {
    switch (scope) {
      case 'tables':
        removeSessionCache(cacheKeys.tables(restaurantId));
        break;
      case 'qrExport':
        removeSessionCache(cacheKeys.qrExport(restaurantId));
        break;
      case 'staff':
        removeSessionCache(cacheKeys.staff(restaurantId));
        break;
      case 'ordersLive':
        removeSessionCache(cacheKeys.ordersLive(restaurantId));
        break;
      case 'ordersHistory':
        invalidateSessionCacheByPrefix(`rest:${restaurantId}:ordersHistory:`);
        break;
      case 'ordersAnalytics':
        removeSessionCache(cacheKeys.ordersAnalytics(restaurantId));
        break;
      case 'orderingSettings':
        removeSessionCache(cacheKeys.orderingSettings(restaurantId));
        break;
      case 'restaurantAnalytics':
        removeSessionCache(cacheKeys.restaurantAnalytics(restaurantId));
        break;
      case 'restaurantSettings':
        removeSessionCache(cacheKeys.restaurantSettings(restaurantId));
        break;
      case 'menuItems':
        removeSessionCache(cacheKeys.menuItems(restaurantId));
        break;
      case 'billingUsage':
        removeSessionCache(cacheKeys.billingUsage(restaurantId));
        break;
      case 'authMe':
        removeSessionCache(cacheKeys.authMe());
        break;
    }
  }
}

export function dedupeClientRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (inFlightRequests.get(key) === promise) {
        inFlightRequests.delete(key);
      }
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export function syncCachedTablesActiveOrderCounts(
  restaurantId: string,
  orders: Array<{
    status?: string | null;
    tableId?: string | null;
    table?: { id?: string | null } | null;
  }>
): boolean {
  if (!restaurantId) return false;

  const key = cacheKeys.tables(restaurantId);
  const existing = readSessionCache<any[]>(key, SESSION_CACHE_TTLS.TABLES_MAX_MS);
  if (!existing || !Array.isArray(existing.data) || existing.data.length === 0) {
    return false;
  }

  const activeCountsByTable = new Map<string, number>();
  for (const order of orders) {
    const status = String(order?.status || '');
    if (!ACTIVE_TABLE_ORDER_STATUSES.has(status)) continue;
    const tid = order?.tableId || order?.table?.id;
    if (!tid) continue;
    activeCountsByTable.set(tid, (activeCountsByTable.get(tid) || 0) + 1);
  }

  let changed = false;
  const updatedTables = existing.data.map((table) => {
    const nextCount = activeCountsByTable.get(table.id) ?? 0;
    if ((table.activeOrderCount ?? 0) !== nextCount) {
      changed = true;
      return { ...table, activeOrderCount: nextCount };
    }
    return table;
  });

  if (changed) {
    writeSessionCache(key, updatedTables, { updatedAt: existing.updatedAt });
  }

  return changed;
}

