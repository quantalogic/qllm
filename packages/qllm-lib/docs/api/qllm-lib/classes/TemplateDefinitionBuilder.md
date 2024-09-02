[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / TemplateDefinitionBuilder

# Class: TemplateDefinitionBuilder

## Methods

### build()

> **build**(): `object`

#### Returns

`object`

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

##### tags?

> `optional` **tags**: `string`[]

##### task_description?

> `optional` **task_description**: `string`

##### version

> **version**: `string`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:351](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L351)

---

### clone()

> **clone**(): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:77](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L77)

---

### generatePrompt()

> **generatePrompt**(`inputs`): `string`

#### Parameters

• **inputs**: `Record`\<`string`, `any`\>

#### Returns

`string`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:319](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L319)

---

### merge()

> **merge**(`other`): `this`

#### Parameters

• **other**: [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:276](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L276)

---

### setResolvedContent()

> **setResolvedContent**(`content`): `this`

#### Parameters

• **content**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:72](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L72)

---

### toJSON()

> **toJSON**(): `string`

#### Returns

`string`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:328](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L328)

---

### toYAML()

> **toYAML**(): `string`

#### Returns

`string`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:332](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L332)

---

### validate()

> **validate**(): `string`[]

#### Returns

`string`[]

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:296](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L296)

---

### withCategories()

> **withCategories**(...`categories`): `this`

#### Parameters

• ...**categories**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:119](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L119)

---

### withConditional()

> **withConditional**(`condition`, `trueContent`, `falseContent`): `this`

#### Parameters

• **condition**: `string`

• **trueContent**: `string`

• **falseContent**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:269](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L269)

---

### withCustomInputValidator()

> **withCustomInputValidator**(`name`, `validator`): `this`

#### Parameters

• **name**: `string`

• **validator**

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:259](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L259)

---

### withExampleOutputs()

> **withExampleOutputs**(...`exampleOutputs`): `this`

#### Parameters

• ...**exampleOutputs**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:241](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L241)

---

### withInputVariable()

#### withInputVariable(name, variable)

> **withInputVariable**(`name`, `variable`): `this`

##### Parameters

• **name**: `string`

• **variable**

• **variable.customValidator?** = `...`

• **variable.default?**: `any` = `...`

• **variable.description**: `string` = `...`

• **variable.inferred?**: `boolean` = `...`

• **variable.place_holder?**: `any` = `...`

• **variable.type**: `"string"` \| `"number"` \| `"boolean"` \| `"array"` = `...`

##### Returns

`this`

##### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:144](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L144)

#### withInputVariable(name, type, description, options)

> **withInputVariable**(`name`, `type`, `description`, `options`?): `this`

##### Parameters

• **name**: `string`

• **type**: `"string"` \| `"number"` \| `"boolean"` \| `"array"`

• **description**: `string`

• **options?**: `Partial`\<`Omit`\<`object`, `"type"` \| `"description"`\>\>

##### Returns

`this`

##### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:145](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L145)

---

### withModel()

> **withModel**(`model`): `this`

#### Parameters

• **model**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:134](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L134)

---

### withOutputVariable()

#### withOutputVariable(name, variable)

> **withOutputVariable**(`name`, `variable`): `this`

##### Parameters

• **name**: `string`

• **variable**

• **variable.default?**: `any` = `...`

• **variable.description?**: `string` = `...`

• **variable.type**: `"string"` \| `"boolean"` \| `"object"` \| `"integer"` \| `"float"` \| `"array"` = `...`

##### Returns

`this`

##### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:179](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L179)

#### withOutputVariable(name, type, options)

> **withOutputVariable**(`name`, `type`, `options`?): `this`

##### Parameters

• **name**: `string`

• **type**: `"string"` \| `"boolean"` \| `"object"` \| `"integer"` \| `"float"` \| `"array"`

• **options?**: `Partial`\<`Omit`\<`object`, `"type"`\>\>

##### Returns

`this`

##### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:180](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L180)

---

### withParameters()

