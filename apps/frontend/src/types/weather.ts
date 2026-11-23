/** Contrato de GET /api/weather. Debe mantenerse alineado con WeatherReport del backend. */

export type WeatherIconName =
  | 'clear'
  | 'mostly-clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'showers'
  | 'thunderstorm'
  | 'unknown';

export interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  current: {
    temperature: number;
    apparentTemperature: number;
    relativeHumidity: number;
    windSpeed: number;
    precipitationProbability: number | null;
    weatherCode: number;
    description: string;
    icon: WeatherIconName;
    isDay: boolean;
  };
  daily: {
    temperatureMax: number | null;
    temperatureMin: number | null;
  };
  updatedAt: string;
  stale: boolean;
}
