import { Sandbox } from '../../src/security/sandbox';
import { SandboxConfig } from '../../src/types';

describe('Sandbox', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    const config: SandboxConfig = { rootDir: './test-sandbox' };
    sandbox = new Sandbox(config, './test-temp');
  });

  test('should run code in sandbox', async () => {
    const result = await sandbox.run('__lastExpression = 2 + 2');
    expect(result).toBe(4);
  });

  test('should handle multi-line code', async () => {
    const code = `
      let x = 10;
      let y = 20;
      __lastExpression = x + y;
    `;
    const result = await sandbox.run(code);
    expect(result).toBe(30);
  });

  test('should handle async code', async () => {
    const code = `
      async function test() {
        return new Promise(resolve => setTimeout(() => resolve(42), 100));
      }
      __lastExpression = await test();
    `;
    const result = await sandbox.run(code);
    expect(result).toBe(42);
  });
});