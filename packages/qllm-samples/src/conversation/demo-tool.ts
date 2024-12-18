import { z } from 'zod';
import { createLLMProvider, LLMProvider } from "qllm-lib";
import { createFunctionToolFromZod } from 'qllm-lib'; 
import { ChatMessageRole, TextContent } from "qllm-lib";

const openaiProvider: LLMProvider = createLLMProvider({ 
  name: "openai",
  apiKey: process.env.OPENAI_API_KEY 
});

// Weather Tool
const weatherSchema = z.object({
  location: z.string().describe('The city and state, e.g. San Francisco, CA'),
  unit: z.enum(['celsius', 'fahrenheit']).describe('The temperature unit'),
  includeForcast: z.boolean().optional().describe('Include 5-day forecast')
});

const weatherTool = createFunctionToolFromZod({
  name: 'get_current_weather',
  description: 'Get the current weather in a given location',
  schema: weatherSchema,
});

// Currency Conversion Tool
const currencySchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3).describe('Source currency code (e.g., USD)'),
  to: z.string().length(3).describe('Target currency code (e.g., EUR)'),
});

const currencyTool = createFunctionToolFromZod({
  name: 'convert_currency',
  description: 'Convert amount from one currency to another',
  schema: currencySchema,
});

// Translation Tool
const translationSchema = z.object({
  text: z.string(),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string(),
  formalityLevel: z.enum(['formal', 'informal']).optional()
});

const translationTool = createFunctionToolFromZod({
  name: 'translate_text',
  description: 'Translate text between languages',
  schema: translationSchema,
});

// First, create implementations for your tools
const mockWeatherAPI = async (location: string, unit: string) => {
  return { temperature: 20, unit, conditions: "sunny" };
};

const mockCurrencyAPI = async (amount: number, from: string, to: string) => {
  const rates = { EUR_USD: 1.1 };
  return { amount: amount * rates.EUR_USD, from, to };
};

async function getAssistantResponse() {
  const openaiProvider: LLMProvider = createLLMProvider({ 
    name: "openai",
    apiKey: process.env.OPENAI_API_KEY 
  });

  try {
    // First call to get tool requests
    const initialResponse = await openaiProvider.generateChatCompletion({
      messages: [
        { 
          role: 'user', 
          content: { 
            type: 'text', 
            text: 'What is the weather like in Paris? Also, convert 100 EUR to USD.' 
          } 
        },
      ],
      tools: [weatherTool, currencyTool],
      toolChoice: 'auto',
      options: {
        model: 'gpt-4-1106-preview',
        maxTokens: 1024,
        temperature: 0.7,
      },
    });

    // Execute the tool calls 
    const toolResults = await Promise.all(
        initialResponse.toolCalls?.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments);
        let result;
        
        if (toolCall.function.name === 'get_current_weather') {
            result = await mockWeatherAPI(args.location, args.unit || 'celsius');
        } else if (toolCall.function.name === 'convert_currency') {
            result = await mockCurrencyAPI(args.amount, args.from, args.to);
        }
    
        return {
            role: 'tool' as ChatMessageRole,
            content: {
            type: 'text' as const,
            text: JSON.stringify(result)
            } as TextContent,
            tool_call_id: toolCall.id,
        };
        }) || []
    );
    // Second call with tool results
    const finalResponse = await openaiProvider.generateChatCompletion({
      messages: [
        { 
          role: 'user', 
          content: { 
            type: 'text', 
            text: 'What is the weather like in Paris? Also, convert 100 EUR to USD.' 
          } 
        },
        ...toolResults
      ],
      options: {
        model: 'gpt-4-1106-preview',
        maxTokens: 1024,
        temperature: 0.7,
      },
    });

    console.log('Final Response:', finalResponse.text);
    return finalResponse;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

getAssistantResponse();
