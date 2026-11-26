import { useEffect, useState } from 'react';

import styles from './MoonPhase.module.css';
import { describeMoonPhase, getMoonPhase, type MoonPhase as MoonPhaseData } from './moonPhase';
import { MoonPhaseIcon } from './MoonPhaseIcon';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** La iluminación cambia muy despacio: basta recalcularla cada pocos minutos. */
function useMoonPhase(): MoonPhaseData {
  const [phase, setPhase] = useState(() => getMoonPhase(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setPhase(getMoonPhase(new Date())), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return phase;
}

/** Fase lunar discreta para el pie del hero: icono y frase corta. */
export function MoonPhase() {
  const phase = useMoonPhase();

  return (
    <p className={styles.moon} data-testid="moon-phase">
      <MoonPhaseIcon illumination={phase.illumination} waxing={phase.waxing} />
      <span>{describeMoonPhase(phase)}</span>
    </p>
  );
}
