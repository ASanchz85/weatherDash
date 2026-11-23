import { CloudOff, Cloud, Flower2, Gauge, Haze, Leaf, Sparkles, Sun } from 'lucide-react';

import { Metric, type MetricTone } from '../../components/Metric';
import type { AirQualityData } from '../../types/airQuality';
import type { WeatherData } from '../../types/weather';
import type { AirQualityState, WeatherState } from '../dashboard/useDashboardData';
import detailsStyles from '../weather/WeatherDetails.module.css';
import { formatPercentage, formatUpdatedAt, formatWindSpeed } from '../weather/weatherFormat';
import { weatherStatus } from '../weather/weatherStatus';
import weatherMessageStyles from '../weather/WeatherPanel.module.css';
import styles from './WindAirPanel.module.css';
import { WindRose } from './WindRose';
import {
  airQualityLevel,
  formatMicrograms,
  formatPollen,
  formatPressure,
  formatUvIndex,
  formatWindDirection,
  type AirQualityTone,
} from './windAirFormat';

interface WindAirPanelProps {
  weather: WeatherState;
  airQuality: AirQualityState;
}

const TONE_BY_AIR_QUALITY: Readonly<Record<AirQualityTone, MetricTone>> = {
  good: 'good',
  fair: 'good',
  moderate: 'warning',
  poor: 'accent',
  'very-poor': 'danger',
  extreme: 'danger',
};

function airQualityStatus(state: AirQualityState): string | null {
  if (state.status !== 'ready') return null;
  return state.data.stale || state.refreshFailed ? 'Aire desactualizado' : null;
}

function AirQualityMetrics({ data }: { data: AirQualityData }) {
  const level = airQualityLevel(data.europeanAqi);

  return (
    <dl className={styles.airMetrics}>
      <Metric
        icon={Leaf}
        label="Calidad del aire"
        value={data.europeanAqi === null ? '—' : String(Math.round(data.europeanAqi))}
        {...(level ? { detail: level.label, tone: TONE_BY_AIR_QUALITY[level.tone] } : {})}
        compact
        wide
      />
      <Metric icon={Haze} label="PM2,5" value={formatMicrograms(data.pm25)} compact />
      <Metric icon={Sparkles} label="Polvo" value={formatMicrograms(data.dust)} compact />
      <Metric icon={Flower2} label="Polen" value={formatPollen(data.pollen)} compact />
      <Metric icon={Sun} label="Índice UV" value={formatUvIndex(data.uvIndex)} compact />
    </dl>
  );
}

/** El fallo de la calidad del aire solo afecta a su bloque; el viento y la presión siguen visibles. */
function AirQualityBlock({ state }: { state: AirQualityState }) {
  switch (state.status) {
    case 'loading':
      return (
        <p className={styles.airMessage} aria-busy="true">
          Cargando calidad del aire…
        </p>
      );
    case 'error':
      return (
        <p className={styles.airMessage} role="status">
          <CloudOff className={styles.airMessageIcon} strokeWidth={1.5} aria-hidden="true" />
          Calidad del aire no disponible
        </p>
      );
    case 'ready':
      return <AirQualityMetrics data={state.data} />;
  }
}

interface WindAirDetailsProps {
  data: WeatherData;
  weatherRefreshFailed: boolean;
  airQuality: AirQualityState;
}

function WindAirDetails({ data, weatherRefreshFailed, airQuality }: WindAirDetailsProps) {
  const { location, current } = data;
  const status = weatherStatus(data, weatherRefreshFailed) ?? airQualityStatus(airQuality);

  return (
    <article className={detailsStyles.details}>
      <header className={detailsStyles.header}>
        <div>
          <h2 className={detailsStyles.location}>{location.name}</h2>
          <p className={detailsStyles.country}>Viento y calidad del aire</p>
        </div>
        {status && (
          <p className={detailsStyles.badge} role="status">
            {status}
          </p>
        )}
      </header>

      <div className={styles.body}>
        <section className={styles.wind} aria-label="Viento">
          <WindRose directionDegrees={current.windDirection} className={styles.rose} />
          <div>
            <p className={styles.speed}>
              {Math.round(current.windSpeed)}
              <span className={styles.unit}>km/h</span>
            </p>
            <p className={styles.windDetail}>Dirección {formatWindDirection(current.windDirection)}</p>
            <p className={styles.windDetail}>
              Rachas {current.windGusts === null ? '—' : formatWindSpeed(current.windGusts)}
            </p>
          </div>
        </section>

        <div className={styles.conditions}>
          <dl className={styles.airMetrics}>
            <Metric icon={Gauge} label="Presión" value={formatPressure(current.pressure)} compact />
            <Metric icon={Cloud} label="Nubosidad" value={formatPercentage(current.cloudCover)} compact />
          </dl>
          <AirQualityBlock state={airQuality} />
        </div>
      </div>

      <footer className={detailsStyles.footer}>
        Actualizado: <time dateTime={data.updatedAt}>{formatUpdatedAt(data.updatedAt)}</time>
      </footer>
    </article>
  );
}

/** Segunda vista de la card lateral: viento (con rosa de los vientos) y calidad del aire. */
export function WindAirPanel({ weather, airQuality }: WindAirPanelProps) {
  switch (weather.status) {
    case 'loading':
      return (
        <div className={weatherMessageStyles.message} aria-busy="true">
          <p className={weatherMessageStyles.messageTitle}>Cargando viento y aire…</p>
        </div>
      );
    case 'error':
      return (
        <div className={weatherMessageStyles.message} role="alert">
          <CloudOff className={weatherMessageStyles.messageIcon} strokeWidth={1.5} aria-hidden="true" />
          <p className={weatherMessageStyles.messageTitle}>Viento y aire no disponibles</p>
          <p className={weatherMessageStyles.messageDetail}>{weather.message}</p>
          <p className={weatherMessageStyles.messageDetail}>Se reintentará automáticamente.</p>
        </div>
      );
    case 'ready':
      return (
        <WindAirDetails
          data={weather.data}
          weatherRefreshFailed={weather.refreshFailed}
          airQuality={airQuality}
        />
      );
  }
}
