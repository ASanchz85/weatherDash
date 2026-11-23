/** Iconos semánticos independientes del proveedor; el frontend decide cómo dibujarlos. */
export type WeatherIcon =
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

export interface WeatherCondition {
  description: string;
  icon: WeatherIcon;
}

export interface CurrentWeather {
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
  icon: WeatherIcon;
  isDay: boolean;
}

export interface DailyWeather {
  temperatureMax: number | null;
  temperatureMin: number | null;
}

export interface DailyForecast {
  /** Fecha local de la localidad (YYYY-MM-DD); el primer elemento es hoy. */
  date: string;
  weatherCode: number;
  description: string;
  icon: WeatherIcon;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbabilityMax: number | null;
}

export interface HourlyForecast {
  /** Hora local de la localidad (YYYY-MM-DDTHH:mm). */
  time: string;
  temperature: number | null;
  precipitationProbability: number | null;
}

/** Modelo interno estable, desacoplado de la respuesta de Open-Meteo. */
export interface WeatherSnapshot {
  location: {
    name: string;
    country: string;
  };
  current: CurrentWeather;
  daily: DailyWeather;
  forecast: DailyForecast[];
  /** Próximas horas, empezando por la hora en curso. */
  hourly: HourlyForecast[];
}

/** Respuesta pública de GET /api/weather. */
export interface WeatherReport extends WeatherSnapshot {
  /** Momento en que se obtuvieron los datos del proveedor (ISO 8601, UTC). */
  updatedAt: string;
  /** true si el proveedor falló y se devuelve la última información válida. */
  stale: boolean;
  /** Milisegundos hasta que conviene volver a consultar (próximo refresco o reintento del backend). */
  nextRefreshInMs: number;
}
