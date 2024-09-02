[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / GroqProvider

# Class: GroqProvider

## Extends

- [`BaseLLMProvider`](BaseLLMProvider.md)

## Implements

- [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Constructors

### new GroqProvider()

> **new GroqProvider**(`apiKey`?): [`GroqProvider`](GroqProvider.md)

#### Parameters

• **apiKey?**: `string`

#### Returns

[`GroqProvider`](GroqProvider.md)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`constructor`](BaseLLMProvider.md#constructors)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:31](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L31)

## Properties

### defaultOptions

> **defaultOptions**: [`LLMOptions`](../interfaces/LLMOptions.md)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`defaultOptions`](BaseLLMProvider.md#defaultoptions)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:40](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L40)

---

### name

> `readonly` **name**: `"Groq"` = `'Groq'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`name`](../interfaces/EmbeddingProvider.md#name)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`name`](BaseLLMProvider.md#name)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:28](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L28)

---

### supportsEmbedding

> **supportsEmbedding**: `boolean` = `false`

#### Inherited from

[`BaseLLMProvider`](BaseLLMProvider.md).[`supportsEmbedding`](BaseLLMProvider.md#supportsembedding)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:47](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L47)

---

### supportsImageAnalysis

> **supportsImageAnalysis**: `boolean` = `false`

#### Inherited from

[`BaseLLMProvider`](BaseLLMProvider.md).[`supportsImageAnalysis`](BaseLLMProvider.md#supportsimageanalysis)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:48](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L48)

---

### version

> `readonly` **version**: `"1.0.0"` = `'1.0.0'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`version`](../interfaces/EmbeddingProvider.md#version)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`version`](BaseLLMProvider.md#version)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:29](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L29)

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

[packages/qllm-lib/src/providers/qroq/index.ts:59](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L59)

---

### generateEmbedding()

> **generateEmbedding**(`input`): `Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Parameters

• **input**: [`EmbeddingRequestParams`](../type-aliases/EmbeddingRequestParams.md)

#### Returns

`Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`generateEmbedding`](../interfaces/EmbeddingProvider.md#generateembedding)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:126](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L126)

---

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`listModels`](../interfaces/EmbeddingProvider.md#listmodels)

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`listModels`](BaseLLMProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:45](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L45)

---

### streamChatCompletion()

> **streamChatCompletion**(`params`): `AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Overrides

[`BaseLLMProvider`](BaseLLMProvider.md).[`streamChatCompletion`](BaseLLMProvider.md#streamchatcompletion)

#### Defined in

[packages/qllm-lib/src/providers/qroq/index.ts:91](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/qroq/index.ts#L91)
