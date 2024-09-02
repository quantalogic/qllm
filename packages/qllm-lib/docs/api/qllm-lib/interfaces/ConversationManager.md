[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / ConversationManager

# Interface: ConversationManager

## Properties

### storageProvider

> **storageProvider**: [`StorageProvider`](StorageProvider.md)

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:64](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L64)

## Methods

### addMessage()

> **addMessage**(`id`, `message`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

• **message**: `Omit`\<[`ConversationMessage`](ConversationMessage.md), `"id"` \| `"timestamp"`\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:46](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L46)

---

### addProvider()

> **addProvider**(`id`, `providerId`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

• **providerId**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:52](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L52)

---

### clearConversation()

> **clearConversation**(`id`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:58](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L58)

---

### clearHistory()

> **clearHistory**(`id`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:54](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L54)

---

### createConversation()

> **createConversation**(`options`?): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **options?**: [`CreateConversationOptions`](CreateConversationOptions.md)

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:41](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L41)

---

### deleteAllConversations()

> **deleteAllConversations**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:63](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L63)

---

### deleteConversation()

> **deleteConversation**(`id`): `Promise`\<`void`\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:44](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L44)

---

### displayConversation()

> **displayConversation**(`id`): `Promise`\<[`ConversationMessage`](ConversationMessage.md)[]\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`ConversationMessage`](ConversationMessage.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:61](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L61)

---

### exportConversation()

> **exportConversation**(`id`): `Promise`\<`string`\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`string`\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:56](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L56)

---

### getConversation()

> **getConversation**(`id`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:42](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L42)

---

### getHistory()

> **getHistory**(`id`): `Promise`\<[`ConversationMessage`](ConversationMessage.md)[]\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`ConversationMessage`](ConversationMessage.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:50](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L50)

---

### importConversation()

> **importConversation**(`conversationData`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **conversationData**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:57](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L57)

---

### listAllConversations()

> **listAllConversations**(): `Promise`\<[`Conversation`](Conversation.md)[]\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:60](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L60)

---

### listConversations()

> **listConversations**(): `Promise`\<[`Conversation`](Conversation.md)[]\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:45](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L45)

---

### removeProvider()

> **removeProvider**(`id`, `providerId`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

• **providerId**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:53](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L53)

---

### searchConversations()

> **searchConversations**(`query`): `Promise`\<[`ConversationMetadata`](ConversationMetadata.md)[]\>

#### Parameters

• **query**: `string`

#### Returns

`Promise`\<[`ConversationMetadata`](ConversationMetadata.md)[]\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:55](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L55)

---

### selectConversation()

> **selectConversation**(`id`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:62](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L62)

---

### setMetadata()

> **setMetadata**(`id`, `metadata`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

• **metadata**: `Partial`\<[`ConversationMetadata`](ConversationMetadata.md)\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:51](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L51)

---

### startNewConversation()

> **startNewConversation**(`options`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **options**: [`CreateConversationOptions`](CreateConversationOptions.md)

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:59](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L59)

---

### updateConversation()

> **updateConversation**(`id`, `updates`): `Promise`\<[`Conversation`](Conversation.md)\>

#### Parameters

• **id**: `string`

• **updates**: `Partial`\<[`Conversation`](Conversation.md)\>

#### Returns

`Promise`\<[`Conversation`](Conversation.md)\>

#### Defined in

[packages/qllm-lib/src/types/conversations-types.ts:43](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/types/conversations-types.ts#L43)
