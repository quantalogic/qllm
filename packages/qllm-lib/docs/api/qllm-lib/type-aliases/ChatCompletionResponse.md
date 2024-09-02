[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / ChatCompletionResponse

# Type Alias: ChatCompletionResponse

> **ChatCompletionResponse**: `object`

## Type declaration

### finishReason

> **finishReason**: `string` \| `null`

### model

> **model**: `string`

### refusal

> **refusal**: `string` \| `null`

### text

> **text**: `string` \| `null`

### toolCalls?

> `optional` **toolCalls**: [`ToolCall`](ToolCall.md)[]

### usage?

> `optional` **usage**: [`Usage`](Usage.md)

## Defined in

[packages/qllm-lib/src/types/llm-types.ts:52](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L52)
