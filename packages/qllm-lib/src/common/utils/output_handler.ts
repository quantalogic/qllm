// src/utils/output_handler.ts

import fs from 'fs/promises';
import path from 'path';
import { XMLBuilder } from 'fast-xml-parser';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import prompts from 'prompts';

export class OutputHandler {
  private outputPath: string | undefined;
  private format: 'json' | 'xml';

  constructor(outputPath: string | undefined, format: 'json' | 'xml') {
    this.outputPath = outputPath;
    this.format = this.determineFormat(outputPath, format);
  }

  /**
   * Determines the output format based on file extension or specified format.
   * @param outputPath The output file path
   * @param specifiedFormat The format specified by the user
   * @returns The determined format
   */
  private determineFormat(outputPath: string | undefined, specifiedFormat: 'json' | 'xml'): 'json' | 'xml' {
    if (outputPath) {
      const ext = path.extname(outputPath).toLowerCase();
      if (ext === '.xml') {
        return 'xml';
      } else if (ext === '.json') {
        return 'json';
      }
    }
    return specifiedFormat;
  }

  /**
   * Handles the output based on the specified format and output path.
   * @param outputVariables The variables to be output
   */
  async handleOutput(outputVariables: Record<string, any>): Promise<void> {
    const formattedOutput = this.formatOutput(outputVariables);
    
    if (this.outputPath && this.outputPath.trim() !== '') {
      await this.writeToFile(formattedOutput);
    } else {
      this.displayInConsole(outputVariables);
    }
  }

  /**
   * Formats the output variables according to the specified format.
   * @param outputVariables The variables to be formatted
   * @returns The formatted output as a string
   */
  private formatOutput(outputVariables: Record<string, any>): string {
    if (this.format === 'json') {
      return JSON.stringify(outputVariables, null, 2);
    } else if (this.format === 'xml') {
      const builder = new XMLBuilder({ format: true });
      return builder.build({ root: outputVariables });
    }
    throw new Error(`Unsupported format: ${this.format}`);
  }

  /**
   * Writes the formatted output to a file.
   * @param content The formatted content to be written
   */
  private async writeToFile(content: string): Promise<void> {
    try {
      const fullPath = this.getFullPath();
      await this.ensureDirectoryExists(path.dirname(fullPath));
      
      if (await this.fileExists(fullPath)) {
        const overwrite = await this.promptOverwrite(fullPath);
        if (!overwrite) {
          logger.info('Output file not overwritten.');
          return;
        }
      }
      
      await fs.writeFile(fullPath, content, 'utf-8');
      logger.info(`Output written to ${fullPath}`);
    } catch (error) {
      ErrorManager.handleError('OutputError', `Failed to write output: ${error}`);
    }
  }

  /**
   * Gets the full path for the output file, including the appropriate extension.
   * @returns The full path for the output file
   */
  private getFullPath(): string {
    if (!this.outputPath) {
      throw new Error('Output path is not defined');
    }
    let fullPath = path.resolve(this.outputPath);
    const ext = path.extname(fullPath);
    if (!ext) {
      fullPath += `.${this.format}`;
    }
    return fullPath;
  }

  /**
   * Ensures that the directory for the output file exists.
   * @param dirPath The directory path to ensure
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      ErrorManager.handleError('OutputError', `Failed to create directory: ${error}`);
    }
  }

  /**
   * Checks if a file exists at the given path.
   * @param filePath The path to check
   * @returns True if the file exists, false otherwise
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Prompts the user to confirm overwriting an existing file.
   * @param filePath The path of the file to potentially overwrite
   * @returns True if the user confirms overwrite, false otherwise
   */
  private async promptOverwrite(filePath: string): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `File ${filePath} already exists. Overwrite?`,
      initial: false
    });
    return response.overwrite;
  }

  /**
   * Displays the output variables in the console.
   * @param outputVariables The variables to display
   */
  private displayInConsole(outputVariables: Record<string, any>): void {
    console.log(JSON.stringify(outputVariables, null, 2));
  }
}