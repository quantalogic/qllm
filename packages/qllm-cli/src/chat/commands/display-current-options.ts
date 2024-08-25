import { CommandContext } from "../command-processor";

export function displayCurrentOptions(
    args: string[],
    { configManager, ioManager }: CommandContext
  ): Promise<void> {
    const config = configManager.getConfig();
    const options = [
      ["provider", "Provider", configManager.getProvider() || "Not set"],
      ["model", "Model", configManager.getModel() || "Not set"],
      [
        "temperature",
        "Temperature",
        config.getTemperature()?.toString() || "Not set",
      ],
      [
        "max_tokens",
        "Max Tokens",
        config.getMaxTokens()?.toString() || "Not set",
      ],
      ["top_p", "Top P", config.getTopP()?.toString() || "Not set"],
      [
        "frequency_penalty",
        "Frequency Penalty",
        config.getFrequencyPenalty()?.toString() || "Not set",
      ],
      [
        "presence_penalty",
        "Presence Penalty",
        config.getPresencePenalty()?.toString() || "Not set",
      ],
      [
        "stop_sequence",
        "Stop Sequence",
        config.getStopSequence()?.join(", ") || "Not set",
      ],
    ];
    ioManager.displayTable(["ID", "Option", "Value"], options);
    return Promise.resolve();
  }
