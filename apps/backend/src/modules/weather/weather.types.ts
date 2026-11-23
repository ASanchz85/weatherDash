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

export interface ResolvedLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  windSpeed: number;
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

/** Modelo interno estable, desacoplado de la respuesta de Open-Meteo. */
export interface WeatherSnapshot {
  location: {
    name: string;
    country: string;
  };
  current: CurrentWeather;
  daily: DailyWeather;
}

/** Respuesta pública de GET /api/weather. */
export interface WeatherReport extends WeatherSnapshot {
  /** Momento en que se obtuvieron los datos del proveedor (ISO 8601, UTC). */
  updatedAt: string;
  /** true si el proveedor falló y se devuelve la última información válida. */
  stale: boolean;
}
