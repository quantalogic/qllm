import kleur from 'kleur';
import { table, TableUserConfig } from 'table';

/**
 * OutputFormatter class provides methods for formatting and displaying output in the CLI.
 */
export class OutputFormatter {
  /**
   * Formats and prints a success message.
   * @param message The success message to display.
   */
  static success(message: string): void {
    console.log(kleur.green('✔ ') + message);
  }

  /**
   * Formats and prints an error message.
   * @param message The error message to display.
   */
  static error(message: string): void {
    console.error(kleur.red('✖ ') + message);
  }

  /**
   * Formats and prints a warning message.
   * @param message The warning message to display.
   */
  static warn(message: string): void {
    console.warn(kleur.yellow('⚠ ') + message);
  }

  /**
   * Formats and prints an info message.
   * @param message The info message to display.
   */
  static info(message: string): void {
    console.info(kleur.blue('ℹ ') + message);
  }

  /**
   * Formats and prints a table of data.
   * @param headers An array of table headers.
   * @param data An array of arrays representing table rows.
   */
  static table(headers: string[], data: string[][]): void {
    const tableData = [headers, ...data];
    const config: TableUserConfig = {
      columns: headers.map(() => ({ alignment: 'left' as const })),
      header: {
        alignment: 'center' as const,
        content: headers.map(header => kleur.bold(header)).join(' | '), // Join the headers
      },
    };
    console.log(table(tableData, config));
  }

  /**
   * Formats and prints JSON data.
   * @param data The data to be formatted as JSON.
   */
  static json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Formats and prints a title.
   * @param title The title to display.
   */
  static title(title: string): void {
    console.log(kleur.bold().underline(title));
  }

  /**
   * Formats and prints a section header.
   * @param header The section header to display.
   */
  static sectionHeader(header: string): void {
    console.log(kleur.bold('\n' + header));
  }

  /**
   * Formats and prints a list of items.
   * @param items An array of items to display as a list.
   */
  static list(items: string[]): void {
    items.forEach((item) => console.log(`  • ${item}`));
  }

  /**
   * Clears the console screen.
   */
  static clear(): void {
    console.clear();
  }

  /**
   * Prints a blank line.
   */
  static newLine(): void {
    console.log();
  }

  /**
   * Formats and prints a code block.
   * @param code The code to display.
   * @param language Optional language for syntax highlighting.
   */
  static codeBlock(code: string, language?: string): void {
    const formattedCode = language ? kleur.cyan(code) : code;
    console.log(kleur.gray('```' + (language || '')));
    console.log(formattedCode);
    console.log(kleur.gray('```'));
  }
}

/**
 * A simplified output utility object for quick access to common output methods.
 */
export const output = {
  success: OutputFormatter.success,
  error: OutputFormatter.error,
  warn: OutputFormatter.warn,
  info: OutputFormatter.info,
  table: OutputFormatter.table,
  json: OutputFormatter.json,
  title: OutputFormatter.title,
  sectionHeader: OutputFormatter.sectionHeader,
  list: OutputFormatter.list,
  clear: OutputFormatter.clear,
  newLine: OutputFormatter.newLine,
  codeBlock: OutputFormatter.codeBlock,
};