export const DEFAULT_SCAN_TIMEOUT_MINUTES = 30;
export const DEFAULT_ORDER_EXTENSION_MINUTES = 30;
export const MIN_TABLE_SESSION_MINUTES = 1;
export const MAX_TABLE_SESSION_MINUTES = 480;

export type TableSessionTimeoutKind = 'SCAN' | 'ORDER_EXTENSION';

export interface TableSessionConfig {
  scanTimeoutMinutes: number;
  orderExtensionMinutes: number;
}

export interface ComputedTableSessionWindow {
  anchorAt: Date;
  expiresAt: Date;
  timeoutMinutes: number;
  timeoutKind: TableSessionTimeoutKind;
  hasOrderInCycle: boolean;
  scanTimeoutMinutes: number;
  orderExtensionMinutes: number;
}

function clampMinutes(value: number): number {
  return Math.max(MIN_TABLE_SESSION_MINUTES, Math.min(MAX_TABLE_SESSION_MINUTES, Math.round(value)));
}

export function extractTableSessionConfig(notificationSettings?: unknown): TableSessionConfig {
  const raw =
    notificationSettings &&
    typeof notificationSettings === 'object' &&
    !Array.isArray(notificationSettings)
      ? (notificationSettings as Record<string, any>).tableSession
      : null;

  const rawScan = Number(raw?.scanTimeoutMinutes);
  const rawExtension = Number(raw?.orderExtensionMinutes);

  return {
    scanTimeoutMinutes:
      Number.isFinite(rawScan) && rawScan >= MIN_TABLE_SESSION_MINUTES
        ? clampMinutes(rawScan)
        : DEFAULT_SCAN_TIMEOUT_MINUTES,
    orderExtensionMinutes:
      Number.isFinite(rawExtension) && rawExtension >= MIN_TABLE_SESSION_MINUTES
        ? clampMinutes(rawExtension)
        : DEFAULT_ORDER_EXTENSION_MINUTES,
  };
}

export function normalizeTableSessionConfigInput(
  input: unknown,
  fallback?: Partial<TableSessionConfig>
):
  | { ok: true; tableSession: TableSessionConfig }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      error: 'Invalid table session timeout configuration.',
    };
  }

  const record = input as Record<string, unknown>;
  const defaultScan = fallback?.scanTimeoutMinutes ?? DEFAULT_SCAN_TIMEOUT_MINUTES;
  const defaultExtension = fallback?.orderExtensionMinutes ?? DEFAULT_ORDER_EXTENSION_MINUTES;

  const rawScan =
    record.scanTimeoutMinutes === undefined || record.scanTimeoutMinutes === ''
      ? defaultScan
      : Number(record.scanTimeoutMinutes);

  const rawExtension =
    record.orderExtensionMinutes === undefined || record.orderExtensionMinutes === ''
      ? defaultExtension
      : Number(record.orderExtensionMinutes);

  if (
    !Number.isFinite(rawScan) ||
    !Number.isInteger(rawScan) ||
    rawScan < MIN_TABLE_SESSION_MINUTES ||
    rawScan > MAX_TABLE_SESSION_MINUTES
  ) {
    return {
      ok: false,
      error: `Initial QR scan timeout must be a whole number between ${MIN_TABLE_SESSION_MINUTES} and ${MAX_TABLE_SESSION_MINUTES} minutes.`,
    };
  }

  if (
    !Number.isFinite(rawExtension) ||
    !Number.isInteger(rawExtension) ||
    rawExtension < MIN_TABLE_SESSION_MINUTES ||
    rawExtension > MAX_TABLE_SESSION_MINUTES
  ) {
    return {
      ok: false,
      error: `Post-order extension time must be a whole number between ${MIN_TABLE_SESSION_MINUTES} and ${MAX_TABLE_SESSION_MINUTES} minutes.`,
    };
  }

  return {
    ok: true,
    tableSession: {
      scanTimeoutMinutes: rawScan,
      orderExtensionMinutes: rawExtension,
    },
  };
}

