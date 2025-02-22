# OpenTelemetry Knex Instrumentation for Node.js

[![NPM Published Version][npm-img]][npm-url]
[![dependencies][dependencies-image]][dependencies-url]
[![devDependencies][devDependencies-image]][devDependencies-url]
[![Apache License][license-image]][license-image]

This module provides automatic instrumentation for [`knex`](https://github.com/knex/node-knex) and allows the user to automatically collect trace data and export them to their backend of choice.

For automatic instrumentation see the
[@opentelemetry/sdk-trace-node](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-node) package.

Compatible with OpenTelemetry JS API and SDK `1.0+`.

## Installation

```bash
npm install --save @opentelemetry/instrumentation-knex
```

### Supported Versions

 - `>=0.10.0`

## Usage

```js
const { KnexInstrumentation, KnexInstrumentationConfig } = require('@opentelemetry/instrumentation-knex');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

const provider = new NodeTracerProvider();

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

registerInstrumentations({
  instrumentations: [
    new KnexInstrumentation(
      new KnexInstrumentationConfig({
        maxQueryLength: 100,
      })
    )],
  tracerProvider: provider,
});
```

### Configuration Options

| Options | Type | Example | Description |
| ------- | ---- | ------- | ----------- |
| `maxQueryLength` | `number` | `100` | Truncate `db.statement` attribute to a maximum length. If the statement is truncated `'..'` is added to it's end. Default `1022`. `-1` leaves `db.statement` untouched. |

## Useful links

- For more information on OpenTelemetry, visit: <https://opentelemetry.io/>
- For more about OpenTelemetry JavaScript: <https://github.com/open-telemetry/opentelemetry-js>
- For help or feedback on this project, join us in [GitHub Discussions][discussions-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[discussions-url]: https://github.com/open-telemetry/opentelemetry-js/discussions
[license-url]: https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[dependencies-image]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib/status.svg?path=packages/opentelemetry-instrumentation-knex
[dependencies-url]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib?path=packages%2Fopentelemetry-instrumentation-knex
[devDependencies-image]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib/dev-status.svg?path=packages/opentelemetry-instrumentation-knex
[devDependencies-url]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib?path=packages%2Fopentelemetry-instrumentation-knex&type=dev
[npm-url]: https://www.npmjs.com/package/@opentelemetry/instrumentation-knex
[npm-img]: https://badge.fury.io/js/%40opentelemetry%2Finstrumentation-knex.svg
