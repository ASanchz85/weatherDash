import { config as loadDotenv } from 'dotenv';

import { buildApp } from './app.js';
import { loadConfig } from './config/env.js';
import { ROOT_ENV_PATH } from './config/paths.js';
import { createOpenMeteoProvider } from './modules/weather/weather.provider.js';

loadDotenv({ path: ROOT_ENV_PATH, quiet: true });

const config = loadConfig();

const app = await buildApp({
  weatherConfig: config.weather,
  weatherProvider: createOpenMeteoProvider({ requestTimeoutMs: config.weather.requestTimeoutMs }),
  staticDir: config.staticDir,
  prefetchWeather: true,
  logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Cerrando servidor');
  await app.close();
  process.exit(0);
}

process.once('SIGINT', (signal) => void shutdown(signal));
process.once('SIGTERM', (signal) => void shutdown(signal));

await app.listen({ host: config.host, port: config.port });
