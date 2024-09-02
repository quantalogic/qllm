[**QLLM Library API Documentation v3.0.6**](../README.md) • **Docs**

---

[QLLM Library API Documentation v3.0.6](../globals.md) / TemplateExecutor

# Class: TemplateExecutor

## Extends

- `EventEmitter`

## Constructors

### new TemplateExecutor()

> **new TemplateExecutor**(): [`TemplateExecutor`](TemplateExecutor.md)

#### Returns

[`TemplateExecutor`](TemplateExecutor.md)

#### Overrides

`EventEmitter.constructor`

#### Defined in

[packages/qllm-lib/src/templates/template-executor.ts:30](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-executor.ts#L30)

## Methods

### emit()

> **emit**\<`K`\>(`eventName`, `arg`): `boolean`

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Type Parameters

• **K** _extends_ keyof `TemplateExecutorEvents`

#### Parameters

• **eventName**: `K`

• **arg**: `TemplateExecutorEvents`\[`K`\]

#### Returns

`boolean`

#### Since

v0.1.26

#### Overrides

`EventEmitter.emit`

#### Defined in

[packages/qllm-lib/src/templates/template-executor.ts:41](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-executor.ts#L41)

---

### execute()

> **execute**(`__namedParameters`): `Promise`\<`object`\>

#### Parameters

• **\_\_namedParameters**: [`ExecutionContext`](../interfaces/ExecutionContext.md)

#### Returns

`Promise`\<`object`\>

##### outputVariables

> **outputVariables**: `Record`\<`string`, `any`\>

##### response

> **response**: `string`

#### Defined in

[packages/qllm-lib/src/templates/template-executor.ts:48](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-executor.ts#L48)

---

### on()

> **on**\<`K`\>(`eventName`, `listener`): `this`

Adds the `listener` function to the end of the listeners array for the event
named `eventName`. No checks are made to see if the `listener` has already
been added. Multiple calls passing the same combination of `eventName` and
`listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Type Parameters

• **K** _extends_ keyof `TemplateExecutorEvents`

#### Parameters

• **eventName**: `K`

The name of the event.

• **listener**

The callback function

#### Returns

`this`

#### Since

v0.1.101

#### Overrides

`EventEmitter.on`

#### Defined in

[packages/qllm-lib/src/templates/template-executor.ts:34](https://github.com/quantalogic/qllm/blob/b15a3aa4af263bce36ea091a0f29bf1255b95497/packages/qllm-lib/src/templates/template-executor.ts#L34)
