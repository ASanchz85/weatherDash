import type { WeatherCondition } from './weather.types.js';

/** Interpretación de los códigos WMO 4677 utilizados por Open-Meteo. */
const WMO_CONDITIONS: Readonly<Record<number, WeatherCondition>> = {
  0: { description: 'Despejado', icon: 'clear' },
  1: { description: 'Mayormente despejado', icon: 'mostly-clear' },
  2: { description: 'Parcialmente nuboso', icon: 'partly-cloudy' },
  3: { description: 'Cubierto', icon: 'cloudy' },
  45: { description: 'Niebla', icon: 'fog' },
  48: { description: 'Niebla con escarcha', icon: 'fog' },
  51: { description: 'Llovizna ligera', icon: 'drizzle' },
  53: { description: 'Llovizna moderada', icon: 'drizzle' },
  55: { description: 'Llovizna intensa', icon: 'drizzle' },
  56: { description: 'Llovizna helada ligera', icon: 'sleet' },
  57: { description: 'Llovizna helada intensa', icon: 'sleet' },
  61: { description: 'Lluvia ligera', icon: 'rain' },
  63: { description: 'Lluvia moderada', icon: 'rain' },
  65: { description: 'Lluvia intensa', icon: 'rain' },
  66: { description: 'Lluvia helada ligera', icon: 'sleet' },
  67: { description: 'Lluvia helada intensa', icon: 'sleet' },
  71: { description: 'Nevada ligera', icon: 'snow' },
  73: { description: 'Nevada moderada', icon: 'snow' },
  75: { description: 'Nevada intensa', icon: 'snow' },
  77: { description: 'Granos de nieve', icon: 'snow' },
  80: { description: 'Chubascos ligeros', icon: 'showers' },
  81: { description: 'Chubascos moderados', icon: 'showers' },
  82: { description: 'Chubascos violentos', icon: 'showers' },
  85: { description: 'Chubascos de nieve ligeros', icon: 'snow' },
  86: { description: 'Chubascos de nieve intensos', icon: 'snow' },
  95: { description: 'Tormenta', icon: 'thunderstorm' },
  96: { description: 'Tormenta con granizo ligero', icon: 'thunderstorm' },
  99: { description: 'Tormenta con granizo fuerte', icon: 'thunderstorm' },
};

const UNKNOWN_CONDITION: WeatherCondition = { description: 'Condición desconocida', icon: 'unknown' };

export function interpretWeatherCode(code: number): WeatherCondition {
  return WMO_CONDITIONS[code] ?? UNKNOWN_CONDITION;
}
