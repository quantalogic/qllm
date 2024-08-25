import { getListProviderNames } from "qllm-lib";
import { CommandContext } from "../command-processor";

export function  listProviders(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    const providers = getListProviderNames();
    ioManager.displayTable(
      ["Provider"],
      providers.map((p) => [p])
    );
    return Promise.resolve();
  }