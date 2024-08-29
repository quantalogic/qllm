[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / AnthropicProvider

# Class: AnthropicProvider

## Extends

- [`BaseLLMProvider`](BaseLLMProvider.md)

## Constructors

### new AnthropicProvider()

> **new AnthropicProvider**(`__namedParameters`): [`AnthropicProvider`](AnthropicProvider.md)

#### Parameters

• **\_\_namedParameters** = `{}`

• **\_\_namedParameters.apiKey?**: `string`

• **\_\_namedParameters.client?**: `AnthropicBedrock`

#### Returns

[`AnthropicProvider`](AnthropicProvider.md)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`constructor`](BaseLLMProvider.md#constructors)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:28](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L28)

## Properties

### defaultOptions

> **defaultOptions**: [`LLMOptions`](../interfaces/LLMOptions.md)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`defaultOptions`](BaseLLMProvider.md#defaultoptions)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:41](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L41)

***

### name

> `readonly` **name**: `"Anthropic"` = `'Anthropic'`

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`name`](BaseLLMProvider.md#name)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:25](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L25)

***

### supportsEmbedding

> **supportsEmbedding**: `boolean` = `false`

#### Inherited from

[`BaseLLMProvider`](BaseLLMProvider.md).[`supportsEmbedding`](BaseLLMProvider.md#supportsembedding)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:47](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L47)

***

### supportsImageAnalysis

> **supportsImageAnalysis**: `boolean` = `false`

#### Inherited from

[`BaseLLMProvider`](BaseLLMProvider.md).[`supportsImageAnalysis`](BaseLLMProvider.md#supportsimageanalysis)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:48](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L48)

***

### version

> `readonly` **version**: `"1.0.0"` = `'1.0.0'`

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`version`](BaseLLMProvider.md#version)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:26](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L26)

## Methods

### generateChatCompletion()

> **generateChatCompletion**(`params`): `Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`generateChatCompletion`](BaseLLMProvider.md#generatechatcompletion)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:90](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L90)

***

### generateEmbedding()

> **generateEmbedding**(`input`): `Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Parameters

• **input**: [`EmbeddingRequestParams`](../type-aliases/EmbeddingRequestParams.md)

#### Returns

`Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:235](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L235)

***

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`listModels`](BaseLLMProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:46](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L46)

***

### streamChatCompletion()

> **streamChatCompletion**(`params`): `AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`streamChatCompletion`](BaseLLMProvider.md#streamchatcompletion)

#### Defined in

[packages/qllm-lib/src/providers/anthropic/index.ts:181](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/anthropic/index.ts#L181)
