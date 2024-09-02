[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / ConversationMessage

# Interface: ConversationMessage

## Extends

- [`ChatMessage`](../type-aliases/ChatMessage.md)

## Properties

### content

> **content**: [`ChatMessageContent`](../type-aliases/ChatMessageContent.md)

#### Inherited from

`ChatMessage.content`

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:25](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L25)

---

### id

> **id**: `string`

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:17](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L17)

---

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:21](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L21)

---

### options?

> `optional` **options**: `Partial`\<[`LLMOptions`](LLMOptions.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:20](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L20)

---

### providerId

> **providerId**: `string`

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:19](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L19)

---

### role

> **role**: [`ChatMessageRole`](../type-aliases/ChatMessageRole.md)

#### Inherited from

`ChatMessage.role`

#### Defined in

[packages/qllm-lib/src/types/llm-types.ts:24](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/llm-types.ts#L24)

---

### timestamp

> **timestamp**: `Date`

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:18](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L18)
