[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / LLMOptions

# Interface: LLMOptions

## Extends

- [`GenerationOptions`](GenerationOptions.md).[`ModelOptions`](ModelOptions.md).[`EnvironmentOptions`](EnvironmentOptions.md)

## Properties

### awsProfile?

> `optional` **awsProfile**: `string`

#### Inherited from

[`EnvironmentOptions`](EnvironmentOptions.md).[`awsProfile`](EnvironmentOptions.md#awsprofile)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:115](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L115)

---

### awsRegion?

> `optional` **awsRegion**: `string`

#### Inherited from

[`EnvironmentOptions`](EnvironmentOptions.md).[`awsRegion`](EnvironmentOptions.md#awsregion)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:114](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L114)

---

### frequencyPenalty?

> `optional` **frequencyPenalty**: `null` \| `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`frequencyPenalty`](GenerationOptions.md#frequencypenalty)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:106](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L106)

---

### logitBias?

> `optional` **logitBias**: `null` \| `Record`\<`string`, `number`\>

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`logitBias`](GenerationOptions.md#logitbias)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:98](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L98)

---

### logprobs?

> `optional` **logprobs**: `null` \| `boolean`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`logprobs`](GenerationOptions.md#logprobs)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:100](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L100)

---

### maxTokens?

> `optional` **maxTokens**: `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`maxTokens`](GenerationOptions.md#maxtokens)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:88](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L88)

---

### model

> **model**: `string`

#### Inherited from

[`ModelOptions`](ModelOptions.md).[`model`](ModelOptions.md#model)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:110](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L110)

---

### presencePenalty?

> `optional` **presencePenalty**: `null` \| `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`presencePenalty`](GenerationOptions.md#presencepenalty)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:104](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L104)

---

### seed?

> `optional` **seed**: `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`seed`](GenerationOptions.md#seed)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:86](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L86)

---

### stop?

> `optional` **stop**: `null` \| `string` \| `string`[]

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`stop`](GenerationOptions.md#stop)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:102](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L102)

---

### systemMessage?

> `optional` **systemMessage**: `string`

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:119](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L119)

---

### temperature?

> `optional` **temperature**: `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`temperature`](GenerationOptions.md#temperature)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:90](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L90)

---

### topKTokens?

> `optional` **topKTokens**: `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`topKTokens`](GenerationOptions.md#topktokens)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:94](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L94)

---

### topLogprobs?

> `optional` **topLogprobs**: `null` \| `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`topLogprobs`](GenerationOptions.md#toplogprobs)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:96](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L96)

---

### topProbability?

> `optional` **topProbability**: `number`

#### Inherited from

[`GenerationOptions`](GenerationOptions.md).[`topProbability`](GenerationOptions.md#topprobability)

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:92](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L92)
