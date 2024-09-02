[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / OllamaProvider

# Class: OllamaProvider

## Implements

- [`LLMProvider`](../interfaces/LLMProvider.md)
- [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Constructors

### new OllamaProvider()

> **new OllamaProvider**(`baseUrl`): [`OllamaProvider`](OllamaProvider.md)

#### Parameters

• **baseUrl**: `string` = `BASE_URL`

#### Returns

[`OllamaProvider`](OllamaProvider.md)

#### Defined in

[packages/qllm-lib/src/providers/ollama/index.ts:38](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L38)

## Properties

### defaultOptions

> **defaultOptions**: [`LLMOptions`](../interfaces/LLMOptions.md)

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`defaultOptions`](../interfaces/LLMProvider.md#defaultoptions)

#### Defined in

[packages/qllm-lib/src/providers/ollama/index.ts:60](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L60)

---

### name

> `readonly` **name**: `"Ollama"` = `'Ollama'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`name`](../interfaces/EmbeddingProvider.md#name)

#### Defined in

[packages/qllm-lib/src/providers/ollama/index.ts:41](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L41)

---

### version

> `readonly` **version**: `string` = `'1.0.0'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`version`](../interfaces/EmbeddingProvider.md#version)

#### Defined in

[packages/qllm-lib/src/providers/ollama/index.ts:40](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L40)

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

[packages/qllm-lib/src/providers/ollama/index.ts:79](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L79)

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

[packages/qllm-lib/src/providers/ollama/index.ts:43](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L43)

---

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`listModels`](../interfaces/EmbeddingProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/providers/ollama/index.ts:64](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L64)

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

[packages/qllm-lib/src/providers/ollama/index.ts:110](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/providers/ollama/index.ts#L110)
