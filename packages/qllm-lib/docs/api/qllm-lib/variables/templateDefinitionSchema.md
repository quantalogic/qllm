[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / templateDefinitionSchema

# Variable: templateDefinitionSchema

> `const` **templateDefinitionSchema**: `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>

## Type declaration

### author

> **author**: `ZodString`

### categories

> **categories**: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>

### content

> **content**: `ZodString`

### description

> **description**: `ZodString`

### example\_outputs

> **example\_outputs**: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>

### input\_variables

> **input\_variables**: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>\>\>

### model

> **model**: `ZodOptional`\<`ZodString`\>

### name

> **name**: `ZodString`

### output\_variables

> **output\_variables**: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>\>\>

### parameters

> **parameters**: `ZodOptional`\<`ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>\>

### prompt\_type

> **prompt\_type**: `ZodOptional`\<`ZodString`\>

### provider

> **provider**: `ZodOptional`\<`ZodString`\>

### tags

> **tags**: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>

### task\_description

> **task\_description**: `ZodOptional`\<`ZodString`\>

### version

> **version**: `ZodString`

## Defined in

[packages/qllm-lib/src/templates/template-schema.ts:37](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-schema.ts#L37)