> **withParameters**(`parameters`): `this`

#### Parameters

• **parameters**: `undefined` \| `object`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:211](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L211)

---

### withPrompt()

> **withPrompt**(`prompt`): `this`

#### Parameters

• **prompt**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:67](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L67)

---

### withPromptType()

> **withPromptType**(`promptType`): `this`

#### Parameters

• **promptType**: `undefined` \| `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:221](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L221)

---

### withProvider()

> **withProvider**(`provider`): `this`

#### Parameters

• **provider**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:96](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L96)

---

### withTags()

> **withTags**(...`tags`): `this`

#### Parameters

• ...**tags**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:106](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L106)

---

### withTaskDescription()

> **withTaskDescription**(`taskDescription`): `this`

#### Parameters

• **taskDescription**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:231](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L231)

---

### withoutCategories()

> **withoutCategories**(...`categories`): `this`

#### Parameters

• ...**categories**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:124](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L124)

---

### withoutExampleOutputs()

> **withoutExampleOutputs**(...`outputs`): `this`

#### Parameters

• ...**outputs**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:249](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L249)

---

### withoutInputVariable()

> **withoutInputVariable**(`name`): `this`

#### Parameters

• **name**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:169](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L169)

---

### withoutModel()

> **withoutModel**(): `this`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:139](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L139)

---

### withoutOutputVariable()

> **withoutOutputVariable**(`name`): `this`

#### Parameters

• **name**: `string`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:201](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L201)

---

### withoutParameters()

> **withoutParameters**(): `this`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:216](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L216)

---

### withoutPromptType()

> **withoutPromptType**(): `this`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:226](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L226)

---

### withoutProvider()

> **withoutProvider**(): `this`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:101](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L101)

---

### withoutTags()

> **withoutTags**(...`tags`): `this`

#### Parameters

• ...**tags**: `string`[]

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:111](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L111)

---

### withoutTaskDescription()

> **withoutTaskDescription**(): `this`

#### Returns

`this`

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:236](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L236)

---

### create()

> `static` **create**(`__namedParameters`): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.author**: `string`

• **\_\_namedParameters.content**: `string`

• **\_\_namedParameters.description**: `string`

• **\_\_namedParameters.name**: `string`

• **\_\_namedParameters.version**: `string`

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:28](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L28)

---

### fromJSON()

> `static` **fromJSON**(`json`): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Parameters

• **json**: `string`

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:341](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L341)

---

### fromTemplate()

> `static` **fromTemplate**(`template`): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Parameters

• **template**

• **template.author**: `string` = `...`

• **template.categories?**: `string`[] = `...`

• **template.content**: `string` = `...`

• **template.description**: `string` = `...`

• **template.example_outputs?**: `string`[] = `...`

• **template.input_variables?**: `Record`\<`string`, `object`\> = `...`

• **template.model?**: `string` = `...`

• **template.name**: `string` = `...`

• **template.output_variables?**: `Record`\<`string`, `object`\> = `...`

• **template.parameters?** = `...`

• **template.parameters.max_tokens?**: `number` = `...`

• **template.parameters.temperature?**: `number` = `...`

• **template.parameters.top_k?**: `number` = `...`

• **template.parameters.top_p?**: `number` = `...`

• **template.prompt_type?**: `string` = `...`

• **template.provider?**: `string` = `...`

• **template.tags?**: `string`[] = `...`

• **template.task_description?**: `string` = `...`

• **template.version**: `string` = `...`

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:25](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L25)

---

### fromYAML()

> `static` **fromYAML**(`yamlString`): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Parameters

• **yamlString**: `string`

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:346](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L346)

---

### quickSetup()

> `static` **quickSetup**(`name`, `content`): [`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Parameters

• **name**: `string`

• **content**: `string`

#### Returns

[`TemplateDefinitionBuilder`](TemplateDefinitionBuilder.md)

#### Defined in

[packages/qllm-lib/src/templates/template-definition-builder.ts:57](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-definition-builder.ts#L57)
