import type { WeatherData } from '../types/weather';

export function buildWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    location: { name: 'Navaluenga', country: 'España' },
    current: {
      temperature: 8.4,
      apparentTemperature: 6.1,
      relativeHumidity: 72,
      windSpeed: 12.6,
      precipitationProbability: 10,
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      isDay: true,
    },
    daily: { temperatureMax: 11.9, temperatureMin: 0.8 },
    updatedAt: '2026-11-23T10:45:00.000Z',
    stale: false,
    ...overrides,
  };
}
