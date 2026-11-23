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

export interface DailyForecast {
  /** Fecha local de la localidad (YYYY-MM-DD); el primer elemento es hoy. */
  date: string;
  weatherCode: number;
  description: string;
  icon: WeatherIconName;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbabilityMax: number | null;
}

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
  forecast: DailyForecast[];
  updatedAt: string;
  stale: boolean;
}
