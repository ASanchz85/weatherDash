import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startDailyRefresh } from './news.daily-refresh.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe('startDailyRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 23:00 del 25-nov en Madrid (UTC+1): faltan 61 minutos para las 00:01.
    vi.setSystemTime(new Date('2026-11-25T22:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('se ejecuta a las 00:01 locales y una vez al día', async () => {
    const refresh = vi.fn(async () => true);
    startDailyRefresh({ refresh, timeZone: 'Europe/Madrid' });

    await vi.advanceTimersByTimeAsync(61 * MINUTE - 1);
    expect(refresh).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(23 * HOUR);
    expect(refresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('reintenta cada 10 minutos mientras el contenido de hoy no esté completo', async () => {
    const refresh = vi.fn<() => Promise<boolean>>().mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
    startDailyRefresh({ refresh, timeZone: 'Europe/Madrid', retryMs: 10 * MINUTE });

    await vi.advanceTimersByTimeAsync(61 * MINUTE);
    expect(refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(refresh).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(refresh).toHaveBeenCalledTimes(3);

    // Con el contenido completo ya no reintenta.
    await vi.advanceTimersByTimeAsync(2 * HOUR);
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it('un fallo inesperado cuenta como contenido incompleto', async () => {
    const refresh = vi.fn<() => Promise<boolean>>().mockRejectedValueOnce(new Error('caído')).mockResolvedValue(true);
    startDailyRefresh({ refresh, timeZone: 'Europe/Madrid', retryMs: 10 * MINUTE });

    await vi.advanceTimersByTimeAsync(71 * MINUTE);

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('no se queda reintentando más allá de la siguiente ejecución diaria', async () => {
    const refresh = vi.fn(async () => false);
    startDailyRefresh({ refresh, timeZone: 'Europe/Madrid', retryMs: 10 * HOUR });

    await vi.advanceTimersByTimeAsync(61 * MINUTE);
    await vi.advanceTimersByTimeAsync(10 * HOUR);
    await vi.advanceTimersByTimeAsync(10 * HOUR);
    // 00:01, 10:01, 20:01 y, sin esperar otras 10 h, otra vez a las 00:01 del día siguiente.
    await vi.advanceTimersByTimeAsync(4 * HOUR);

    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it('deja de ejecutarse al detenerlo', async () => {
    const refresh = vi.fn(async () => true);
    const stop = startDailyRefresh({ refresh, timeZone: 'Europe/Madrid' });

    stop();
    await vi.advanceTimersByTimeAsync(48 * HOUR);

    expect(refresh).not.toHaveBeenCalled();
  });
});
