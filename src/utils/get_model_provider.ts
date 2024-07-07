import { resolveModelAlias, getDefaultModel } from "../config/model_aliases";
import { ProviderName } from "../config/types";
import { configManager } from "../utils/configuration_manager";
import { ErrorManager } from "../utils/error_manager";

export function getModelProvider() {
  const providerName = configManager.getOption('provider') as ProviderName || configManager.getOption('defaultProvider') as ProviderName;
  const modelAlias = configManager.getOption('model') as string;
  const modelId = configManager.getOption('modelid') as string || resolveModelAlias(providerName, modelAlias) || getDefaultModel(providerName);
  if (!modelId) {
    ErrorManager.throwError('ModelError', 'Model not found. Please set a default model or provide a model ID.');
  }
  return { providerName, modelId };
}
