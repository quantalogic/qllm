[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / OpenAIProvider

# Class: OpenAIProvider

OpenAIProvider class implements the LLMProvider interface for OpenAI's language models.
It provides methods for generating messages, streaming messages, and generating embeddings.

## Implements

- [`LLMProvider`](../interfaces/LLMProvider.md)
- [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Constructors

### new OpenAIProvider()

> **new OpenAIProvider**(`key`?): [`OpenAIProvider`](OpenAIProvider.md)

#### Parameters

• **key?**: `string`

#### Returns

[`OpenAIProvider`](OpenAIProvider.md)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:39](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L39)

## Properties

### defaultOptions

> **defaultOptions**: [`LLMOptions`](../interfaces/LLMOptions.md)

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`defaultOptions`](../interfaces/LLMProvider.md#defaultoptions)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:47](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L47)

---

### name

> `readonly` **name**: `"OpenAI"` = `'OpenAI'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`name`](../interfaces/EmbeddingProvider.md#name)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:37](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L37)

---

### version

> `readonly` **version**: `"1.0.0"` = `'1.0.0'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`version`](../interfaces/EmbeddingProvider.md#version)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:36](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L36)

## Methods

### generateChatCompletion()

> **generateChatCompletion**(`params`): `Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`generateChatCompletion`](../interfaces/LLMProvider.md#generatechatcompletion)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:52](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L52)

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

[packages/qllm-lib/src/providers/openai/index.ts:150](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L150)

---

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`listModels`](../interfaces/EmbeddingProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:176](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L176)

---

### streamChatCompletion()

> **streamChatCompletion**(`params`): `AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`streamChatCompletion`](../interfaces/LLMProvider.md#streamchatcompletion)

#### Defined in

[packages/qllm-lib/src/providers/openai/index.ts:99](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/openai/index.ts#L99)
