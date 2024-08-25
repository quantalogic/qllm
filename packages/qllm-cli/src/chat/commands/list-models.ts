// Modify list-models.ts

import { getLLMProvider } from "qllm-lib";
import { DEFAULT_PROVIDER } from "../../constants";
import { CommandContext } from "../command-processor";

export async function listModels(
  args: string[],
  { ioManager, configManager }: CommandContext
): Promise<void> {
  const argProviderName = args.length > 0 ? args[0] : null;
  const spinner = ioManager.createSpinner("Fetching models...");
  spinner.start();

  try {
    const config = configManager.getConfig();
    const providerName = argProviderName || config.getProvider() || DEFAULT_PROVIDER;
    const provider = await getLLMProvider(providerName);
    const models = await provider.listModels();

    spinner.success({ text: "Models fetched successfully" });
    ioManager.newLine();

    ioManager.displayTitle(`Available Models for ${providerName}`);
    ioManager.newLine();

    ioManager.displayModelTable(models.map(model => ({
      id: model.id,
      description: (model.description || 'N/A').substring(0, 50),
    })));

    ioManager.newLine();
    ioManager.displayInfo(`Total models: ${models.length}`);
    ioManager.displayInfo(`Provider: ${providerName}`);
  } catch (error) {
    spinner.error({
      text: `Failed to list models: ${(error as Error).message}`,
    });
  }
}