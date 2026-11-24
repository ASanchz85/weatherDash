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

/** Instante en que empezó el día anterior (00:00 locales) en la zona horaria indicada. */
export function startOfPreviousDay(nowMs: number, timeZone: string): number {
  const local = new Date(nowMs + zoneOffsetMs(nowMs, timeZone));
  const localMidnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - 1);
  // El desfase se vuelve a medir en la fecha objetivo por si hay un cambio de hora entre ambas.
  const firstGuess = localMidnightAsUtc - zoneOffsetMs(localMidnightAsUtc, timeZone);
  return localMidnightAsUtc - zoneOffsetMs(firstGuess, timeZone);
}
