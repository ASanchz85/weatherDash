import { describe, expect, it, vi } from 'vitest';

import { createCachedResource, RETRY_AFTER_FAILURE_MS } from './cached-resource.js';

const TTL_MS = 15 * 60 * 1000;

function createClock(start = Date.UTC(2026, 10, 23, 10)) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('createCachedResource', () => {
  it('carga el dato la primera vez e indica cuánto falta para refrescarlo', async () => {
    const clock = createClock();
    const load = vi.fn().mockResolvedValue('dato');
    const resource = createCachedResource({ load, ttlMs: TTL_MS, now: clock.now });

    expect(await resource.get()).toEqual({
      value: 'dato',
      fetchedAt: clock.now(),
      stale: false,
      nextRefreshInMs: TTL_MS,
    });
  });

  it('reutiliza el dato mientras no caduca y descuenta el tiempo transcurrido', async () => {
    const clock = createClock();
    const load = vi.fn().mockResolvedValue('dato');
    const resource = createCachedResource({ load, ttlMs: TTL_MS, now: clock.now });

    await resource.get();
    clock.advance(TTL_MS - 1000);
    const cached = await resource.get();

    expect(load).toHaveBeenCalledTimes(1);
    expect(cached.nextRefreshInMs).toBe(1000);

    clock.advance(1000);
    await resource.get();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('comparte una única carga entre solicitudes simultáneas', async () => {
    const load = vi.fn().mockResolvedValue('dato');
    const resource = createCachedResource({ load, ttlMs: TTL_MS });

    await Promise.all([resource.get(), resource.get(), resource.get()]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('devuelve el último dato desactualizado si la carga falla y espera antes de reintentar', async () => {
    const clock = createClock();
    const load = vi.fn().mockResolvedValueOnce('dato').mockRejectedValueOnce(new Error('caído'));
    const onFailure = vi.fn();
    const resource = createCachedResource({ load, ttlMs: TTL_MS, now: clock.now, onFailure });

    await resource.get();
    clock.advance(TTL_MS);
    const stale = await resource.get();

    expect(stale).toMatchObject({ value: 'dato', stale: true, nextRefreshInMs: RETRY_AFTER_FAILURE_MS });
    expect(onFailure).toHaveBeenCalledTimes(1);

    clock.advance(RETRY_AFTER_FAILURE_MS - 1);
    const cooling = await resource.get();
    expect(cooling).toMatchObject({ stale: true, nextRefreshInMs: 1 });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('se recupera pasado el tiempo de espera', async () => {
    const clock = createClock();
    const load = vi
      .fn()
      .mockResolvedValueOnce('antiguo')
      .mockRejectedValueOnce(new Error('caído'))
      .mockResolvedValueOnce('nuevo');
    const resource = createCachedResource({ load, ttlMs: TTL_MS, now: clock.now });

    await resource.get();
    clock.advance(TTL_MS);
    await resource.get();
    clock.advance(RETRY_AFTER_FAILURE_MS);

    expect(await resource.get()).toMatchObject({ value: 'nuevo', stale: false });
  });

  it('propaga el error original si nunca hubo datos', async () => {
    const failure = new Error('caído');
    const resource = createCachedResource({ load: vi.fn().mockRejectedValue(failure), ttlMs: TTL_MS });

    await expect(resource.get()).rejects.toBe(failure);
  });
});
