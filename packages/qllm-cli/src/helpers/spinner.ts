import { Spinner as CLISpinner } from 'cli-spinner';
import { logger } from '../../../qllm-lib/src/common/utils/logger';

export class Spinner {
  private spinner: CLISpinner;
  private isSpinning: boolean = false;

  constructor(text: string) {
    this.spinner = new CLISpinner(`%s ${text}`);
    this.spinner.setSpinnerString('|/-\\');
  }

  start(): void {
    this.isSpinning = true;
    this.spinner.start();
  }

  stop(): void {
    if (this.isSpinning) {
      this.isSpinning = false;
      this.spinner.stop(true);
    }
  }

  clear(): void {
    this.stop();
    process.stdout.write('\r\x1b[K'); // Clear the spinner line
  }

  succeed(text?: string): void {
    this.clear();
    logger.debug(`✅ ${text || 'Success'}`);
  }

  fail(text?: string): void {
    this.clear();
    logger.error(`✖ ${text || 'Failed'}`);
  }

  update(text: string): void {
    this.spinner.setSpinnerTitle(`%s ${text}`);
  }

  isActive(): boolean {
    return this.isSpinning;
  }
}
