// packages/qllm-cli/src/commands/run-command.ts

import { Command } from "commander";
import {
  RunCommandOptions,
  RunCommandOptionsSchema,
} from "../types/run-command-options";
import { TemplateExecutor, getLLMProvider, TemplateLoader } from "qllm-lib";
import { promptForVariables } from "../utils/variable-utils";
import { validateOptions } from "../utils/validate-options";
import { IOManager } from "../utils/io-manager";
import { CliConfigManager } from "../utils/cli-config-manager";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "../constants";
import { processAndExit } from "../utils/common";
import { parseVariables } from "../utils/template-utils";

const runAction = async (
  templateSource: string,
  options: RunCommandOptions
) => {
  const ioManager = new IOManager();
  const cliConfig = CliConfigManager.getInstance();

  try {
    // Validate options using zod schema
    const validOptions = await validateOptions(
      RunCommandOptionsSchema,
      options,
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

      spinner.update({ text: "" });
      spinner.stop();

      const variables = parseVariables(validOptions.variables);

      const executor = new TemplateExecutor();

      executor.on("streamChunk", (chunk: string) => {
        process.stdout.write(chunk);
      });

      executor.on("streamComplete", (response: string) => {});

      executor.on("streamError", (error: any) => {
        spinner.stop();
        ioManager.displayError(`Error during completion: ${error}`);
      });

      executor.on("requestSent", (request: any) => {
        spinner.start();
        spinner.update({ text: "Request sent, waiting from reply..." });
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

      if (validOptions.output) {
        await saveResponseToFile(result.response, validOptions.output);
        ioManager.displaySuccess(`Response saved to ${validOptions.output}`);
      } else {
        ioManager.displayInfo("Template Execution Result:");
        console.log(result.response);
      }

      if (Object.keys(result.outputVariables).length > 0) {
        ioManager.displayInfo("Extracted Output Variables:");
        for (const [key, value] of Object.entries(result.outputVariables)) {
          console.log(`${ioManager.colorize(key, "green")}:`);
          console.log(`${ioManager.colorize(value, "yellow")}`);
          console.log("-------------------------");
        }
      }
    } catch (error) {
      spinner.error({
        text: `Error executing template: ${(error as Error).message}`,
      });
    }
  } catch (error) {
    ioManager.displayError(`An error occurred: ${(error as Error).message}`);
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
  .action(processAndExit(runAction));

async function saveResponseToFile(
  response: string,
  outputPath: string
): Promise<void> {
  try {
    //await output.writeToFile(outputPath, response);
  } catch (error) {
    throw new Error(`Failed to save response to file: ${error}`);
  }
}
