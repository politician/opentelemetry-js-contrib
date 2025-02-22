# OpenTelemetry aws-sdk Instrumentation for Node.js

[![NPM Published Version][npm-img]][npm-url]
[![dependencies][dependencies-image]][dependencies-url]
[![devDependencies][devdependencies-image]][devdependencies-url]
[![Apache License][license-image]][license-image]

[component owners](https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/.github/component_owners.yml): @willarmiros @NathanielRN @blumamir

This module provides automatic instrumentation for [`aws-sdk` v2](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/) and [`@aws-sdk` v3](https://github.com/aws/aws-sdk-js-v3)

## Installation

```bash
npm install --save @opentelemetry/instrumentation-aws-sdk
```

## Usage

For further automatic instrumentation instruction see the [@opentelemetry/instrumentation](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-instrumentation) package.

```js
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  AwsInstrumentation,
} = require("@opentelemetry/instrumentation-aws-sdk");

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new AwsInstrumentation({
      // see under for available configuration
    }),
  ],
});
```

### aws-sdk Instrumentation Options

aws-sdk instrumentation has few options available to choose from. You can set the following:

| Options                           | Type                                      | Description                                                                                                                |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `preRequestHook`                  | `AwsSdkRequestCustomAttributeFunction`    | Hook called before request send, which allow to add custom attributes to span.                                             |
| `responseHook`                    | `AwsSdkResponseCustomAttributeFunction`   | Hook for adding custom attributes when response is received from aws.                                                      |
| `sqsProcessHook`                  | `AwsSdkSqsProcessCustomAttributeFunction` | Hook called after starting sqs `process` span (for each sqs received message), which allow to add custom attributes to it. |
| `suppressInternalInstrumentation` | `boolean`                                 | Most aws operation use http requests under the hood. Set this to `true` to hide all underlying http spans.                 |

## Span Attributes

Both V2 and V3 instrumentations are collecting the following attributes:
| Attribute Name | Type | Description | Example |
| -------------- | ---- | ----------- | ------- |
| `rpc.system` | string | Always equals "aws-api" |
| `rpc.method` | string | he name of the operation corresponding to the request, as returned by the AWS SDK. If the SDK does not provide a way to retrieve a name, the name of the command SHOULD be used, removing the suffix `Command` if present, resulting in a PascalCase name with no spaces. | `PutObject` |
| `rpc.service` | string | The name of the service to which a request is made, as returned by the AWS SDK. If the SDK does not provide a away to retrieve a name, the name of the SDK's client interface for a service SHOULD be used, removing the suffix `Client` if present, resulting in a PascalCase name with no spaces. | `S3`, `DynamoDB`, `Route53` |
| `aws.region` | string | Region name for the request | "eu-west-1" |

### V2 attributes

In addition to the above attributes, the instrumentation also collect the following for V2 ONLY:
| Attribute Name | Type | Description | Example |
| -------------- | ---- | ----------- | ------- |
| `aws.operation` | string | The method name for the request. | for `SQS.sendMessage(...)` the operation is "sendMessage" |
| `aws.signature.version` | string | AWS version of authentication signature on the request. | "v4" |
| `aws.service.api` | string | The sdk class name for the service | "SQS" |
| `aws.service.identifier` | string | Identifier for the service in the sdk | "sqs" |
| `aws.service.name` | string | Abbreviation name for the service | "Amazon SQS" |
| `aws.request.id` | uuid | Request unique id, as returned from aws on response | "01234567-89ab-cdef-0123-456789abcdef" |
| `aws.error` | string | information about a service or networking error, as returned from AWS | "UriParameterError: Expected uri parameter to have length >= 1, but found "" for params.Bucket" |

### Custom User Attributes

The instrumentation user can configure a `preRequestHook` function which will be called before each request, with a normalized request object (across v2 and v3) and the corresponding span.  
This hook can be used to add custom attributes to the span with any logic.  
For example, user can add interesting attributes from the `request.params`, and write custom logic based on the service and operation.
Usage example:

```js
awsInstrumentationConfig = {
  preRequestHook: (span, request) => {
    if (span.serviceName === "s3") {
      span.setAttribute("s3.bucket.name", request.commandInput["Bucket"]);
    }
  },
};
```

### Specific Service Logic

AWS contains dozens of services accessible with the JS SDK. For many services, the default attributes specified above are enough, but other services have specific [trace semantic conventions](https://github.com/open-telemetry/opentelemetry-specification/tree/master/specification/trace/semantic_conventions), or need to inject/extract intra-process context, or set intra-process context correctly.

Specific service logic currently implemented for:

- [SQS](./docs/sqs.md)
- DynamoDb

---

This instrumentation is a work in progress. We implemented some of the specific trace semantics for some of the services, and strive to support more services and extend the already supported services in the future. You can [Open an Issue](https://github.com/aspecto-io/opentelemetry-ext-js/issues), or [Submit a Pull Request](https://github.com/aspecto-io/opentelemetry-ext-js/pulls) if you want to contribute.

## Potential Side Effects

The instrumentation is doing best effort to support the trace specification of OpenTelemetry. For SQS, it involves defining new attributes on the `Messages` array, as well as on the manipulated types generated from this array (to set correct trace context for a single SQS message operation). Those properties are defined as [non-enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) properties, so they have minimum side effect on the app. They will, however, show when using the `Object.getOwnPropertyDescriptors` and `Reflect.ownKeys` functions on SQS `Messages` array and for each `Message` in the array.

## Migration From opentelemetry-instrumentation-aws-sdk

This instrumentation was originally published under the name `"opentelemetry-instrumentation-aws-sdk"` in [this repo](https://github.com/aspecto-io/opentelemetry-ext-js). Few breaking changes were made during porting to the contrib repo to align with conventions:

### Hook Info

The instrumentation's config `preRequestHook`, `responseHook` and `sqsProcessHook` functions signature changed, so the second function parameter is info object, containing the relevant hook data.

### `moduleVersionAttributeName` config option

The `moduleVersionAttributeName` config option is removed. To add the aws-sdk package version to spans, use the `moduleVersion` attribute in hook info for `preRequestHook` and `responseHook` functions.

## Useful links

- For more information on OpenTelemetry, visit: <https://opentelemetry.io/>
- For more about OpenTelemetry JavaScript: <https://github.com/open-telemetry/opentelemetry-js>
- For help or feedback on this project, join us in [GitHub Discussions][discussions-url]

## License

Apache 2.0 - See [LICENSE][license-url] for more information.

[discussions-url]: https://github.com/open-telemetry/opentelemetry-js/discussions
[license-url]: https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/LICENSE
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[dependencies-url]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib?path=plugins%2Fnode%2Fopentelemetry-instrumentation-aws-sdk
[devdependencies-image]: https://status.david-dm.org/gh/open-telemetry/opentelemetry-js-contrib.svg?path=plugins%2Fnode%2Fopentelemetry-instrumentation-aws-sdk&type=dev
[devdependencies-url]: https://david-dm.org/open-telemetry/opentelemetry-js-contrib?path=plugins%2Fnode%2Fopentelemetry-instrumentation-aws-sdk&type=dev
[npm-url]: https://www.npmjs.com/package/@opentelemetry/instrumentation-aws-sdk
[npm-img]: https://badge.fury.io/js/%40opentelemetry%2Finstrumentation-aws-sdk.svg
