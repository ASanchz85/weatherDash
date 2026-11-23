import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from './app.js';
import type { WeatherProvider } from './modules/weather/weather.provider.js';
import { buildSnapshot, weatherConfig } from './test/fixtures.js';

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

async function createTestApp(fetchForecast: WeatherProvider['fetchForecast']) {
  const app = await buildApp({
    weatherConfig: { ...weatherConfig, coordinates: { latitude: 40.41, longitude: -4.71 } },
    weatherProvider: { geocode: vi.fn(), fetchForecast },
    staticDir: null,
    now: () => Date.UTC(2026, 10, 23, 10),
  });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('API REST', () => {
  it('GET /api/health responde ok', async () => {
    const app = await createTestApp(vi.fn());
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('GET /api/weather devuelve la información normalizada', async () => {
    const app = await createTestApp(vi.fn().mockResolvedValue(buildSnapshot()));
    const response = await app.inject({ method: 'GET', url: '/api/weather' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json()).toEqual({
      ...buildSnapshot(),
      updatedAt: '2026-11-23T10:00:00.000Z',
      stale: false,
    });
  });

  it('GET /api/weather responde 503 si no hay datos disponibles', async () => {
    const app = await createTestApp(vi.fn().mockRejectedValue(new Error('Open-Meteo caído')));
    const response = await app.inject({ method: 'GET', url: '/api/weather' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: 'WEATHER_UNAVAILABLE' });
  });
});
