import { logger } from '../common/utils/logger';
import { ErrorManager } from '../common/utils/error_manager';

type PluginInitFunction = () => void;

export class PluginManager {
  private plugins: Map<string, PluginInitFunction> = new Map();

  registerPlugin(name: string, initFunction: PluginInitFunction): void {
    this.plugins.set(name, initFunction);
  }

  async loadPlugin(name: string): Promise<void> {
    const initFunction = this.plugins.get(name);
    if (!initFunction) {
      try {
        // Attempt to dynamically import the plugin
        const plugin = await import(`./providers/${name}_provider`);
        if (typeof plugin.register === 'function') {
          plugin.register();
        } else {
          ErrorManager.throwError('PluginLoadError', `Invalid plugin structure for ${name}`);
        }
      } catch (error) {
        ErrorManager.throwError('PluginLoadError', `Failed to load plugin ${name}: ${error}`);
      }
    } else {
      initFunction();
    }
    logger.debug(`Loaded plugin: ${name}`);
  }
}
