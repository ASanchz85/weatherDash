import type { WeatherIconName } from '../../types/weather';

/** Color con el que se destaca una condición: naranja para el sol, azul para la lluvia. */
export type WeatherTone = 'sun' | 'rain' | 'neutral';

const RAIN_ICONS: ReadonlySet<WeatherIconName> = new Set<WeatherIconName>([
  'drizzle',
  'rain',
  'sleet',
  'showers',
  'thunderstorm',
]);

const SUNNY_ICONS: ReadonlySet<WeatherIconName> = new Set<WeatherIconName>(['clear', 'mostly-clear']);

/** La lluvia tiene prioridad; solo cuenta como soleado un cielo despejado de día. */
export function weatherTone(icon: WeatherIconName, isDay: boolean): WeatherTone {
  if (RAIN_ICONS.has(icon)) return 'rain';
  if (isDay && SUNNY_ICONS.has(icon)) return 'sun';
  return 'neutral';
}
