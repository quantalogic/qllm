import { Enclave } from '../../src/core/enclave';
import { EnclaveConfig } from '../../src/types';

jest.setTimeout(30000); // Increase global timeout to 30 seconds

describe('Enclave', () => {
  let enclave: Enclave;
  const mockConfig: EnclaveConfig = {
    cacheDir: './test-cache',
    sandboxConfig: { rootDir: './test-sandbox' },
    resourceLimits: { maxExecutionTime: 1000, maxMemory: 10 * 1024 * 1024 },
    loggerConfig: { debugMode: false }
  };

  beforeEach(() => {
    enclave = new Enclave(mockConfig);
  });

  afterEach(async () => {
    await enclave.cleanup();
  });

  test('should initialize with correct status', () => {
    expect(enclave.getStatus()).toBe('initialized');
  });

  test('should prepare files and packages', async () => {
    const files = [{ name: 'test.js', content: 'console.log("Hello");' }];
    const packages = ['lodash'];

    await enclave.prepare(files, packages);
    expect(enclave.getStatus()).toBe('prepared');
  }, 30000); // Increase timeout for this specific test to 30 seconds

  test('should execute code', async () => {
    const files = [{ name: 'test.js', content: '__lastExpression = 2 + 2;' }];
    await enclave.prepare(files, []);
    const result = await enclave.execute('test.js');
    expect(result).toBe(4);
  });
});