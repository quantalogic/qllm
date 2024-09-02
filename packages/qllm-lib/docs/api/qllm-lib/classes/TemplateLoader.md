[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / TemplateLoader

# Class: TemplateLoader

## Constructors

### new TemplateLoader()

> **new TemplateLoader**(): [`TemplateLoader`](TemplateLoader.md)

#### Returns

[`TemplateLoader`](TemplateLoader.md)

## Methods

### load()

> `static` **load**(`inputFilePath`): `Promise`\<`object`\>

#### Parameters

• **inputFilePath**: `string`

#### Returns

`Promise`\<`object`\>

##### author

> **author**: `string`

##### categories?

> `optional` **categories**: `string`[]

##### content

> **content**: `string`

##### description

> **description**: `string`

##### example_outputs?

> `optional` **example_outputs**: `string`[]

##### input_variables?

> `optional` **input_variables**: `Record`\<`string`, `object`\>

##### model?

> `optional` **model**: `string`

##### name

> **name**: `string`

##### output_variables?

> `optional` **output_variables**: `Record`\<`string`, `object`\>

##### parameters?

> `optional` **parameters**: `object`

##### parameters.max_tokens?

> `optional` **max_tokens**: `number`

##### parameters.temperature?

> `optional` **temperature**: `number`

##### parameters.top_k?

> `optional` **top_k**: `number`

##### parameters.top_p?

> `optional` **top_p**: `number`

##### prompt_type?

> `optional` **prompt_type**: `string`

##### provider?

> `optional` **provider**: `string`

##### resolved_content?

> `optional` **resolved_content**: `string`

##### tags?

> `optional` **tags**: `string`[]

##### task_description?

> `optional` **task_description**: `string`

##### version

> **version**: `string`

#### Defined in

[packages/qllm-lib/src/templates/template-loader.ts:7](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-loader.ts#L7)

---

### loadAsBuilder()

> `static` **loadAsBuilder**(`inputFilePath`): `Promise`\<[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)\>

#### Parameters

• **inputFilePath**: `string`

#### Returns

`Promise`\<[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)\>

#### Defined in

[packages/qllm-lib/src/templates/template-loader.ts:16](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-loader.ts#L16)
