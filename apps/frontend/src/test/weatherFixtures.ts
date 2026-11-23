import type { AirQualityData } from '../types/airQuality';
import type { DailyForecast, HourlyForecast, WeatherData } from '../types/weather';

export const NEXT_REFRESH_IN_MS = 15 * 60 * 1000;

/**
 * 24 horas desde las 18:00 del 23-11-2026 con una curva de temperatura sencilla.
 * De noche (hasta las 06:00) nublado; de día, soleado de 07:00 a 09:00, lluvia a las 10:00 y 11:00 y nublado después.
 */
export function buildHourly(): HourlyForecast[] {
  return Array.from({ length: 24 }, (_, index) => {
    const absoluteHour = 18 + index;
    const day = 23 + Math.floor(absoluteHour / 24);
    const hour = absoluteHour % 24;
    const isDay = index >= 13;
    const condition: Pick<HourlyForecast, 'weatherCode' | 'icon'> =
      index >= 13 && index <= 15
        ? { weatherCode: 0, icon: 'clear' }
        : index === 16 || index === 17
          ? { weatherCode: 61, icon: 'rain' }
          : { weatherCode: 3, icon: 'cloudy' };

    return {
      time: `2026-11-${String(day)}T${String(hour).padStart(2, '0')}:00`,
      temperature: 9 - Math.abs(index - 8) / 2,
      precipitationProbability: index % 6 === 0 ? 20 : 0,
      ...condition,
      isDay,
    };
  });
}

export function buildAirQualityData(overrides: Partial<AirQualityData> = {}): AirQualityData {
  return {
    europeanAqi: 22,
    pm25: 3.3,
    dust: 0,
    uvIndex: 0,
    pollen: { olive: 0, grass: 0 },
    updatedAt: '2026-11-23T10:45:00.000Z',
    stale: false,
    ...overrides,
  };
}

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
      windDirection: 90,
      windGusts: 24.1,
      pressure: 1024.9,
      cloudCover: 96,
      precipitationProbability: 10,
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      isDay: true,
    },
    daily: {
      temperatureMax: 11.9,
      temperatureMin: 0.8,
      sunrise: '2026-11-23T08:11',
      sunset: '2026-11-23T17:49',
    },
    forecast: buildForecast(),
    hourly: buildHourly(),
    updatedAt: '2026-11-23T10:45:00.000Z',
    stale: false,
    nextRefreshInMs: NEXT_REFRESH_IN_MS,
    ...overrides,
  };
}
