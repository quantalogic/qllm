[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / imageToBase64

# Function: imageToBase64()

> **imageToBase64**(`source`): `Promise`\<`ImageToBase64Output`\>

Converts an image to a base64-encoded string or returns the input if it's already base64-encoded.

## Parameters

• **source**: `string`

The URL, file path, or base64-encoded string of the image.

## Returns

`Promise`\<`ImageToBase64Output`\>

A Promise that resolves to the base64-encoded string of the image.

## Defined in

[packages/qllm-lib/src/utils/images/image-to-base64.ts:29](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/utils/images/image-to-base64.ts#L29)
