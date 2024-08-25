import { CommandContext } from "../command-processor";

export function displayCurrentOptions(
  args: string[],
  { configManager, ioManager }: CommandContext
): Promise<void> {
  const config = configManager.getConfig();

  const options = [
    { name: "Provider", value: configManager.getProvider() },
    { name: "Model", value: configManager.getModel() },
    { name: "Temperature", value: config.getTemperature() },
    { name: "Max Tokens", value: config.getMaxTokens() },
    { name: "Top P", value: config.getTopP() },
    { name: "Frequency Penalty", value: config.getFrequencyPenalty() },
    { name: "Presence Penalty", value: config.getPresencePenalty() },
    { name: "Stop Sequence", value: config.getStopSequence()?.join(", ") },
  ];

  ioManager.displayConfigOptions(options);

  return Promise.resolve();
}