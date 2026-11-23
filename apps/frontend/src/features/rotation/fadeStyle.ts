import type { CSSProperties } from 'react';

import { ROTATION_FADE_MS } from '../../config';

export type FadeStyle = CSSProperties & { '--rotation-fade-ms': string };

/** Duración común del fundido, para que el hero y las vistas rotatorias cambien a la vez. */
export const ROTATION_FADE_STYLE: FadeStyle = { '--rotation-fade-ms': `${ROTATION_FADE_MS}ms` };
