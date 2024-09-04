// packages/qllm-cli/src/commands/run-command.ts

import {
    RunCommandOptions,
    RunCommandOptionsSchema,
} from "../types/run-command-options";
import { TemplateExecutor, getLLMProvider, TemplateLoader } from "qllm-lib";
import { promptForVariables } from "../utils/variable-utils";
import { validateOptions } from "../utils/validate-options";
import { IOManager, Spinner } from "../utils/io-manager";
import { CliConfigManager } from "../utils/cli-config-manager";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "../constants";
import { parseVariables } from "../utils/template-utils";
import { writeToFile } from "../utils/write-file";

declare var process: NodeJS.Process; //eslint-disable-line

export const runActionCommand = async (
    templateSource: string,
    options: Partial<RunCommandOptions>,
): Promise<{ question: string; response: string } | undefined> => {
    const ioManager = new IOManager();
    const cliConfig = CliConfigManager.getInstance();

    try {
        const optionsWithType: RunCommandOptions = {
            type: options.type || "file",
            ...options,
        };

        const validOptions = await validateOptions(
            RunCommandOptionsSchema,
            optionsWithType,
            ioManager,
        );

        const spinner = ioManager.createSpinner("Processing template...");
        spinner.start();

        try {
            spinner.update({ text: "Loading template..." });
            const template = await TemplateLoader.load(templateSource);
            spinner.stop();

            const providerName =
                validOptions.provider ||
                template.provider ||
                cliConfig.get("provider") ||
                DEFAULT_PROVIDER;

            const modelName =
                validOptions.model ||
                template.model ||
                cliConfig.get("model") ||
                DEFAULT_MODEL;

            const variables = parseVariables(validOptions.variables);
            const executor = setupExecutor(ioManager, spinner);
            const provider = await getLLMProvider(providerName);

            let question = "";

            executor.on("contentPrepared", (content: string) => {
                question = content;
            });

            const result = await executor.execute({
                template,
                variables: { ...variables },
                providerOptions: {
                    model: modelName,
                    maxTokens:
                        template.parameters?.max_tokens ||
                        validOptions.maxTokens,
                    temperature:
                        template.parameters?.temperature ||
                        validOptions.temperature,
                    topKTokens: template.parameters?.top_k,
                    topProbability: template.parameters?.top_p,
                    seed: template.parameters?.seed,
                    systemMessage: template.parameters?.system_message,
                    frequencyPenalty: template.parameters?.frequency_penalty,
                    presencePenalty: template.parameters?.presence_penalty,
                    logitBias: template.parameters?.logit_bias,
                    logprobs: template.parameters?.logprobs,
                    stop: template.parameters?.stop_sequences,
                },
                provider,
                stream: validOptions.stream,
                onPromptForMissingVariables: async (
                    template,
                    initialVariables,
                ) => {
                    return promptForVariables(template, initialVariables);
                },
            });

            await handleOutput(result, validOptions, ioManager);

            return {
                question: question,
                response: result.response,
            };
        } catch (error) {
            spinner.error({
                text: `Error executing template: ${(error as Error).message}`,
            });
        }
    } catch (error) {
        ioManager.displayError(
            `An error occurred: ${(error as Error).message}`,
        );
    }
};

const setupExecutor = (ioManager: IOManager, spinner: Spinner) => {
    const executor = new TemplateExecutor();

    executor.on("streamChunk", (chunk: string) => process.stdout.write(chunk));
    executor.on("streamComplete", (_response: string) => {});
    executor.on("streamError", (error: unknown) => {
        spinner.stop();
        ioManager.displayError(`Error during completion: ${error}`);
    });
    executor.on("requestSent", (request: unknown) => {
        const length = JSON.stringify(request).length;
        spinner.start();
        spinner.update({
            text: `Request sent, waiting for reply... ${length} bytes sent.`,
        });
    });
    executor.on("streamStart", () => {
        spinner.update({ text: "" });
        spinner.stop();
    });
    executor.on("executionError", (error: unknown) => {
        spinner.stop();
        ioManager.displayError(`Error executing template: ${error}`);
    });
    executor.on("executionComplete", () => {
        spinner.start();
        spinner.success({ text: "Template executed successfully" });
        spinner.stop();
    });

    return executor;
};

const handleOutput = async (
    result: unknown,
    validOptions: RunCommandOptions,
    ioManager: IOManager,
) => {
    if (validOptions.extract) {
        await handleExtractedOutput(result, validOptions, ioManager);
    } else {
        await handleFullOutput(result, validOptions, ioManager);
    }
};

const handleExtractedOutput = async (
    result: unknown,
    validOptions: RunCommandOptions,
    ioManager: IOManager,
) => {
    const extractedVariables = validOptions
        .extract!.split(",")
        .map((v) => v.trim());
    const extractedData: Record<string, any> = {}; //eslint-disable-line

    // Cast result to a known type
    const outputResult = result as { outputVariables: Record<string, any> }; //eslint-disable-line

    for (const variable of extractedVariables) {
        if (outputResult.outputVariables.hasOwnProperty(variable)) {
            //eslint-disable-line
            extractedData[variable] = outputResult.outputVariables[variable];
        } else {
            ioManager.displayWarning(
                `Variable "${variable}" not found in the output.`,
            );
        }
    }

    if (validOptions.output) {
        const contentToWrite =
            Object.keys(extractedData).length === 1
                ? Object.values(extractedData)[0]
                : JSON.stringify(extractedData, null, 2);
        await writeToFile(validOptions.output, contentToWrite);
        ioManager.displaySuccess(
            `Extracted data saved to ${validOptions.output}`,
        );
    } else {
        displayExtractedVariables(extractedData, ioManager);
    }
};

const handleFullOutput = async (
    result: any, //eslint-disable-line
    validOptions: RunCommandOptions,
    ioManager: IOManager,
) => {
    if (validOptions.output) {
        await writeToFile(validOptions.output, result.response);
        ioManager.displaySuccess(`Response saved to ${validOptions.output}`);
    } else {
        ioManager.displayInfo("Template Execution Result:");
        ioManager.stdout.write(result.response);
    }

    if (Object.keys(result.outputVariables).length > 0) {
        displayExtractedVariables(result.outputVariables, ioManager);
    }
};

const displayExtractedVariables = (
    variables: Record<string, unknown>,
    ioManager: IOManager,
) => {
    ioManager.displayInfo("Output Variables:");
    for (const [key, value] of Object.entries(variables)) {
        ioManager.displayInfo(`${ioManager.colorize(key, "green")}:`);
        ioManager.displayInfo(
            `${ioManager.colorize(value as string, "yellow")}`,
        );
        ioManager.displayInfo("-------------------------");
    }
};
