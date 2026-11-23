import { ArrowDown, ArrowUp, Droplets, Thermometer, Umbrella, Wind } from 'lucide-react';

import { Metric } from '../../components/Metric';
import type { WeatherData } from '../../types/weather';
import styles from './WeatherDetails.module.css';
import { WeatherIcon } from './WeatherIcon';
import {
  formatPercentage,
  formatTemperature,
  formatUpdatedAt,
  formatWindSpeed,
} from './weatherFormat';
import { weatherStatus } from './weatherStatus';

interface WeatherDetailsProps {
  data: WeatherData;
  refreshFailed: boolean;
}

export function WeatherDetails({ data, refreshFailed }: WeatherDetailsProps) {
  const { location, current, daily } = data;
  const status = weatherStatus(data, refreshFailed);

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
