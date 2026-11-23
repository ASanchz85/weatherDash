import { memo } from 'react';

import styles from './Clock.module.css';
import { formatDate, formatTime } from './dateTimeFormat';
import { useCurrentTime } from './useCurrentTime';

interface ClockDateProps {
  weekday: string;
  fullDate: string;
}

/** Memorizado: recibe cadenas, por lo que solo vuelve a renderizar cuando cambia el día. */
const ClockDate = memo(function ClockDate({ weekday, fullDate }: ClockDateProps) {
  return (
    <p className={styles.date}>
      <span className={styles.weekday}>{weekday}</span>
      <span className={styles.fullDate}>{fullDate}</span>
    </p>
  );
});

/** El estado del reloj vive aquí para que su tic de cada segundo no afecte al resto del dashboard. */
export function Clock() {
  const now = useCurrentTime();
  const { hours, minutes, seconds } = formatTime(now);
  const { weekday, fullDate } = formatDate(now);

  return (
    <div className={styles.clock}>
      <time className={styles.time} dateTime={now.toISOString()} aria-label={`${hours}:${minutes}:${seconds}`}>
        <span className={styles.hoursMinutes}>
          {hours}
          <span className={styles.separator}>:</span>
          {minutes}
        </span>
        <span className={styles.seconds} data-testid="clock-seconds">
          {seconds}
        </span>
      </time>
      <ClockDate weekday={weekday} fullDate={fullDate} />
    </div>
  );
}
