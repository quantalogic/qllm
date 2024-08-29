[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / TemplateManager

# Class: TemplateManager

## Constructors

### new TemplateManager()

> **new TemplateManager**(`config`): [`TemplateManager`](TemplateManager.md)

#### Parameters

• **config**: [`TemplateManagerConfig`](../interfaces/TemplateManagerConfig.md)

#### Returns

[`TemplateManager`](TemplateManager.md)

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:18](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L18)

## Methods

### deleteTemplate()

> **deleteTemplate**(`name`): `Promise`\<`void`\>

#### Parameters

• **name**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:52](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L52)

***

### getTemplate()

> **getTemplate**(`name`): `Promise`\<`null` \| `object`\>

#### Parameters

• **name**: `string`

#### Returns

`Promise`\<`null` \| `object`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:30](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L30)

***

### init()

> **init**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:22](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L22)

***

### listTemplates()

> **listTemplates**(): `Promise`\<`string`[]\>

#### Returns

`Promise`\<`string`[]\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:26](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L26)

***

### resolveFileInclusions()

> **resolveFileInclusions**(`template`): `Promise`\<`void`\>

#### Parameters

• **template**: `object` & `object`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:96](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L96)

***

### saveTemplate()

> **saveTemplate**(`template`): `Promise`\<`void`\>

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

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:40](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L40)

***

### setPromptDirectory()

> **setPromptDirectory**(`directory`): `Promise`\<`void`\>

#### Parameters

• **directory**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:85](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L85)

***

### templateExists()

> **templateExists**(`name`): `Promise`\<`boolean`\>

#### Parameters

• **name**: `string`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:75](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L75)

***

### updateTemplate()

> **updateTemplate**(`name`, `updatedTemplate`): `Promise`\<`void`\>

#### Parameters

• **name**: `string`

• **updatedTemplate**: `Partial`\<`object`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/qllm-lib/src/templates/template-manager.ts:62](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-manager.ts#L62)
