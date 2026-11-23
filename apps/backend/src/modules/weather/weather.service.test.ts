import { describe, expect, it, vi } from 'vitest';

import { buildSnapshot, navaluenga, weatherConfig } from '../../test/fixtures.js';
import { LocationNotFoundError, type LocationService } from '../location/location.service.js';
import type { WeatherProvider } from './weather.provider.js';
import {
  createWeatherService,
  RETRY_AFTER_FAILURE_MS,
  WeatherUnavailableError,
} from './weather.service.js';

function createFakeProvider() {
  return {
    geocode: vi.fn<WeatherProvider['geocode']>(),
    fetchForecast: vi.fn<WeatherProvider['fetchForecast']>().mockResolvedValue(buildSnapshot()),
  };
}

function createFakeLocationService() {
  return { getLocation: vi.fn<LocationService['getLocation']>().mockResolvedValue(navaluenga) };
}

function createClock(start = Date.UTC(2026, 10, 23, 10)) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

function createService(overrides: { provider?: ReturnType<typeof createFakeProvider>; now?: () => number } = {}) {
  const provider = overrides.provider ?? createFakeProvider();
  const locationService = createFakeLocationService();
  const service = createWeatherService({
    provider,
    locationService,
    config: weatherConfig,
    ...(overrides.now ? { now: overrides.now } : {}),
  });
  return { provider, locationService, service };
}

describe('createWeatherService', () => {
  it('devuelve datos frescos con la fecha de actualización y el tiempo hasta el próximo refresco', async () => {
    const clock = createClock();
    const { service, provider } = createService({ now: clock.now });

    const report = await service.getWeather();

    expect(report.stale).toBe(false);
    expect(report.updatedAt).toBe('2026-11-23T10:00:00.000Z');
    expect(report.nextRefreshInMs).toBe(weatherConfig.refreshIntervalMs);
    expect(report.current.temperature).toBe(8.4);
    expect(provider.fetchForecast).toHaveBeenCalledWith(navaluenga);
  });

  it('reutiliza la caché mientras no expira el intervalo de actualización', async () => {
    const clock = createClock();
    const { service, provider, locationService } = createService({ now: clock.now });

    await service.getWeather();
    clock.advance(weatherConfig.refreshIntervalMs - 1);
    const cached = await service.getWeather();
    expect(provider.fetchForecast).toHaveBeenCalledTimes(1);
    expect(cached.nextRefreshInMs).toBe(1);

    clock.advance(1);
    await service.getWeather();
    expect(provider.fetchForecast).toHaveBeenCalledTimes(2);
    expect(locationService.getLocation).toHaveBeenCalledTimes(2);
  });

  it('comparte una única petición entre solicitudes simultáneas', async () => {
    const { service, provider } = createService();

    await Promise.all([service.getWeather(), service.getWeather(), service.getWeather()]);

    expect(provider.fetchForecast).toHaveBeenCalledTimes(1);
  });

  it('devuelve la última información válida marcada como desactualizada si el proveedor falla', async () => {
    const clock = createClock();
    const { service, provider } = createService({ now: clock.now });

    await service.getWeather();
    clock.advance(weatherConfig.refreshIntervalMs);
    provider.fetchForecast.mockRejectedValue(new Error('Open-Meteo caído'));

    const report = await service.getWeather();
    expect(report.stale).toBe(true);
    expect(report.updatedAt).toBe('2026-11-23T10:00:00.000Z');
    expect(report.nextRefreshInMs).toBe(RETRY_AFTER_FAILURE_MS);
  });

  it('espera antes de reintentar tras un fallo y se recupera después', async () => {
    const clock = createClock();
    const { service, provider } = createService({ now: clock.now });

    await service.getWeather();
    clock.advance(weatherConfig.refreshIntervalMs);
    provider.fetchForecast.mockRejectedValueOnce(new Error('Open-Meteo caído'));
    await service.getWeather();

    clock.advance(RETRY_AFTER_FAILURE_MS - 1);
    expect((await service.getWeather()).stale).toBe(true);
    expect(provider.fetchForecast).toHaveBeenCalledTimes(2);

    clock.advance(1);
    provider.fetchForecast.mockResolvedValue(buildSnapshot(12));
    const recovered = await service.getWeather();
    expect(recovered.stale).toBe(false);
    expect(recovered.current.temperature).toBe(12);
  });

  it('lanza un error controlado si falla y no hay información almacenada', async () => {
    const provider = createFakeProvider();
    provider.fetchForecast.mockRejectedValue(new Error('Open-Meteo caído'));
    const logger = { warn: vi.fn() };
    const service = createWeatherService({
      provider,
      locationService: createFakeLocationService(),
      config: weatherConfig,
      logger,
    });

    await expect(service.getWeather()).rejects.toBeInstanceOf(WeatherUnavailableError);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('falla de forma controlada si no se encuentra la localidad', async () => {
    const locationService = createFakeLocationService();
    locationService.getLocation.mockRejectedValue(new LocationNotFoundError('sin localidad'));
    const service = createWeatherService({
      provider: createFakeProvider(),
      locationService,
      config: weatherConfig,
    });

    const error = await service.getWeather().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(WeatherUnavailableError);
    expect(error instanceof Error && error.cause).toBeInstanceOf(LocationNotFoundError);
  });
});
