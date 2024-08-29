[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

***

[QLLM Library API Documentation v3.0.6](../globals.md) / templateVariableSchema

# Variable: templateVariableSchema

> `const` **templateVariableSchema**: `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>

## Type declaration

### customValidator

> **customValidator**: `ZodOptional`\<`ZodFunction`\<`ZodTuple`\<[`ZodAny`], `ZodUnknown`\>, `ZodBoolean`\>\>

### default

> **default**: `ZodOptional`\<`ZodAny`\>

### description

> **description**: `ZodString`

### inferred

> **inferred**: `ZodOptional`\<`ZodBoolean`\>

### place\_holder

> **place\_holder**: `ZodOptional`\<`ZodAny`\>

### type

> **type**: `ZodEnum`\<[`"string"`, `"number"`, `"boolean"`, `"array"`]\>

## Defined in

[packages/qllm-lib/src/templates/template-schema.ts:3](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-schema.ts#L3)
