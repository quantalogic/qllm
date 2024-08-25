import { getLLMProvider } from "qllm-lib";
import { DEFAULT_PROVIDER } from "../../constants";
import { CommandContext } from "../command-processor";

export  async function listModels(
    args: string[],
    { ioManager, configManager }: CommandContext
  ): Promise<void> {
    const argProviderName = args.length > 0 ? args[0] : null;
    const spinner = ioManager.createSpinner("Fetching models...");
    spinner.start();
    try {
      const config = configManager.getConfig();
      const providerName =
        argProviderName || config.getProvider() || DEFAULT_PROVIDER;
      const provider = await getLLMProvider(providerName);
      const models = await provider.listModels();
      spinner.success({ text: "Models fetched successfully" });
      const modelData = models.map((model) => [
        model.id,
        model.description || "N/A",
      ]);
      ioManager.displayTable(["Model ID", "Description"], modelData);
    } catch (error) {
      spinner.error({
        text: `Failed to list models: ${(error as Error).message}`,
      });
    }
  }