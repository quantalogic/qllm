[**QLLM API Documentation**](../README.md) • **Docs**

***

[QLLM API Documentation](../README.md) / ConfigurationManager

# Class: ConfigurationManager

## Extends

- `EventEmitter`

## Methods

### getConfig()

> **getConfig**(): `AppConfig`

#### Returns

`AppConfig`

#### Defined in

[config/configuration\_manager.ts:41](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L41)

***

### loadConfig()

> **loadConfig**(`configPath`?): `Promise`\<`void`\>

#### Parameters

• **configPath?**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[config/configuration\_manager.ts:28](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L28)

***

### updateAndSaveConfig()

> **updateAndSaveConfig**(`updates`): `Promise`\<`void`\>

#### Parameters

• **updates**: `Partial`\<`AppConfig`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[config/configuration\_manager.ts:45](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L45)

***

### updateConfig()

> **updateConfig**(`updates`): `void`

#### Parameters

• **updates**: `Partial`\<`AppConfig`\>

#### Returns

`void`

#### Defined in

[config/configuration\_manager.ts:50](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L50)

***

### validateConfig()

> **validateConfig**(): `boolean`

#### Returns

`boolean`

#### Defined in

[config/configuration\_manager.ts:71](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L71)

***

### getInstance()

> `static` **getInstance**(): [`ConfigurationManager`](ConfigurationManager.md)

#### Returns

[`ConfigurationManager`](ConfigurationManager.md)

#### Defined in

[config/configuration\_manager.ts:21](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/config/configuration_manager.ts#L21)
