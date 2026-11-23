import { ArrowDown, ArrowUp, Droplets, Thermometer, Umbrella, Wind, type LucideIcon } from 'lucide-react';

import type { WeatherData } from '../../types/weather';
import styles from './WeatherDetails.module.css';
import { WeatherIcon } from './WeatherIcon';
import {
  formatPercentage,
  formatTemperature,
  formatUpdatedAt,
  formatWindSpeed,
} from './weatherFormat';

interface WeatherDetailsProps {
  data: WeatherData;
  refreshFailed: boolean;
}

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  highlighted?: boolean;
}

function Metric({ icon: Icon, label, value, highlighted = false }: MetricProps) {
  return (
    <div className={highlighted ? `${styles.metric} ${styles.metricHighlighted}` : styles.metric}>
      <dt className={styles.metricLabel}>
        <Icon className={styles.metricIcon} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </dt>
      <dd className={styles.metricValue}>{value}</dd>
    </div>
  );
}

function statusMessage(data: WeatherData, refreshFailed: boolean): string | null {
  if (refreshFailed) return 'Sin conexión con el servidor';
  if (data.stale) return 'Datos desactualizados';
  return null;
}

export function WeatherDetails({ data, refreshFailed }: WeatherDetailsProps) {
  const { location, current, daily } = data;
  const status = statusMessage(data, refreshFailed);

  return (
    <article className={styles.details}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.location}>{location.name}</h2>
          <p className={styles.country}>{location.country}</p>
        </div>
        {status && (
          <p className={styles.badge} role="status">
            {status}
          </p>
        )}
      </header>

      <div className={styles.summary}>
        <div className={styles.now}>
          <WeatherIcon name={current.icon} isDay={current.isDay} className={styles.conditionIcon} />
          <div>
            <p className={styles.temperature}>
              {formatTemperature(current.temperature)}
              <span className={styles.unit}>C</span>
            </p>
            <p className={styles.description}>{current.description}</p>
          </div>
        </div>

        <p className={styles.range}>
          <span className={styles.rangeItem}>
            <ArrowUp className={styles.rangeIcon} aria-hidden="true" />
            Máx {formatTemperature(daily.temperatureMax)}
          </span>
          <span className={styles.rangeItem}>
            <ArrowDown className={styles.rangeIcon} aria-hidden="true" />
            Mín {formatTemperature(daily.temperatureMin)}
          </span>
        </p>
      </div>

      <dl className={styles.metrics}>
        <Metric
          icon={Thermometer}
          label="Sensación"
          value={formatTemperature(current.apparentTemperature)}
          highlighted
        />
        <Metric icon={Droplets} label="Humedad" value={formatPercentage(current.relativeHumidity)} />
        <Metric icon={Wind} label="Viento" value={formatWindSpeed(current.windSpeed)} />
        <Metric
          icon={Umbrella}
          label="Precipitación"
          value={formatPercentage(current.precipitationProbability)}
        />
      </dl>

      <footer className={styles.footer}>
        Actualizado: <time dateTime={data.updatedAt}>{formatUpdatedAt(data.updatedAt)}</time>
      </footer>
    </article>
  );
}
