import { describe, expect, it, vi } from 'vitest';

import { weatherConfig } from '../../test/fixtures.js';
import type { GeocodedPlace } from './location.types.js';
import { createLocationService, LocationNotFoundError } from './location.service.js';

const place: GeocodedPlace = {
  name: 'Navaluenga',
  country: 'España',
  latitude: 40.41,
  longitude: -4.71,
  timezone: 'Europe/Madrid',
};

function createGeocode() {
  return vi.fn<(name: string, countryCode: string | null) => Promise<GeocodedPlace | null>>().mockResolvedValue(place);
}

describe('createLocationService', () => {
  it('resuelve la localidad por geocoding y la reutiliza', async () => {
    const geocode = createGeocode();
    const service = createLocationService({ geocode, config: weatherConfig });

    const first = await service.getLocation();
    const second = await service.getLocation();

    expect(first).toEqual({
      name: 'Navaluenga',
      country: 'España',
      latitude: 40.41,
      longitude: -4.71,
      timezone: 'Europe/Madrid',
    });
    expect(second).toBe(first);
    expect(geocode).toHaveBeenCalledTimes(1);
    expect(geocode).toHaveBeenCalledWith('Navaluenga', 'ES');
  });

  it('comparte un único geocoding entre solicitudes simultáneas', async () => {
    const geocode = createGeocode();
    const service = createLocationService({ geocode, config: weatherConfig });

    await Promise.all([service.getLocation(), service.getLocation(), service.getLocation()]);

    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it('usa la localidad de respaldo si la principal no se encuentra', async () => {
    const geocode = createGeocode();
    geocode.mockImplementation(async (name) => (name === 'Ávila' ? { ...place, name: 'Ávila' } : null));
    const logger = { warn: vi.fn() };
    const service = createLocationService({ geocode, config: weatherConfig, logger });

    const location = await service.getLocation();

    expect(location.name).toBe('Ávila');
    expect(geocode).toHaveBeenNthCalledWith(1, 'Navaluenga', 'ES');
    expect(geocode).toHaveBeenNthCalledWith(2, 'Ávila', 'ES');
    expect(logger.warn).toHaveBeenCalledWith({ location: 'Navaluenga' }, expect.any(String));
  });

  it('falla de forma controlada si no encuentra ninguna localidad y lo reintenta después', async () => {
    const geocode = createGeocode();
    geocode.mockResolvedValue(null);
    const service = createLocationService({ geocode, config: weatherConfig });

    await expect(service.getLocation()).rejects.toBeInstanceOf(LocationNotFoundError);

    geocode.mockResolvedValue(place);
    await expect(service.getLocation()).resolves.toMatchObject({ name: 'Navaluenga' });
  });

  it('no usa geocoding si las coordenadas están configuradas', async () => {
    const geocode = createGeocode();
    const service = createLocationService({
      geocode,
      config: { ...weatherConfig, coordinates: { latitude: 40.65, longitude: -4.7 } },
    });

    expect(await service.getLocation()).toEqual({
      name: 'Navaluenga',
      country: 'España',
      latitude: 40.65,
      longitude: -4.7,
      timezone: 'Europe/Madrid',
    });
    expect(geocode).not.toHaveBeenCalled();
  });
});
