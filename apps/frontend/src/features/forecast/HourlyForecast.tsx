import type { WeatherState } from '../dashboard/useDashboardData';
import { Temperature } from '../weather/Temperature';
import { formatTemperature } from '../weather/weatherFormat';
import type { HourlyForecast as HourlyForecastData } from '../../types/weather';
import styles from './HourlyForecast.module.css';
import {
  buildChartPoints,
  buildLineSegments,
  formatHourLabel,
  isLabelledHour,
  toPolylinePoints,
} from './hourlyChart';

interface HourlyForecastProps {
  state: WeatherState;
}

/** Altura máxima de una barra de lluvia (100 %) como porcentaje del área de dibujo. */
const MAX_BAR_PERCENT = 36;
const NOW_LABEL = 'Ahora';

function describeChart(hourly: readonly HourlyForecastData[], temperatures: readonly number[]): string {
  const horizon = `de las próximas ${hourly.length} horas`;
  if (temperatures.length === 0) return `Probabilidad de lluvia ${horizon}`;
  const range = `de ${formatTemperature(Math.min(...temperatures))} a ${formatTemperature(Math.max(...temperatures))}`;
  return `Temperatura y probabilidad de lluvia ${horizon}, ${range}`;
}

function HourlyChart({ hourly }: { hourly: readonly HourlyForecastData[] }) {
  const points = buildChartPoints(hourly);
  const segments = buildLineSegments(points);
  const columns = hourly.length;

  return (
    <div
      className={styles.hourly}
      role="img"
      aria-label={describeChart(
        hourly,
        points.map(({ temperature }) => temperature),
      )}
    >
      <div className={styles.plot}>
        <div className={styles.bars} aria-hidden="true">
          {hourly.map(({ time, precipitationProbability }) => (
            <span key={time} className={styles.slot} data-testid="hourly-slot">
              <span
                className={styles.bar}
                data-testid="hourly-bar"
                style={{ height: `${((precipitationProbability ?? 0) * MAX_BAR_PERCENT) / 100}%` }}
              />
            </span>
          ))}
        </div>

        <svg className={styles.line} viewBox={`0 0 ${columns} 100`} preserveAspectRatio="none" aria-hidden="true">
          {segments.map((segment) => (
            <polyline key={segment[0]?.index} className={styles.path} points={toPolylinePoints(segment)} />
          ))}
        </svg>

        {points.filter(({ index }) => isLabelledHour(index)).map(({ index, x, y, temperature }) => (
          <span
            key={index}
            className={index === 0 ? `${styles.marker} ${styles.now}` : styles.marker}
            style={{ left: `${(x / columns) * 100}%`, top: `${y}%` }}
            aria-hidden="true"
          >
            <Temperature value={temperature} className={styles.temperature} data-testid="hourly-temperature" />
            <span className={styles.dot} />
          </span>
        ))}

        <p className={styles.legend} aria-hidden="true">
          <span className={styles.legendLine}>Temperatura</span>
          <span className={styles.legendRain}>Lluvia</span>
        </p>
      </div>

      <div className={styles.hours} aria-hidden="true">
        {hourly.map(({ time }, index) => (
          <span key={time} className={index === 0 ? styles.nowHour : undefined}>
            {isLabelledHour(index) ? (index === 0 ? NOW_LABEL : formatHourLabel(time)) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Segunda vista de la franja inferior: temperatura y lluvia de las próximas horas. */
export function HourlyForecast({ state }: HourlyForecastProps) {
  switch (state.status) {
    case 'loading':
      return (
        <p className={styles.message} aria-busy="true">
          Cargando próximas horas…
        </p>
      );
    case 'error':
      // role="status" y no "alert": el panel meteorológico ya anuncia el error.
      return (
        <p className={styles.message} role="status">
          Próximas horas no disponibles
        </p>
      );
    case 'ready':
      return state.data.hourly.length === 0 ? (
        <p className={styles.message} role="status">
          Sin datos horarios
        </p>
      ) : (
        <HourlyChart hourly={state.data.hourly} />
      );
  }
}
