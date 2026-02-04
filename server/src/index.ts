import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_PORT = process.env.CLIENT_PORT || 5173;
const isProduction = process.env.NODE_ENV === 'production';

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
