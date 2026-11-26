function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instantMs));
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const localAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return localAsUtc - Math.floor(instantMs / 1000) * 1000;
}

/** Instante en que empezó el día de `nowMs` (00:00 locales) desplazado `daysBack` días atrás. */
function startOfLocalDay(nowMs: number, timeZone: string, daysBack: number): number {
  const local = new Date(nowMs + zoneOffsetMs(nowMs, timeZone));
  const localMidnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysBack);
  // El desfase se vuelve a medir en la fecha objetivo por si hay un cambio de hora entre ambas.
  const firstGuess = localMidnightAsUtc - zoneOffsetMs(localMidnightAsUtc, timeZone);
  return localMidnightAsUtc - zoneOffsetMs(firstGuess, timeZone);
}

/** Instante en que empezó el día anterior (00:00 locales) en la zona horaria indicada. */
export function startOfPreviousDay(nowMs: number, timeZone: string): number {
  return startOfLocalDay(nowMs, timeZone, 1);
}

/** Instante en que empezó el día actual (00:00 locales) en la zona horaria indicada. */
export function startOfDay(nowMs: number, timeZone: string): number {
  return startOfLocalDay(nowMs, timeZone, 0);
}

/** Próximo instante posterior a `nowMs` en que el reloj local marca `minutesAfterMidnight`. */
export function nextDailyRun(nowMs: number, timeZone: string, minutesAfterMidnight: number): number {
  const offsetMs = minutesAfterMidnight * 60_000;
  const today = startOfDay(nowMs, timeZone) + offsetMs;
  return today > nowMs ? today : startOfLocalDay(nowMs, timeZone, -1) + offsetMs;
}

export interface LocalDate {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
}

/** Fecha de calendario de `nowMs` en la zona horaria indicada. */
export function localDate(nowMs: number, timeZone: string): LocalDate {
  const local = new Date(nowMs + zoneOffsetMs(nowMs, timeZone));
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate() };
}
