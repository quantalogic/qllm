[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / AuthenticationError

# Class: AuthenticationError

## Extends

- [`LLMProviderError`](LLMProviderError.md)

## Constructors

### new AuthenticationError()

> **new AuthenticationError**(`message`, `providerName`, `errorCode`?): [`AuthenticationError`](AuthenticationError.md)

#### Parameters

• **message**: `string`

• **providerName**: `string`

• **errorCode?**: `string`

#### Returns

[`AuthenticationError`](AuthenticationError.md)

#### Inherited from

[`LLMProviderError`](LLMProviderError.md).[`constructor`](LLMProviderError.md#constructors)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)

## Properties

### errorCode?

> `optional` **errorCode**: `string`

#### Inherited from

[`LLMProviderError`](LLMProviderError.md).[`errorCode`](LLMProviderError.md#errorcode)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)

***

### providerName

> **providerName**: `string`

#### Inherited from

[`LLMProviderError`](LLMProviderError.md).[`providerName`](LLMProviderError.md#providername)

#### Defined in

[packages/qllm-lib/src/types/llm-provider.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-provider.ts#L35)
