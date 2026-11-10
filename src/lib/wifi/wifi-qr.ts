export type WifiSecurityType = 'WPA' | 'WEP' | 'nopass';

export type GuestWifiConfig = {
  enabled: boolean;
  ssid: string;
  password: string;
  security: WifiSecurityType;
};

export function normalizeWifiSecurity(value: unknown): WifiSecurityType {
  if (value === 'WEP' || value === 'nopass' || value === 'WPA') {
    return value;
  }
  return 'WPA';
}

export function normalizeGuestWifiInput(
  input: Record<string, any>
): { ok: true; wifi: GuestWifiConfig } | { ok: false; error: string } {
  const enabled = Boolean(input?.enabled);
  const ssid = String(input?.ssid || '').trim();
  const security = normalizeWifiSecurity(input?.security);
  const password = security === 'nopass' ? '' : String(input?.password || '');

  if (enabled && !ssid) {
    return {
      ok: false,
      error: 'Please enter a Wi-Fi Network Name (SSID) when Guest Wi-Fi is enabled.',
    };
  }

  return {
    ok: true,
    wifi: {
      enabled,
      ssid,
      password,
      security,
    },
  };
}

export function isWifiVisibleToDiners(wifi: Record<string, any> | null | undefined): boolean {
  return Boolean(wifi?.enabled && String(wifi?.ssid || '').trim().length > 0);
}

export function escapeWifiQrField(value: string): string {
  return value.replace(/([\\;,:])/g, '\\$1');
}

export function buildWifiQrString(wifi: {
  ssid: string;
  password?: string;
  security?: string;
}): string {
  const security = normalizeWifiSecurity(wifi.security);
  const ssidField = escapeWifiQrField(String(wifi.ssid || '').trim());
  const passwordField =
    security === 'nopass' ? '' : escapeWifiQrField(String(wifi.password || ''));

  return `WIFI:T:${security};S:${ssidField};P:${passwordField};;`;
}
