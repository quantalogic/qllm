import fs from 'fs/promises';
import { logInfo } from '../utils';

export function formatOutput(message: any, format: string): string {
    switch (format) {
        case 'json':
            return JSON.stringify(message, null, 2);
        case 'markdown':
            return `# LLM Response\n\n${message.content[0].text}`;
        default:
            return message.content[0].text;
    }
}

export async function writeOutput(output: string, filePath: string | undefined): Promise<void> {
    if (filePath) {
        await fs.writeFile(filePath, output);
        logInfo(`Response written to ${filePath}`);
    } else {
        console.log(output);
    }
}
