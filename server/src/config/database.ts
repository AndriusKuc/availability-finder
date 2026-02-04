import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'calendar.db');
const db: DatabaseType = new Database(dbPath);

// Run migrations on startup
runMigrations(db);

export default db;
