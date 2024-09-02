import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Parses command-line arguments using yargs
 * @returns {Promise<any>} A promise that resolves to the parsed arguments
 */
export async function parseArguments() {
    return yargs(hideBin(process.argv))
      // Define 'file' option
      .option('f', { 
        alias: 'file',
        describe: 'Files to execute',
        type: 'array'
      })
      // Define 'dir' option
      .option('dir', { 
        describe: 'Directory containing files to execute',
        type: 'string'
      })
      // Add a check to ensure either 'file' or 'dir' is specified
      .check(argv => {
        if (!argv.f && !argv.dir) {
          throw new Error('Either --file or --dir must be specified');
        }
        return true;
      })
      .argv;
  }