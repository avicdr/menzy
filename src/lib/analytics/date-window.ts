/**
 * Timezone-safe date window helpers for restaurant analytics queries.
 */

function getTimezoneParts(date: Date, timeZone?: string | null) {
  const tz = timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

export function getStartOfDayInTimezone(
  timeZone?: string | null,
  daysAgo = 0,
  now = new Date()
): Date {
  try {
    const p = getTimezoneParts(now, timeZone);
    const wallNowUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const offsetMs = wallNowUtcMs - now.getTime();
    const targetMidnightWallUtcMs = Date.UTC(p.year, p.month - 1, p.day - daysAgo, 0, 0, 0);
    return new Date(targetMidnightWallUtcMs - offsetMs);
  } catch {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

export function getStartOfMonthInTimezone(
  timeZone?: string | null,
  now = new Date()
): Date {
  try {
    const p = getTimezoneParts(now, timeZone);
    const wallNowUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const offsetMs = wallNowUtcMs - now.getTime();
    const monthStartWallUtcMs = Date.UTC(p.year, p.month - 1, 1, 0, 0, 0);
    return new Date(monthStartWallUtcMs - offsetMs);
  } catch {
    const d = new Date(now);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

export function getHourInTimezone(date: Date, timeZone?: string | null): number {
  try {
    const hour = getTimezoneParts(date, timeZone).hour;
    return hour >= 0 && hour <= 23 ? hour : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

