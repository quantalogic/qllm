import { getListProviderNames } from "qllm-lib";
import { CommandContext } from "../command-processor";

export function listProviders(
    args: string[],
    { ioManager }: CommandContext,
): Promise<void> {
    const providers = getListProviderNames();

    ioManager.displayProviderList(providers);

    return Promise.resolve();
}
