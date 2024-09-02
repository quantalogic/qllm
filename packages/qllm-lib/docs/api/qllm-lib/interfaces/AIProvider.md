[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / AIProvider

# Interface: AIProvider

## Extended by

- [`LLMProvider`](LLMProvider.md)
- [`EmbeddingProvider`](EmbeddingProvider.md)

## Properties

### name

> `readonly` **name**: `string`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:14](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L14)

---

### version

> `readonly` **version**: `string`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:15](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L15)

## Methods

### listModels()

> **listModels**(): `Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Returns

`Promise`\<[`Model`](../type-aliases/Model.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:16](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L16)
