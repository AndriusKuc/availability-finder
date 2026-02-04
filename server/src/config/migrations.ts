import type { Database as DatabaseType } from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseType) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS surveys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          survey_id INTEGER NOT NULL,
          person_name TEXT NOT NULL,
          unavailable_dates TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
          UNIQUE(survey_id, person_name COLLATE NOCASE)
        );
      `);
    },
  },
  {
    version: 2,
    name: 'add_survey_date_range',
    up: (db) => {
      // Check if columns already exist (handles case where schema was created inline)
      const columns = db
        .prepare("PRAGMA table_info(surveys)")
        .all() as { name: string }[];
      const columnNames = columns.map((c) => c.name);

      if (!columnNames.includes('start_date')) {
        const today = new Date().toISOString().split('T')[0];
        db.exec(`ALTER TABLE surveys ADD COLUMN start_date TEXT NOT NULL DEFAULT '${today}'`);
      }

      if (!columnNames.includes('end_date')) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const nextYearStr = nextYear.toISOString().split('T')[0];
        db.exec(`ALTER TABLE surveys ADD COLUMN end_date TEXT NOT NULL DEFAULT '${nextYearStr}'`);
      }
    },
  },
  {
    version: 3,
    name: 'add_submission_edit_token',
    up: (db) => {
      // Check if column already exists
      const columns = db
        .prepare("PRAGMA table_info(submissions)")
        .all() as { name: string }[];
      const columnNames = columns.map((c) => c.name);

      if (!columnNames.includes('edit_token')) {
        // Add the column (SQLite doesn't support adding UNIQUE constraint in ALTER)
        db.exec(`ALTER TABLE submissions ADD COLUMN edit_token TEXT`);

        // Generate tokens for existing submissions
        const submissions = db.prepare('SELECT id FROM submissions').all() as { id: number }[];
        const updateStmt = db.prepare('UPDATE submissions SET edit_token = ? WHERE id = ?');

        for (const sub of submissions) {
          updateStmt.run(randomUUID(), sub.id);
        }

        // Create index for fast token lookups
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_edit_token ON submissions(edit_token)`);
      }
    },
  },
];

export function runMigrations(db: DatabaseType): void {
  db.pragma('foreign_keys = ON');

  // Get current schema version
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  // Get pending migrations
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    console.log(`Database is up to date (version ${currentVersion})`);
    return;
  }

  console.log(
    `Running ${pending.length} migration(s) from version ${currentVersion}...`
  );

  for (const migration of pending) {
    console.log(`  → Running migration ${migration.version}: ${migration.name}`);

    // Run migration in a transaction
    const runMigration = db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    });

    try {
      runMigration();
      console.log(`    ✓ Migration ${migration.version} complete`);
    } catch (error) {
      console.error(`    ✗ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  console.log(`Database migrated to version ${pending[pending.length - 1].version}`);
}
