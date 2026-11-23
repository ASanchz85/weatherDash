import type { DailyForecast, WeatherData } from '../types/weather';

export function buildForecast(): DailyForecast[] {
  const days: Pick<DailyForecast, 'weatherCode' | 'description' | 'icon'>[] = [
    { weatherCode: 2, description: 'Parcialmente nuboso', icon: 'partly-cloudy' },
    { weatherCode: 61, description: 'Lluvia ligera', icon: 'rain' },
    { weatherCode: 3, description: 'Cubierto', icon: 'cloudy' },
    { weatherCode: 1, description: 'Mayormente despejado', icon: 'mostly-clear' },
    { weatherCode: 1, description: 'Mayormente despejado', icon: 'mostly-clear' },
    { weatherCode: 3, description: 'Cubierto', icon: 'cloudy' },
    { weatherCode: 3, description: 'Cubierto', icon: 'cloudy' },
  ];

  return days.map((day, index) => ({
    ...day,
    date: `2026-11-${String(23 + index)}`,
    temperatureMax: 12 - index,
    temperatureMin: 1 + index,
    precipitationProbabilityMax: index === 1 ? 65 : 5 * index,
  }));
}

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
    forecast: buildForecast(),
    updatedAt: '2026-11-23T10:45:00.000Z',
    stale: false,
    ...overrides,
  };
}
