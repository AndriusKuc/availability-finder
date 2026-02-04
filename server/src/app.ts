import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';
import db from './config/database';
import SqliteStore from 'better-sqlite3-session-store';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const BetterSqliteStore = SqliteStore(session);

export function createApp(options: { isProduction?: boolean } = {}) {
  const app = express();
  const CLIENT_PORT = process.env.CLIENT_PORT || 5173;
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';

  // Trust proxy (required for secure cookies behind Railway/Heroku/etc)
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // Middleware
  app.use(
    cors({
      origin: isProduction
        ? process.env.CLIENT_URL
        : [`http://localhost:${CLIENT_PORT}`, `http://127.0.0.1:${CLIENT_PORT}`],
      credentials: true,
    })
  );
  app.use(express.json());

  app.use(
    session({
      store: new BetterSqliteStore({
        client: db,
        expired: {
          clear: true,
          intervalMs: 900000,
        },
      }),
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: Number(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
        sameSite: isProduction ? 'strict' : 'lax',
      },
    })
  );

  // API routes
  app.use('/api', routes);

  // Serve static files in production
  if (isProduction) {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (_, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}

export { db };
