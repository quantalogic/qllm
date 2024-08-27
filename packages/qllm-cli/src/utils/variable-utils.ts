import { TemplateDefinition } from "qllm-lib";
import prompts from "prompts";
import kleur from "kleur";

export async function promptForVariables(
  template: TemplateDefinition,
  providedVariables: Record<string, any>
): Promise<Record<string, any>> {
  const missingVariables: Record<string, any> = {};

  console.log(kleur.cyan().bold('\n🔍 Collecting input variables\n'));

  try {
    for (const [key, variable] of Object.entries(template.input_variables || {})) {
      if (!(key in providedVariables)) {
        console.log(kleur.cyan(`📝 Input required for: ${kleur.bold(key)}`));
        
        const response = await prompts({
          type: getPromptType(variable) as any,
          name: "value",
          message: formatPromptMessage(variable),
          initial: variable.place_holder,
          validate: (value) => validateInput(value, variable),
          choices: getChoices(variable),
        });

        if (response.value === undefined) {
          throw new Error("User cancelled the input");
        }

        missingVariables[key] = castValue(response.value, variable.type);
        console.log(kleur.green(`✅ Value for ${key} collected successfully\n`));
      }
    }

    console.log(kleur.green().bold('✅ All variables collected successfully'));
    return missingVariables;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(kleur.red(`❌ Error: ${error.message}`));
    } else {
      console.error(kleur.red('❌ An unknown error occurred'));
    }
    throw error;
  }
}

function getPromptType(variable: any): string {
  if (variable.choices) return 'select';
  switch (variable.type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'confirm';
    case 'array':
      return 'list';
    default:
      return 'text';
  }
}

function formatPromptMessage(variable: any): string {
  let message = variable.description;
  if (variable.default !== undefined) {
    message += kleur.gray(` (Default: ${variable.default})`);
  }
  return message;
}

function validateInput(value: any, variable: any): boolean | string {
  if (value === '' && !('default' in variable)) {
    return kleur.red('This field is required');
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
      return Array.isArray(value) ? value : value.split(',').map((item: string) => item.trim());
    default:
      return value;
  }
}

function getChoices(variable: any): { title: string; value: any }[] | undefined {
  if (!variable.choices) return undefined;
  return variable.choices.map((choice: string | { title: string; value: any }) => {
    if (typeof choice === 'string') {
      return { title: choice, value: choice };
    }
    return choice;
  });
}