import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { Spinner } from 'cli-spinner';
import { logInfo, logError } from '../utils';

export async function createMessage(client: AnthropicBedrock, options: any, messages: any[]): Promise<any> {
    const spinner = new Spinner('Generating response... %s');
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    try {
        const message = await client.messages.create({
            model: options.model,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            top_p: options.topP,
            top_k: options.topK,
            system: options.system,
            messages: messages,
        });
        spinner.stop(true);
        logInfo('Response generated');
        return message;
    } catch (error) {
        spinner.stop(true);
        logError('Failed to generate response');
        throw error;
    }
}
