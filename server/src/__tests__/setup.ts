import db from '../config/database';

// Set test environment variables
process.env.ADMIN_PASSWORD = 'test-password';
process.env.SESSION_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Clean database before each test
beforeEach(() => {
  db.exec('DELETE FROM submissions');
  db.exec('DELETE FROM surveys');
  // Also clean up sessions table created by session store
  try {
    db.exec('DELETE FROM sessions');
  } catch {
    // Sessions table may not exist yet
  }
});

// Close database connection after all tests
afterAll(async () => {
  // Give time for any pending operations to complete
  await new Promise((resolve) => setTimeout(resolve, 100));
  db.close();
});
