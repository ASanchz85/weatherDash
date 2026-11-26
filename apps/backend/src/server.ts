import { config as loadDotenv } from 'dotenv';

import { buildApp, NEWS_DEFAULT_TIME_ZONE } from './app.js';
import { loadConfig } from './config/env.js';
import { ROOT_ENV_PATH } from './config/paths.js';
import { openDatabase } from './database/database.js';
import { createSqliteSnapshotStorage } from './database/sqlite-snapshot-storage.js';
import { createOpenMeteoAirQualityProvider } from './modules/air-quality/air-quality.provider.js';
import { createCommemorationsProvider } from './modules/news/commemorations/commemorations.provider.js';
import { createExpansionProvider } from './modules/news/expansion/expansion.provider.js';
import { createNewsProvider } from './modules/news/news.provider.js';
import { createNewsRepository } from './modules/news/news.repository.js';
import { createOpenMeteoProvider } from './modules/weather/weather.provider.js';

loadDotenv({ path: ROOT_ENV_PATH, quiet: true });

const config = loadConfig();
const { requestTimeoutMs } = config.weather;
const database = openDatabase(config.databasePath);
const europaPress = createNewsProvider({ requestTimeoutMs: config.news.requestTimeoutMs });
const expansion = createExpansionProvider({ requestTimeoutMs: config.news.requestTimeoutMs });
const commemorations = createCommemorationsProvider({
  requestTimeoutMs: config.news.requestTimeoutMs,
  timeZone: config.weather.timezone ?? NEWS_DEFAULT_TIME_ZONE,
});

const app = await buildApp({
  weatherConfig: config.weather,
  uiConfig: config.ui,
  weatherProvider: createOpenMeteoProvider({ requestTimeoutMs }),
  airQualityProvider: createOpenMeteoAirQualityProvider({ requestTimeoutMs }),
  news: {
    config: config.news,
    providers: {
      national: europaPress,
      international: europaPress,
      economy: expansion,
      markets: expansion,
      commemorations,
    },
    repository: createNewsRepository(database),
    autoRefresh: true,
  },
  snapshotStorage: createSqliteSnapshotStorage(database),
  staticDir: config.staticDir,
  prefetchWeather: true,
  logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
});
app.addHook('onClose', async () => {
  database.close();
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Cerrando servidor');
  await app.close();
  process.exit(0);
}

process.once('SIGINT', (signal) => void shutdown(signal));
process.once('SIGTERM', (signal) => void shutdown(signal));

await app.listen({ host: config.host, port: config.port });
