import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'calendar.db');
const db: DatabaseType = new Database(dbPath);

db.pragma('foreign_keys = ON');

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

export default db;
