import { Template, TemplateDefinition } from "qllm-lib";
import prompts from "prompts";

export async function promptForVariables(
  template: TemplateDefinition,
  providedVariables: Record<string, any>
): Promise<Record<string, any>> {
  const missingVariables: Record<string, any> = {};
  
  for (const [key, variable] of Object.entries(template.input_variables)) {
    if (!(key in providedVariables)) {
      try {
        const response = await prompts({
          type: getPromptType(variable.type) as any,
          name: "value",
          message: `Enter value for ${key} (${variable.description})${variable.default ? ` [Default: ${variable.default}]` : ''}:`,
          validate: (value) => validateInput(value, variable),
        });

        if (response.value === undefined) {
          throw new Error("User cancelled the input");
        }

        missingVariables[key] = castValue(response.value, variable.type);
      } catch (error) {
        //logger.error(`Error prompting for variable ${key}: ${error}`);
        throw error;
      }
    }
  }

  return missingVariables;
}

function getPromptType(variableType: string): string {
  switch (variableType) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'confirm';
    default:
      return 'text';
  }
}

function validateInput(value: any, variable: any): boolean | string {
  if (value === '' && !('default' in variable)) {
    return 'This field is required';
  }
  return true;
}

function castValue(value: any, type: string): any {
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'array':
      return value.split(',').map((item: string) => item.trim());
    default:
      return value;
  }
}