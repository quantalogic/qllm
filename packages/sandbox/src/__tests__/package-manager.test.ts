import { PackageManager } from '../core/package-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('PackageManager', () => {
  let packageManager: PackageManager;
  const tempDir = './test-temp';
  const cacheDir = './test-cache';

  beforeEach(() => {
    packageManager = new PackageManager(tempDir, cacheDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(cacheDir, { recursive: true, force: true });
  });

  test('should resolve package versions', async () => {
    const packages = ['lodash'];
    const versions = await packageManager.resolvePackageVersions(packages);
    expect(versions).toHaveProperty('lodash');
    expect(typeof versions.lodash).toBe('string');
  }, 30000); // Add timeout here as well
});