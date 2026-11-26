import { nextDailyRun } from './news.retention.js';

/** Minutos después de medianoche (00:01) a los que se renuevan los feeds que solo valen un día. */
export const DAILY_REFRESH_MINUTES = 1;
export const DAILY_REFRESH_RETRY_MS = 10 * 60 * 1000;

export interface DailyRefreshOptions {
  /** Devuelve true si el contenido de hoy quedó completo; con false se reintenta. */
  refresh: () => Promise<boolean>;
  timeZone: string;
  minutesAfterMidnight?: number;
  retryMs?: number;
  now?: () => number;
}

/**
 * Lanza `refresh` cada día a la hora local indicada y, si no consigue el contenido de hoy, lo reintenta
 * cada `retryMs` hasta que llegue la siguiente ejecución. Devuelve la función que lo detiene.
 */
export function startDailyRefresh({
  refresh,
  timeZone,
  minutesAfterMidnight = DAILY_REFRESH_MINUTES,
  retryMs = DAILY_REFRESH_RETRY_MS,
  now = Date.now,
}: DailyRefreshOptions): () => void {
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  function schedule(delayMs: number): void {
    if (stopped) return;
    timer = setTimeout(() => void run(), delayMs);
    timer.unref();
  }

  async function run(): Promise<void> {
    // Los fallos de cada feed ya los registra el servicio; aquí solo cuenta si quedó completo.
    const complete = await refresh().catch(() => false);
    const untilNextRun = nextDailyRun(now(), timeZone, minutesAfterMidnight) - now();
    schedule(complete ? untilNextRun : Math.min(retryMs, untilNextRun));
  }

  schedule(nextDailyRun(now(), timeZone, minutesAfterMidnight) - now());
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
