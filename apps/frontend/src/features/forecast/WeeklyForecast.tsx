import { Umbrella } from 'lucide-react';

import type { DailyForecast } from '../../types/weather';
import { WeatherIcon } from '../weather/WeatherIcon';
import { formatPercentage, formatTemperature } from '../weather/weatherFormat';
import type { WeatherState } from '../dashboard/useDashboardData';
import styles from './WeeklyForecast.module.css';
import { formatWeekdayShort } from './forecastFormat';

interface WeeklyForecastProps {
  state: WeatherState;
}

interface ForecastDayProps {
  day: DailyForecast;
  isToday: boolean;
}

function ForecastDay({ day, isToday }: ForecastDayProps) {
  return (
    <li className={isToday ? `${styles.day} ${styles.today}` : styles.day}>
      <time className={styles.weekday} dateTime={day.date}>
        {isToday ? 'Hoy' : formatWeekdayShort(day.date)}
      </time>
      <WeatherIcon name={day.icon} isDay className={styles.icon} />
      <span className={styles.srOnly}>{day.description}</span>
      <p className={styles.temperatures}>
        <span className={styles.max}>{formatTemperature(day.temperatureMax)}</span>
        <span className={styles.min}>{formatTemperature(day.temperatureMin)}</span>
      </p>
      <p className={styles.rain}>
        <Umbrella className={styles.rainIcon} strokeWidth={1.75} aria-hidden="true" />
        {formatPercentage(day.precipitationProbabilityMax)}
      </p>
    </li>
  );
}

export function WeeklyForecast({ state }: WeeklyForecastProps) {
  switch (state.status) {
    case 'loading':
      return (
        <p className={styles.message} aria-busy="true">
          Cargando predicción…
        </p>
      );
    case 'error':
      // role="status" y no "alert": el panel meteorológico ya anuncia el error.
      return (
        <p className={styles.message} role="status">
          Predicción no disponible
        </p>
      );
    case 'ready':
      return (
        <ol className={styles.days}>
          {state.data.forecast.map((day, index) => (
            <ForecastDay key={day.date} day={day} isToday={index === 0} />
          ))}
        </ol>
      );
  }
}
