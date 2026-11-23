import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from './env.js';
import { DEFAULT_DATABASE_PATH, ROOT_PATH } from './paths.js';

describe('loadConfig', () => {
  it('aplica valores por defecto razonables', () => {
    const config = loadConfig({});

    expect(config.port).toBe(3000);
    expect(config.staticDir).toBeNull();
    expect(config.weather).toMatchObject({
      locationName: 'Navaluenga',
      fallbackLocationName: 'Ávila',
      countryCode: 'ES',
      coordinates: null,
      refreshIntervalMs: 900000,
    });
    expect(config.ui).toEqual({ rotationIntervalMs: 300000 });
  });

  it('permite configurar o desactivar la rotación de vistas', () => {
    expect(loadConfig({ UI_ROTATION_INTERVAL: '60000' }).ui.rotationIntervalMs).toBe(60000);
    expect(loadConfig({ UI_ROTATION_INTERVAL: '0' }).ui.rotationIntervalMs).toBe(0);
    expect(loadConfig({ UI_ROTATION_INTERVAL: '' }).ui.rotationIntervalMs).toBe(300000);
  });

  it('interpreta coordenadas explícitas y trata las variables vacías como no definidas', () => {
    const config = loadConfig({
      WEATHER_LATITUDE: '40.65',
      WEATHER_LONGITUDE: '-4.70',
      WEATHER_TIMEZONE: '',
    });

    expect(config.weather.coordinates).toEqual({ latitude: 40.65, longitude: -4.7 });
    expect(config.weather.timezone).toBeNull();
  });

  it('ubica la base de datos en data/ por defecto y resuelve rutas relativas desde la raíz', () => {
    expect(loadConfig({}).databasePath).toBe(DEFAULT_DATABASE_PATH);
    expect(loadConfig({ DATABASE_PATH: '' }).databasePath).toBe(DEFAULT_DATABASE_PATH);
    expect(loadConfig({ DATABASE_PATH: 'otra/db.sqlite' }).databasePath).toBe(
      join(ROOT_PATH, 'otra/db.sqlite'),
    );
    expect(loadConfig({ DATABASE_PATH: '/var/lib/wd.db' }).databasePath).toBe('/var/lib/wd.db');
  });

  it('sirve el frontend compilado solo en producción', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).staticDir).toMatch(/frontend[\\/]dist$/);
  });

  it('rechaza configuraciones no válidas', () => {
    expect(() => loadConfig({ WEATHER_LATITUDE: '40.65' })).toThrow(ConfigError);
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(ConfigError);
    expect(() => loadConfig({ WEATHER_REFRESH_INTERVAL: '1000' })).toThrow(ConfigError);
    expect(() => loadConfig({ UI_ROTATION_INTERVAL: '5000' })).toThrow(ConfigError);
    expect(() => loadConfig({ UI_ROTATION_INTERVAL: '-1' })).toThrow(ConfigError);
  });
});
