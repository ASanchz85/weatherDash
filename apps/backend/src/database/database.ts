import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database, { type Database as SqliteDatabase } from 'better-sqlite3';

export type { SqliteDatabase };

/** Ruta especial de SQLite para una base de datos en memoria (tests). */
export const IN_MEMORY_DATABASE = ':memory:';

/**
 * Migraciones en orden; la posición + 1 es la versión del esquema que deja aplicada.
 * Nunca se modifica una migración publicada: los cambios se añaden como una nueva al final.
 */
const MIGRATIONS: readonly string[] = [
  `CREATE TABLE snapshots (
     resource   TEXT    PRIMARY KEY,
     payload    TEXT    NOT NULL,
     fetched_at INTEGER NOT NULL
   ) STRICT`,
];

/** Abre (o crea) la base de datos y aplica las migraciones pendientes. */
export function openDatabase(path: string): SqliteDatabase {
  if (path !== IN_MEMORY_DATABASE) mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  // WAL tolera mejor los cortes de corriente y no bloquea lecturas durante una escritura.
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  migrate(db);
  return db;
}

function migrate(db: SqliteDatabase): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  MIGRATIONS.slice(currentVersion).forEach((sql, index) => {
    const version = currentVersion + index + 1;
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version}`);
    })();
  });
}
