[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / BaseLLMProvider

# Class: `abstract` BaseLLMProvider

## Extended by

- [`AnthropicProvider`](AnthropicProvider.md)
- [`GroqProvider`](GroqProvider.md)

## Implements

- [`LLMProvider`](../interfaces/LLMProvider.md)

## Constructors

### new BaseLLMProvider()

> **new BaseLLMProvider**(): [`BaseLLMProvider`](BaseLLMProvider.md)

#### Returns

[`BaseLLMProvider`](BaseLLMProvider.md)

## Properties

### defaultOptions

> `abstract` **defaultOptions**: [`LLMOptions`](../interfaces/LLMOptions.md)

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`defaultOptions`](../interfaces/LLMProvider.md#defaultoptions)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:54](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L54)

---

### name

> `abstract` **name**: `string`

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`name`](../interfaces/LLMProvider.md#name)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:50](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L50)

---

### supportsEmbedding

> **supportsEmbedding**: `boolean` = `false`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:47](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L47)

---

### supportsImageAnalysis

> **supportsImageAnalysis**: `boolean` = `false`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:48](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L48)

---

### version

> **version**: `string` = `'1.0.0'`

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`version`](../interfaces/LLMProvider.md#version)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:49](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L49)

## Methods

### generateChatCompletion()

> `abstract` **generateChatCompletion**(`params`): `Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`generateChatCompletion`](../interfaces/LLMProvider.md#generatechatcompletion)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:56](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L56)

---

### listModels()

> `abstract` **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`listModels`](../interfaces/LLMProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:52](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L52)

---

### streamChatCompletion()

> `abstract` **streamChatCompletion**(`params`): `AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Implementation of

[`LLMProvider`](../interfaces/LLMProvider.md).[`streamChatCompletion`](../interfaces/LLMProvider.md#streamchatcompletion)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:57](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L57)
