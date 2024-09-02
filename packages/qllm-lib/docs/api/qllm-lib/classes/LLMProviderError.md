[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / LLMProviderError

# Class: LLMProviderError

## Extends

- `Error`

## Extended by

- [`AuthenticationError`](AuthenticationError.md)
- [`RateLimitError`](RateLimitError.md)
- [`InvalidRequestError`](InvalidRequestError.md)

## Constructors

### new LLMProviderError()

> **new LLMProviderError**(`message`, `providerName`, `errorCode`?): [`LLMProviderError`](LLMProviderError.md)

#### Parameters

• **message**: `string`

• **providerName**: `string`

• **errorCode?**: `string`

#### Returns

[`LLMProviderError`](LLMProviderError.md)

#### Overrides

`Error.constructor`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)

## Properties

### errorCode?

> `optional` **errorCode**: `string`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)

---

### providerName

> **providerName**: `string`

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)
