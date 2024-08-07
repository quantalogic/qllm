import { ErrorManager } from "../../common/utils/error_manager";
import { TemplateDefinition, OutputVariable } from "./types";

export class OutputVariableExtractor {
  constructor(private template: TemplateDefinition) {}

  extractVariables(output: string): Record<string, any> {
    const result: Record<string, any> = {};
    const outputVariables = this.template.output_variables || {};

    for (const [key, variable] of Object.entries(outputVariables)) {
      //logger.debug(`Extracting output variable: ${key}`);
      const value = this.extractVariable(key, variable, output);
      //logger.debug(`Extracted value for ${key}: ${value}`);
      result[key] = this.validateAndTransform(key, variable, value);
    }

    return result;
  }

  private extractVariable(
    key: string,
    variable: OutputVariable,
    output: string
  ): string | null {
    const regex = new RegExp(`<${key}>(.+?)</${key}>`, "s");
    const match = output.match(regex);
    return match ? match[1].trim() : null;
  }

  private validateAndTransform(
    key: string,
    variable: OutputVariable,
    value: string | null
  ): any {
    if (value === null) {
      if ("default" in variable) {
        return variable.default;
      }
      ErrorManager.throwError(
        "OutputValidationError",
        `Missing required output variable: ${key}`
      );
    }

    switch (variable.type) {
      case "string":
        return value;
      case "integer":
        return this.parseInteger(key, value);
      case "float":
        return this.parseFloat(key, value);
      case "boolean":
        return this.parseBoolean(key, value);
      case "array":
        return this.parseArray(key, value);
      case "object":
        return this.parseObject(key, value);
      default:
        ErrorManager.throwError(
          "OutputValidationError",
          `Invalid type for output variable ${key}: ${variable.type}`
        );
    }
  }

  private parseInteger(key: string, value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      ErrorManager.throwError(
        "OutputValidationError",
        `Invalid integer value for ${key}: ${value}`
      );
    }
    return parsed;
  }

  private parseFloat(key: string, value: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      ErrorManager.throwError(
        "OutputValidationError",
        `Invalid float value for ${key}: ${value}`
      );
    }
    return parsed;
  }

  private parseBoolean(key: string, value: string): boolean {
    const lowercaseValue = value.toLowerCase();
    if (lowercaseValue === "true") return true;
    if (lowercaseValue === "false") return false;
    ErrorManager.throwError(
      "OutputValidationError",
      `Invalid boolean value for ${key}: ${value}`
    );
  }

  private parseArray(key: string, value: string): any[] {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError(
        "OutputValidationError",
        `Invalid array value for ${key}: ${value}`
      );
    }
  }

  private parseObject(key: string, value: string): object {
    try {
      return JSON.parse(value);
    } catch (error) {
      ErrorManager.throwError(
        "OutputValidationError",
        `Invalid object value for ${key}: ${value}`
      );
    }
  }
}
