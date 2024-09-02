import { NodeVM } from 'vm2';
import { SandboxConfig } from '../types';
import * as path from 'path';

/**
 * Sandbox class for executing code in a controlled environment
 */
export class Sandbox {
  private vm: NodeVM;

  /**
   * Creates a new Sandbox instance
   * @param {SandboxConfig} config - Configuration for the sandbox
   * @param {string} tempDir - Temporary directory for the sandbox
   */
  constructor(config: SandboxConfig, private tempDir: string) {
    this.vm = new NodeVM({
      console: 'inherit',  // Inherit console from the parent process
      sandbox: {},  // Empty sandbox object
      require: {
        external: true,  // Allow requiring external modules
        builtin: ['fs', 'path'],  // Allow specific built-in modules
        root: this.tempDir,  // Set root directory for requires
        resolve: (moduleName: string) => {
          // Custom module resolution
          return require.resolve(moduleName, { paths: [this.tempDir] });
        },
      },
      nesting: false,  // Disable VM nesting
      wrapper: 'commonjs',  // Use CommonJS module system
    });
  }

  /**
   * Runs code in the sandbox
   * @param {string} code - The code to run
   * @param {string} filename - The filename to associate with the code
   * @returns {Promise<any>} The result of the code execution
   */
  async run(code: string, filename: string): Promise<any> {
    const fullPath = path.join(this.tempDir, filename);
    const dirName = path.dirname(fullPath);

    // Inject __filename and __dirname into the sandbox without redeclaring
    this.vm.freeze({ __filename: fullPath, __dirname: dirName }, '__sandbox_scope__');

    return this.vm.run(code, fullPath);
  }

  /**
   * Injects global variables into the sandbox
   * @param {Record<string, any>} globals - Object containing global variables to inject
   */
  injectGlobals(globals: Record<string, any>): void {
    Object.assign(this.vm.sandbox, globals);
  }
}