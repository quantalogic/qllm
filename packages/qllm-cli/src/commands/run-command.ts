// packages/qllm-cli/src/commands/run-command.ts

import { Command } from "commander";
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
import { processAndExit } from "../utils/common";
import { parseVariables } from "../utils/template-utils";
import { writeToFile } from "../utils/write-file";

const runAction = async (
  templateSource: string,
  options: Partial<RunCommandOptions>
) => {
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
      ioManager
    );

    const providerName =
      validOptions.provider ||
      cliConfig.get("defaultProvider") ||
      DEFAULT_PROVIDER;
    const modelName =
      validOptions.model || cliConfig.get("defaultModel") || DEFAULT_MODEL;

    const spinner = ioManager.createSpinner("Processing template...");
    spinner.start();

    try {
      spinner.update({ text: "Loading template..." });
      const template = await TemplateLoader.load(templateSource);
      spinner.stop();

      const variables = parseVariables(validOptions.variables);
      const executor = setupExecutor(ioManager, spinner);
      const provider = await getLLMProvider(providerName);

      const result = await executor.execute({
        template,
        variables: { ...variables },
        providerOptions: {
          model: modelName,
          maxTokens: validOptions.maxTokens,
          temperature: validOptions.temperature,
        },
        provider,
        stream: validOptions.stream,
        onPromptForMissingVariables: async (template, initialVariables) => {
          return promptForVariables(template, initialVariables);
        },
      });

      await handleOutput(result, validOptions, ioManager);
    } catch (error) {
      spinner.error({
        text: `Error executing template: ${(error as Error).message}`,
      });
    }
  } catch (error) {
    ioManager.displayError(`An error occurred: ${(error as Error).message}`);
  }
};

const setupExecutor = (ioManager: IOManager, spinner: Spinner) => {
  const executor = new TemplateExecutor();

  executor.on("streamChunk", (chunk: string) => process.stdout.write(chunk));
  executor.on("streamComplete", (response: string) => {});
  executor.on("streamError", (error: any) => {
    spinner.stop();
    ioManager.displayError(`Error during completion: ${error}`);
  });
  executor.on("requestSent", (request: any) => {
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
  executor.on("executionError", (error: any) => {
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
  result: any,
  validOptions: RunCommandOptions,
  ioManager: IOManager
) => {
  if (validOptions.extract) {
    await handleExtractedOutput(result, validOptions, ioManager);
  } else {
    await handleFullOutput(result, validOptions, ioManager);
  }
};

const handleExtractedOutput = async (
  result: any,
  validOptions: RunCommandOptions,
  ioManager: IOManager
) => {
  const extractedVariables = validOptions
    .extract!.split(",")
    .map((v) => v.trim());
  const extractedData: Record<string, any> = {};

  for (const variable of extractedVariables) {
    if (result.outputVariables.hasOwnProperty(variable)) {
      extractedData[variable] = result.outputVariables[variable];
    } else {
      ioManager.displayWarning(
        `Variable "${variable}" not found in the output.`
      );
    }
  }

  if (validOptions.output) {
    const contentToWrite =
      Object.keys(extractedData).length === 1
        ? Object.values(extractedData)[0]
        : JSON.stringify(extractedData, null, 2);
    await writeToFile(validOptions.output, contentToWrite);
    ioManager.displaySuccess(`Extracted data saved to ${validOptions.output}`);
  } else {
    displayExtractedVariables(extractedData, ioManager);
  }
};

const handleFullOutput = async (
  result: any,
  validOptions: RunCommandOptions,
  ioManager: IOManager
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
  variables: Record<string, any>,
  ioManager: IOManager
) => {
  ioManager.displayInfo("Output Variables:");
  for (const [key, value] of Object.entries(variables)) {
    ioManager.displayInfo(`${ioManager.colorize(key, "green")}:`);
    ioManager.displayInfo(`${ioManager.colorize(value, "yellow")}`);
    ioManager.displayInfo("-------------------------");
  }
};

export const runCommand = new Command("run")
  .description("Execute a template")
  .argument("<template>", "Template name, file path, or URL")
  .option(
    "-t, --type <type>",
    "Template source type (file, url, inline)",
    "file"
  )
  .option("-v, --variables <variables>", "Template variables in JSON format")
  .option("-p, --provider <provider>", "LLM provider to use")
  .option("-m, --model <model>", "Specific model to use")
  .option(
    "--max-tokens <maxTokens>",
    "Maximum number of tokens to generate",
    parseInt
  )
  .option(
    "--temperature <temperature>",
    "Temperature for response generation",
    parseFloat
  )
  .option("-s, --stream", "Stream the response")
  .option("-o, --output <output>", "Output file for the response")
  .option(
    "-e, --extract <variables>",
    "Variables to extract from the response, comma-separated"
  )
  .action(
    processAndExit(
      (templateSource: string, options: Partial<RunCommandOptions>) =>
        runAction(templateSource, options)
    )
  );
