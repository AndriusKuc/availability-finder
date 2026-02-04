declare module 'better-sqlite3-session-store' {
  import session from 'express-session';
  import { Database } from 'better-sqlite3';

  interface StoreOptions {
    client: Database;
    expired?: {
      clear?: boolean;
      intervalMs?: number;
    };
  }

  export default function SqliteStore(
    session: typeof import('express-session')
  ): new (options: StoreOptions) => session.Store;
}
