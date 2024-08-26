import { Command } from 'commander';
import Table from 'cli-table3';
import kleur from 'kleur';
import { createSpinner } from 'nanospinner';
import { getListProviderNames, getLLMProvider, LLMProvider, Model } from 'qllm-lib';
import { processAndExit } from '../utils/common';

export const listCommand = new Command('list')
  .description('List providers and models')
  .addCommand(
    new Command('providers')
      .description('List all available providers')
      .action(processAndExit(listProviders))
  )
  .addCommand(
    new Command('models')
      .description('List models for a specific provider')
      .argument('<provider>', 'Provider name')
      .option('-f, --full', 'Show full model details')
      .option('-s, --sort <field>', 'Sort models by field (id, created)', 'id')
      .option('-r, --reverse', 'Reverse sort order')
      .option('-c, --columns <columns>', 'Select columns to display (comma-separated: id,description,created)', 'id,description,created')
      .action(processAndExit(listModels))
  );

async function listProviders() {
  const spinner = createSpinner('Fetching providers...').start();
  try {
    const providers = await getListProviderNames();
    spinner.success({ text: 'Providers fetched successfully' });

    const table = new Table({
      head: [kleur.cyan('Provider Name')],
      style: { head: [], border: [] }
    });

    providers.forEach(provider => table.push([provider]));

    console.log(kleur.bold('\nAvailable Providers:'));
    console.log(table.toString());
  } catch (error) {
    spinner.error({ text: 'Error listing providers' });
    console.error(kleur.red('Error:'), error instanceof Error ? error.message : String(error));
  }

}

async function listModels(providerName: string, options: { full?: boolean, sort?: string, reverse?: boolean, columns?: string }) {
  const spinner = createSpinner(`Fetching models for ${providerName}...`).start();
  try {
    const provider: LLMProvider = await getLLMProvider(providerName);
    const models = await provider.listModels();
    spinner.success({ text: 'Models fetched successfully' });

    displayModels(models, providerName, options);
  } catch (error) {
    spinner.error({ text: `Error listing models for ${providerName}` });
    console.error(kleur.red('Error:'), error instanceof Error ? error.message : String(error));
  }
}

function displayModels(models: Model[], providerName: string, options: { full?: boolean, sort?: string, reverse?: boolean, columns?: string }) {
  const columns = options.columns?.split(',') || ['id', 'description', 'created'];
  const sortedModels = sortModels(models, options.sort || 'id', options.reverse);

  const tableHead = columns.map(col => kleur.cyan(col.charAt(0).toUpperCase() + col.slice(1)));
  const table = new Table({
    head: tableHead,
    style: { head: [], border: [] }
  });

  sortedModels.forEach((model: Model) => {
    const row = columns.map(col => {
      switch (col) {
        case 'id':
          return kleur.yellow(model.id);
        case 'description':
          return options.full ? model.description || 'N/A' : truncate(model.description || 'N/A', 50);
        case 'created':
          return model.created ? new Date(model.created).toLocaleString() : 'N/A';
        default:
          return 'N/A';
      }
    });
    table.push(row);
  });

  console.log(kleur.bold(`\nModels for ${kleur.green(providerName)}:`));
  console.log(table.toString());

  if (!options.full) {
    console.log(kleur.dim('\nTip: Use the -f or --full flag to see full model descriptions.'));
  }
  console.log(kleur.dim('Tip: Use -s or --sort to sort by id or created date, and -r or --reverse to reverse the order.'));
  console.log(kleur.dim('Tip: Use -c or --columns to select specific columns (e.g., -c id,created)'));
}

function sortModels(models: Model[], sortField: string, reverse: boolean = false): Model[] {
  return models.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'created' && a.created && b.created) {
      comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
    } else {
      comparison = a.id.localeCompare(b.id);
    }
    return reverse ? -comparison : comparison;
  });
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length - 3) + '...' : str;
}