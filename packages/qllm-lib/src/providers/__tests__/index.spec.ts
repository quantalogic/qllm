// packages/qllm-lib/src/providers/__tests__/index.spec.ts

import { getProvider } from '../index';
import { OpenAIProvider } from '../openai';

jest.mock('../openai');

describe('getProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an instance of OpenAIProvider for valid provider name', () => {
        const provider = getProvider('openai');
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should throw an error for an invalid provider name', () => {
        expect(() => getProvider('invalid')).toThrow('Provider "invalid" not found.');
    });

    // Additional tests for error handling can be added here
});