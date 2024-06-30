import { configManager, AppConfig } from '../utils/configuration_manager';

export function getConfig(): AppConfig {
  return configManager.getConfig();
}

export function initConfig(): void {
  // This is now a no-op, as the configuration is initialized when the ConfigurationManager is created
}

export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
  await configManager.updateConfig(updates);
}

export async function reloadConfig(): Promise<void> {
  await configManager.reloadConfig();
}