import { fileURLToPath } from 'node:url';

// Las rutas se calculan respecto a este archivo, que ocupa la misma profundidad en src/ y en dist/.
export const ROOT_ENV_PATH = fileURLToPath(new URL('../../../../.env', import.meta.url));
export const FRONTEND_DIST_PATH = fileURLToPath(new URL('../../../frontend/dist', import.meta.url));
