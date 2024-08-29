[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / ExecutionContext

# Interface: ExecutionContext

## Properties

### onPromptForMissingVariables()?

> `optional` **onPromptForMissingVariables**: (`template`, `initialVariables`) => `Promise`\<`Record`\<`string`, `any`\>\>

#### Parameters

• **template**

• **template.author**: `string` = `...`

• **template.categories?**: `string`[] = `...`

• **template.content**: `string` = `...`

• **template.description**: `string` = `...`

• **template.example\_outputs?**: `string`[] = `...`

• **template.input\_variables?**: `Record`\<`string`, `object`\> = `...`

• **template.model?**: `string` = `...`

• **template.name**: `string` = `...`

• **template.output\_variables?**: `Record`\<`string`, `object`\> = `...`

• **template.parameters?** = `...`

• **template.parameters.max\_tokens?**: `number` = `...`

• **template.parameters.temperature?**: `number` = `...`

• **template.parameters.top\_k?**: `number` = `...`

• **template.parameters.top\_p?**: `number` = `...`

• **template.prompt\_type?**: `string` = `...`

• **template.provider?**: `string` = `...`

• **template.tags?**: `string`[] = `...`

• **template.task\_description?**: `string` = `...`

• **template.version**: `string` = `...`

• **initialVariables**: `Record`\<`string`, `any`\>

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Defined in

[packages/qllm-lib/src/templates/types.ts:18](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L18)

***

### provider?

> `optional` **provider**: [`LLMProvider`](LLMProvider.md)

#### Defined in

[packages/qllm-lib/src/templates/types.ts:16](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L16)

***

### providerOptions?

> `optional` **providerOptions**: `Partial`\<[`LLMOptions`](LLMOptions.md)\>

#### Defined in

[packages/qllm-lib/src/templates/types.ts:15](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L15)

***

### stream?

> `optional` **stream**: `boolean`

#### Defined in

[packages/qllm-lib/src/templates/types.ts:17](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L17)

***

### template

> **template**: `object`

#### author

> **author**: `string`

#### categories?

> `optional` **categories**: `string`[]

#### content

> **content**: `string`

#### description

> **description**: `string`

#### example\_outputs?

> `optional` **example\_outputs**: `string`[]

#### input\_variables?

> `optional` **input\_variables**: `Record`\<`string`, `object`\>

#### model?

> `optional` **model**: `string`

#### name

> **name**: `string`

#### output\_variables?

> `optional` **output\_variables**: `Record`\<`string`, `object`\>

#### parameters?

> `optional` **parameters**: `object`

#### parameters.max\_tokens?

> `optional` **max\_tokens**: `number`

#### parameters.temperature?

> `optional` **temperature**: `number`

#### parameters.top\_k?

> `optional` **top\_k**: `number`

#### parameters.top\_p?

> `optional` **top\_p**: `number`

#### prompt\_type?

> `optional` **prompt\_type**: `string`

#### provider?

> `optional` **provider**: `string`

#### tags?

> `optional` **tags**: `string`[]

#### task\_description?

> `optional` **task\_description**: `string`

#### version

> **version**: `string`

#### Defined in

[packages/qllm-lib/src/templates/types.ts:13](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L13)

***

### variables?

> `optional` **variables**: `Record`\<`string`, `any`\>

#### Defined in

[packages/qllm-lib/src/templates/types.ts:14](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/types.ts#L14)
