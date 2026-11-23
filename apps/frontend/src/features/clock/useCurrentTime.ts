import { useEffect, useState } from 'react';

const MS_PER_SECOND = 1000;

/**
 * Devuelve la hora actual actualizada al inicio de cada segundo.
 * Cada tic se programa a partir del reloj del sistema, así que los retrasos del
 * navegador no se acumulan; solo existe un temporizador pendiente en cada momento.
 */
export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: number | undefined;

    const tick = () => {
      setNow(new Date());
      schedule();
    };

    const schedule = () => {
      window.clearTimeout(timeoutId);
      const delayUntilNextSecond = MS_PER_SECOND - (Date.now() % MS_PER_SECOND);
      timeoutId = window.setTimeout(tick, delayUntilNextSecond);
    };

    // Al volver a ser visible, la pestaña puede haber acumulado retraso por la limitación de temporizadores.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick();
    };

    schedule();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return now;
}
