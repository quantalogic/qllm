[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / ChatCompletionParams

# Type Alias: ChatCompletionParams

> **ChatCompletionParams**: `object`

## Type declaration

### messages

> **messages**: [`ChatMessage`](ChatMessage.md)[]

### options

> **options**: [`LLMOptions`](../interfaces/LLMOptions.md)

### parallelToolCalls?

> `optional` **parallelToolCalls**: `boolean`

### responseFormat?

> `optional` **responseFormat**: [`ResponseFormat`](ResponseFormat.md)

### toolChoice?

> `optional` **toolChoice**: `"none"` \| `"auto"` \| `"required"`

### tools?

> `optional` **tools**: [`Tool`](Tool.md)[]

## Defined in

[packages/qllm-lib/src/types/llm-types.ts:259](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L259)
