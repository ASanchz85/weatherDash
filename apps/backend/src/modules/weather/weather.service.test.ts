import { describe, expect, it, vi } from 'vitest';

import { buildSnapshot, weatherConfig } from '../../test/fixtures.js';
import type { GeocodedPlace, WeatherProvider } from './weather.provider.js';
import {
  createWeatherService,
  LocationNotFoundError,
  RETRY_AFTER_FAILURE_MS,
  WeatherUnavailableError,
} from './weather.service.js';

const place: GeocodedPlace = {
  name: 'Navaluenga',
  country: 'España',
  latitude: 40.41,
  longitude: -4.71,
  timezone: 'Europe/Madrid',
};

function createFakeProvider() {
  return {
    geocode: vi.fn<WeatherProvider['geocode']>().mockResolvedValue(place),
    fetchForecast: vi.fn<WeatherProvider['fetchForecast']>().mockResolvedValue(buildSnapshot()),
  };
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

describe('createWeatherService', () => {
  it('devuelve datos frescos con la fecha de actualización', async () => {
    const provider = createFakeProvider();
    const clock = createClock();
    const service = createWeatherService({ provider, config: weatherConfig, now: clock.now });

    const report = await service.getWeather();

    expect(report.stale).toBe(false);
    expect(report.updatedAt).toBe('2026-11-23T10:00:00.000Z');
    expect(report.current.temperature).toBe(8.4);
  });

  it('reutiliza la caché mientras no expira el intervalo de actualización', async () => {
    const provider = createFakeProvider();
    const clock = createClock();
    const service = createWeatherService({ provider, config: weatherConfig, now: clock.now });

    await service.getWeather();
    clock.advance(weatherConfig.refreshIntervalMs - 1);
    await service.getWeather();
    expect(provider.fetchForecast).toHaveBeenCalledTimes(1);

    clock.advance(1);
    await service.getWeather();
    expect(provider.fetchForecast).toHaveBeenCalledTimes(2);
    expect(provider.geocode).toHaveBeenCalledTimes(1);
  });

  it('comparte una única petición entre solicitudes simultáneas', async () => {
    const provider = createFakeProvider();
    const service = createWeatherService({ provider, config: weatherConfig });

    await Promise.all([service.getWeather(), service.getWeather(), service.getWeather()]);

    expect(provider.geocode).toHaveBeenCalledTimes(1);
    expect(provider.fetchForecast).toHaveBeenCalledTimes(1);
  });

  it('devuelve la última información válida marcada como desactualizada si el proveedor falla', async () => {
    const provider = createFakeProvider();
    const clock = createClock();
    const service = createWeatherService({ provider, config: weatherConfig, now: clock.now });

    await service.getWeather();
    clock.advance(weatherConfig.refreshIntervalMs);
    provider.fetchForecast.mockRejectedValue(new Error('Open-Meteo caído'));

    const report = await service.getWeather();
    expect(report.stale).toBe(true);
    expect(report.updatedAt).toBe('2026-11-23T10:00:00.000Z');
  });

  it('espera antes de reintentar tras un fallo y se recupera después', async () => {
    const provider = createFakeProvider();
    const clock = createClock();
    const service = createWeatherService({ provider, config: weatherConfig, now: clock.now });

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
    const service = createWeatherService({ provider, config: weatherConfig, logger });

    await expect(service.getWeather()).rejects.toBeInstanceOf(WeatherUnavailableError);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('usa la localidad de respaldo si la principal no se encuentra', async () => {
    const provider = createFakeProvider();
    provider.geocode.mockImplementation(async (name) =>
      name === 'Ávila' ? { ...place, name: 'Ávila' } : null,
    );
    const service = createWeatherService({ provider, config: weatherConfig });

    await service.getWeather();

    expect(provider.geocode).toHaveBeenNthCalledWith(1, 'Navaluenga', 'ES');
    expect(provider.geocode).toHaveBeenNthCalledWith(2, 'Ávila', 'ES');
    expect(provider.fetchForecast).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ávila' }));
  });

  it('falla de forma controlada si no encuentra ninguna localidad', async () => {
    const provider = createFakeProvider();
    provider.geocode.mockResolvedValue(null);
    const service = createWeatherService({ provider, config: weatherConfig });

    const error = await service.getWeather().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(WeatherUnavailableError);
    expect(error instanceof Error && error.cause).toBeInstanceOf(LocationNotFoundError);
  });

  it('no usa geocoding si las coordenadas están configuradas', async () => {
    const provider = createFakeProvider();
    const service = createWeatherService({
      provider,
      config: { ...weatherConfig, coordinates: { latitude: 40.65, longitude: -4.7 } },
    });

    await service.getWeather();

    expect(provider.geocode).not.toHaveBeenCalled();
    expect(provider.fetchForecast).toHaveBeenCalledWith({
      name: 'Navaluenga',
      country: 'España',
      latitude: 40.65,
      longitude: -4.7,
      timezone: 'Europe/Madrid',
    });
  });
});
