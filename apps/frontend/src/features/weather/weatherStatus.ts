import type { WeatherData } from '../../types/weather';

/** Aviso de estado de los datos meteorológicos; null si están al día. */
export function weatherStatus(data: WeatherData, refreshFailed: boolean): string | null {
  if (refreshFailed) return 'Sin conexión con el servidor';
  if (data.stale) return 'Datos desactualizados';
  return null;
}
