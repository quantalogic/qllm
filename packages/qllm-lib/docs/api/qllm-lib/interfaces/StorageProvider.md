[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / StorageProvider

# Interface: StorageProvider

## Methods

### delete()

> **delete**(`id`): `Promise`\<`void`\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:34](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L34)

---

### list()

> **list**(): `Promise`\<[`ConversationMetadata`](ConversationMetadata.md)[]\>

#### Returns

`Promise`\<[`ConversationMetadata`](ConversationMetadata.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:35](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L35)

---

### listConversations()

> **listConversations**(): `Promise`\<[`Conversation`](Conversation.md)[]\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:36](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L36)

---

### load()

> **load**(`id`): `Promise`\<`null` \| [`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`null` \| [`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:33](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L33)

---

### save()

> **save**(`conversation`): `Promise`\<`void`\>

#### Parameters

• **conversation**: [`Conversation`](Conversation.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:32](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L32)
