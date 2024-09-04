import { CommandContext } from "../command-processor";
import { getListProviderNames } from "qllm-lib";

export function displayCurrentOptions(
    args: string[],
    { configManager, ioManager }: CommandContext,
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

    const validProviders = getListProviderNames();
    ioManager.displayInfo(`Valid providers: ${validProviders.join(", ")}`);

    ioManager.displayConfigOptions(options);

    return Promise.resolve();
}
