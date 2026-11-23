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

export interface HourlyForecast {
  /** Hora local de la localidad (YYYY-MM-DDTHH:mm). */
  time: string;
  temperature: number | null;
  precipitationProbability: number | null;
  weatherCode: number;
  icon: WeatherIconName;
  isDay: boolean;
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
    /** Dirección de la que viene el viento, en grados (0 = norte). */
    windDirection: number | null;
    windGusts: number | null;
    /** Presión reducida al nivel del mar, en hPa. */
    pressure: number | null;
    cloudCover: number | null;
    precipitationProbability: number | null;
    weatherCode: number;
    description: string;
    icon: WeatherIconName;
    isDay: boolean;
  };
  daily: {
    temperatureMax: number | null;
    temperatureMin: number | null;
    /** Hora local de hoy (YYYY-MM-DDTHH:mm). */
    sunrise: string | null;
    sunset: string | null;
  };
  forecast: DailyForecast[];
  /** Próximas horas, empezando por la hora en curso. */
  hourly: HourlyForecast[];
  updatedAt: string;
  stale: boolean;
  /** Milisegundos hasta que conviene volver a consultar, calculados por el servidor. */
  nextRefreshInMs: number;
}
