import { useEffect, useState } from 'react';

import type { Theme } from '../../types/theme';

/**
 * Tema que se muestra. El primer dato válido y los cambios con la rotación desactivada se aplican al
 * instante; el resto espera al siguiente ciclo de rotación para cambiar a la vez que las demás vistas.
 */
export function useCommittedTheme(desired: Theme | null, tick: number, isRotating: boolean): Theme {
  const [committed, setCommitted] = useState<Theme>('day');
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (desired === null || (initialised && isRotating)) return;
    setCommitted(desired);
    setInitialised(true);
  }, [desired, initialised, isRotating]);

  useEffect(() => {
    // Solo depende de tick: el tema deseado en ese instante es el que se aplica.
    if (desired !== null) setCommitted(desired);
  }, [tick]);

  return committed;
}
