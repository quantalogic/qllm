[**QLLM API Documentation**](../README.md) • **Docs**

***

[QLLM API Documentation](../README.md) / ProviderFactory

# Class: ProviderFactory

## Constructors

### new ProviderFactory()

> **new ProviderFactory**(): [`ProviderFactory`](ProviderFactory.md)

#### Returns

[`ProviderFactory`](ProviderFactory.md)

## Methods

### getProvider()

> `static` **getProvider**(`providerName`): `Promise`\<`LLMProvider`\>

#### Parameters

• **providerName**: `ProviderName`

#### Returns

`Promise`\<`LLMProvider`\>

#### Defined in

[core/providers/provider\_factory.ts:14](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/core/providers/provider_factory.ts#L14)

***

### registerProviderPlugin()

> `static` **registerProviderPlugin**(`name`, `initFunction`): `void`

#### Parameters

• **name**: `string`

• **initFunction**

#### Returns

`void`

#### Defined in

[core/providers/provider\_factory.ts:38](https://github.com/YatchiYa/qllm/blob/c17ead74a8e7150bea6cf408fa2b104235926e7e/packages/qllm-lib/src/core/providers/provider_factory.ts#L38)
