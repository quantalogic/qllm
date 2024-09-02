[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / BaseEmbeddingProvider

# Class: `abstract` BaseEmbeddingProvider

## Implements

- [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Constructors

### new BaseEmbeddingProvider()

> **new BaseEmbeddingProvider**(): [`BaseEmbeddingProvider`](BaseEmbeddingProvider.md)

#### Returns

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md)

## Properties

### name

> `abstract` **name**: `string`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`name`](../interfaces/EmbeddingProvider.md#name)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:86](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L86)

---

### version

> **version**: `string` = `'1.0.0'`

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`version`](../interfaces/EmbeddingProvider.md#version)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:85](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L85)

## Methods

### generateEmbedding()

> `abstract` **generateEmbedding**(`input`): `Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Parameters

• **input**: [`EmbeddingRequestParams`](../type-aliases/EmbeddingRequestParams.md)

#### Returns

`Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`generateEmbedding`](../interfaces/EmbeddingProvider.md#generateembedding)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:88](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L88)

---

### listModels()

> `abstract` **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`listModels`](../interfaces/EmbeddingProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:89](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L89)
