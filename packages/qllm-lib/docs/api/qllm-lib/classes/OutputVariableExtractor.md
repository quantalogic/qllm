[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / OutputVariableExtractor

# Class: OutputVariableExtractor

## Methods

### extractVariables()

> **extractVariables**(`output`): `Record`\<`string`, `any`\>

#### Parameters

• **output**: `string`

#### Returns

`Record`\<`string`, `any`\>

#### Defined in

[packages/qllm-lib/src/templates/output-variable-extractor.ts:12](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/output-variable-extractor.ts#L12)

---

### extractVariables()

> `static` **extractVariables**(`template`, `output`): `Record`\<`string`, `any`\>

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

• **output**: `string`

#### Returns

`Record`\<`string`, `any`\>

#### Defined in

[packages/qllm-lib/src/templates/output-variable-extractor.ts:5](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/output-variable-extractor.ts#L5)
