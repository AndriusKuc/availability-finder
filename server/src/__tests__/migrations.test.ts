import { migrations } from '../config/migrations';

describe('Migrations', () => {
  it('should have sequential version numbers starting from 1', () => {
    migrations.forEach((migration, index) => {
      expect(migration.version).toBe(index + 1);
    });
  });

  it('should have unique version numbers', () => {
    const versions = migrations.map((m) => m.version);
    const uniqueVersions = new Set(versions);
    expect(uniqueVersions.size).toBe(versions.length);
  });

  it('should have names for all migrations', () => {
    migrations.forEach((migration) => {
      expect(migration.name).toBeDefined();
      expect(migration.name.length).toBeGreaterThan(0);
    });
  });

  it('should have up functions for all migrations', () => {
    migrations.forEach((migration) => {
      expect(typeof migration.up).toBe('function');
    });
  });
});