export function computeTableSessionWindow(params: {
  lastScanAt: Date;
  lastOrderAt?: Date | null;
  scanTimeoutMinutes?: number;
  orderExtensionMinutes?: number;
}): ComputedTableSessionWindow {
  const scanTimeoutMinutes =
    params.scanTimeoutMinutes && params.scanTimeoutMinutes >= MIN_TABLE_SESSION_MINUTES
      ? clampMinutes(params.scanTimeoutMinutes)
      : DEFAULT_SCAN_TIMEOUT_MINUTES;
  const orderExtensionMinutes =
    params.orderExtensionMinutes && params.orderExtensionMinutes >= MIN_TABLE_SESSION_MINUTES
      ? clampMinutes(params.orderExtensionMinutes)
      : DEFAULT_ORDER_EXTENSION_MINUTES;

  const scanTimeoutMs = scanTimeoutMinutes * 60 * 1000;
  const orderExtensionMs = orderExtensionMinutes * 60 * 1000;

  const scanExpiresAtMs = params.lastScanAt.getTime() + scanTimeoutMs;
  const hasOrderInCycle = Boolean(
    params.lastOrderAt && params.lastOrderAt.getTime() >= params.lastScanAt.getTime()
  );

  if (hasOrderInCycle && params.lastOrderAt) {
    const orderExpiresAtMs = params.lastOrderAt.getTime() + orderExtensionMs;
    if (orderExpiresAtMs >= scanExpiresAtMs) {
      return {
        anchorAt: params.lastOrderAt,
        expiresAt: new Date(orderExpiresAtMs),
        timeoutMinutes: orderExtensionMinutes,
        timeoutKind: 'ORDER_EXTENSION',
        hasOrderInCycle: true,
        scanTimeoutMinutes,
        orderExtensionMinutes,
      };
    }

    // Never shorten the diner's remaining initial scan window if orderExtensionMinutes < scanTimeoutMinutes
    return {
      anchorAt: params.lastScanAt,
      expiresAt: new Date(scanExpiresAtMs),
      timeoutMinutes: scanTimeoutMinutes,
      timeoutKind: 'SCAN',
      hasOrderInCycle: true,
      scanTimeoutMinutes,
      orderExtensionMinutes,
    };
  }

  return {
    anchorAt: params.lastScanAt,
    expiresAt: new Date(scanExpiresAtMs),
    timeoutMinutes: scanTimeoutMinutes,
    timeoutKind: 'SCAN',
    hasOrderInCycle: false,
    scanTimeoutMinutes,
    orderExtensionMinutes,
  };
}

export function formatMinutesLabel(minutes?: number | null): string {
  const m =
    typeof minutes === 'number' && Number.isFinite(minutes) && minutes >= 1
      ? Math.round(minutes)
      : DEFAULT_SCAN_TIMEOUT_MINUTES;
  return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
}

export function formatSessionExpiredSummary(params: {
  timeoutMinutes?: number | null;
  timeoutKind?: TableSessionTimeoutKind | null;
  tableName?: string | null;
}): string {
  const mins =
    typeof params.timeoutMinutes === 'number' &&
    Number.isFinite(params.timeoutMinutes) &&
    params.timeoutMinutes >= 1
      ? Math.round(params.timeoutMinutes)
      : DEFAULT_SCAN_TIMEOUT_MINUTES;
  const label = formatMinutesLabel(mins);
  const tableParen = params.tableName ? ` (${params.tableName})` : '';

  if (params.timeoutKind === 'ORDER_EXTENSION') {
    return `Your ${mins}-minute ordering window after your last order has expired${tableParen}. Please rescan the QR code${
      params.tableName ? ` on ${params.tableName}` : ''
    } to continue.`;
  }

  return `No order has been placed from your device in the last ${label}${tableParen}. Please rescan the QR code${
    params.tableName ? ` on ${params.tableName}` : ''
  } to continue.`;
}

