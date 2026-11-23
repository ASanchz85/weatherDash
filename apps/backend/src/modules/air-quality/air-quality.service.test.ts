import { describe, expect, it, vi } from 'vitest';

import { buildAirQuality, navaluenga } from '../../test/fixtures.js';
import { RETRY_AFTER_FAILURE_MS } from '../../shared/cached-resource.js';
import type { LocationService } from '../location/location.service.js';
import type { AirQualityProvider } from './air-quality.provider.js';
import {
  AIR_QUALITY_MIN_TTL_MS,
  AirQualityUnavailableError,
  createAirQualityService,
} from './air-quality.service.js';

const WEATHER_REFRESH_MS = 15 * 60 * 1000;

function createClock(start = Date.UTC(2026, 10, 23, 10)) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

function createService(refreshIntervalMs = WEATHER_REFRESH_MS) {
  const clock = createClock();
  const provider = {
    fetchAirQuality: vi.fn<AirQualityProvider['fetchAirQuality']>().mockResolvedValue(buildAirQuality()),
  };
  const locationService = { getLocation: vi.fn<LocationService['getLocation']>().mockResolvedValue(navaluenga) };
  const logger = { warn: vi.fn() };
  const service = createAirQualityService({
    provider,
    locationService,
    refreshIntervalMs,
    logger,
    now: clock.now,
  });
  return { clock, provider, service, logger };
}

describe('createAirQualityService', () => {
  it('devuelve los datos con la fecha de actualización', async () => {
    const { service, provider } = createService();

    const report = await service.getAirQuality();

    expect(report).toEqual({
      ...buildAirQuality(),
      updatedAt: '2026-11-23T10:00:00.000Z',
      stale: false,
    });
    expect(provider.fetchAirQuality).toHaveBeenCalledWith(navaluenga);
  });

  it('mantiene la caché al menos una hora aunque el intervalo general sea menor', async () => {
    const { service, provider, clock } = createService(WEATHER_REFRESH_MS);

    await service.getAirQuality();
    clock.advance(AIR_QUALITY_MIN_TTL_MS - 1);
    await service.getAirQuality();
    expect(provider.fetchAirQuality).toHaveBeenCalledTimes(1);

    clock.advance(1);
    await service.getAirQuality();
    expect(provider.fetchAirQuality).toHaveBeenCalledTimes(2);
  });

  it('respeta un intervalo general mayor que una hora', async () => {
    const twoHours = 2 * AIR_QUALITY_MIN_TTL_MS;
    const { service, provider, clock } = createService(twoHours);

    await service.getAirQuality();
    clock.advance(twoHours - 1);
    await service.getAirQuality();

    expect(provider.fetchAirQuality).toHaveBeenCalledTimes(1);
  });

  it('comparte una única petición entre solicitudes simultáneas', async () => {
    const { service, provider } = createService();

    await Promise.all([service.getAirQuality(), service.getAirQuality()]);

    expect(provider.fetchAirQuality).toHaveBeenCalledTimes(1);
  });

  it('devuelve el último dato desactualizado si el proveedor falla', async () => {
    const { service, provider, clock, logger } = createService();

    await service.getAirQuality();
    clock.advance(AIR_QUALITY_MIN_TTL_MS);
    provider.fetchAirQuality.mockRejectedValue(new Error('caído'));

    const report = await service.getAirQuality();
    expect(report.stale).toBe(true);
    expect(report.updatedAt).toBe('2026-11-23T10:00:00.000Z');
    expect(logger.warn).toHaveBeenCalledTimes(1);

    clock.advance(RETRY_AFTER_FAILURE_MS - 1);
    await service.getAirQuality();
    expect(provider.fetchAirQuality).toHaveBeenCalledTimes(2);
  });

  it('lanza un error controlado si falla y no hay datos almacenados', async () => {
    const { service, provider } = createService();
    provider.fetchAirQuality.mockRejectedValue(new Error('caído'));

    await expect(service.getAirQuality()).rejects.toBeInstanceOf(AirQualityUnavailableError);
  });
});
