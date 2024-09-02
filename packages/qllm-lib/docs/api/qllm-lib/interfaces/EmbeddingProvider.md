[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / EmbeddingProvider

# Interface: EmbeddingProvider

## Extends

- [`AIProvider`](AIProvider.md)

## Properties

### name

> `readonly` **name**: `string`

#### Inherited from

[`AIProvider`](AIProvider.md).[`name`](AIProvider.md#name)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:14](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L14)

---

### version

> `readonly` **version**: `string`

#### Inherited from

[`AIProvider`](AIProvider.md).[`version`](AIProvider.md#version)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:15](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L15)

## Methods

### generateEmbedding()

> **generateEmbedding**(`input`): `Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Parameters

• **input**: [`EmbeddingRequestParams`](../type-aliases/EmbeddingRequestParams.md)

#### Returns

`Promise`\<[`EmbeddingResponse`](../type-aliases/EmbeddingResponse.md)\>

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:20](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L20)

---

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Overrides

[`AIProvider`](AIProvider.md).[`listModels`](AIProvider.md#listmodels)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:21](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L21)
