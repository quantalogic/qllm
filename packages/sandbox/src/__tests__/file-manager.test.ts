import { FileManager } from '../core/file-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileManager', () => {
  let fileManager: FileManager;
  const tempDir = './test-temp';

  beforeEach(() => {
    fileManager = new FileManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should write and read file', async () => {
    const fileName = 'test.js';
    const content = 'console.log("Hello");';

    await fileManager.writeFile(fileName, content);
    const readContent = await fileManager.readFile(fileName);

    expect(readContent).toBe(content);
  });
});