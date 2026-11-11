export const DEFAULT_TAX_PERCENTAGE = 5.0;
export const MIN_TAX_PERCENTAGE = 0;
export const MAX_TAX_PERCENTAGE = 100;

export const DEFAULT_SERVICE_CHARGE_PERCENTAGE = 0.0;
export const MIN_SERVICE_CHARGE_PERCENTAGE = 0;
export const MAX_SERVICE_CHARGE_PERCENTAGE = 100;

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveTaxPercentageValue(
  value: unknown,
  fallback = DEFAULT_TAX_PERCENTAGE
): number {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < MIN_TAX_PERCENTAGE || parsed > MAX_TAX_PERCENTAGE) {
    return fallback;
  }
  return roundRate(parsed);
}

export function resolveServiceChargePercentageValue(
  value: unknown,
  fallback = DEFAULT_SERVICE_CHARGE_PERCENTAGE
): number {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return fallback;
  }
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_SERVICE_CHARGE_PERCENTAGE ||
    parsed > MAX_SERVICE_CHARGE_PERCENTAGE
  ) {
    return fallback;
  }
  return roundRate(parsed);
}

export function normalizeTaxPercentageInput(
  raw: unknown,
  fallback?: number
): { ok: true; taxPercentage: number } | { ok: false; error: string } {
  if (raw === undefined) {
    return {
      ok: true,
      taxPercentage: roundRate(fallback ?? DEFAULT_TAX_PERCENTAGE),
    };
  }

  if (
    raw === null ||
    typeof raw === 'boolean' ||
    typeof raw === 'object' ||
    (typeof raw === 'string' && raw.trim() === '')
  ) {
    return {
      ok: false,
      error: `Tax percentage must be a number between ${MIN_TAX_PERCENTAGE}% and ${MAX_TAX_PERCENTAGE}% (enter 0 for no tax).`,
    };
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < MIN_TAX_PERCENTAGE || parsed > MAX_TAX_PERCENTAGE) {
    return {
      ok: false,
      error: `Tax percentage must be between ${MIN_TAX_PERCENTAGE}% and ${MAX_TAX_PERCENTAGE}%.`,
    };
  }

  return {
    ok: true,
    taxPercentage: roundRate(parsed),
  };
}

export function normalizeServiceChargeInput(
  raw: unknown,
  fallback?: number
): { ok: true; serviceChargePercentage: number } | { ok: false; error: string } {
  if (raw === undefined) {
    return {
      ok: true,
      serviceChargePercentage: roundRate(fallback ?? DEFAULT_SERVICE_CHARGE_PERCENTAGE),
    };
  }

  if (
    raw === null ||
    typeof raw === 'boolean' ||
    typeof raw === 'object' ||
    (typeof raw === 'string' && raw.trim() === '')
  ) {
    return {
      ok: false,
      error: `Service charge percentage must be a number between ${MIN_SERVICE_CHARGE_PERCENTAGE}% and ${MAX_SERVICE_CHARGE_PERCENTAGE}%.`,
    };
  }

  const parsed = Number(raw);
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_SERVICE_CHARGE_PERCENTAGE ||
    parsed > MAX_SERVICE_CHARGE_PERCENTAGE
  ) {
    return {
      ok: false,
      error: `Service charge percentage must be between ${MIN_SERVICE_CHARGE_PERCENTAGE}% and ${MAX_SERVICE_CHARGE_PERCENTAGE}%.`,
    };
  }

  return {
    ok: true,
    serviceChargePercentage: roundRate(parsed),
  };
}

