[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / LLMProvider

# Interface: LLMProvider

## Extends

- [`AIProvider`](AIProvider.md)

## Properties

### defaultOptions

> **defaultOptions**: [`LLMOptions`](LLMOptions.md)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:26](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L26)

***

### name

> `readonly` **name**: `string`

#### Inherited from

[`AIProvider`](AIProvider.md).[`name`](AIProvider.md#name)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:14](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L14)

***

### version

> `readonly` **version**: `string`

#### Inherited from

[`AIProvider`](AIProvider.md).[`version`](AIProvider.md#version)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:15](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L15)

## Methods

### generateChatCompletion()

> **generateChatCompletion**(`params`): `Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`Promise`\<[`ChatCompletionResponse`](../type-aliases/ChatCompletionResponse.md)\>

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:27](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L27)

***

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Inherited from

[`AIProvider`](AIProvider.md).[`listModels`](AIProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:16](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L16)

***

### streamChatCompletion()

> **streamChatCompletion**(`params`): `AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Parameters

• **params**: [`ChatCompletionParams`](../type-aliases/ChatCompletionParams.md)

#### Returns

`AsyncIterableIterator`\<[`ChatStreamCompletionResponse`](../type-aliases/ChatStreamCompletionResponse.md)\>

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:28](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L28)
