/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Span,
  SpanAttributes,
  SpanStatusCode,
  Tracer,
} from '@opentelemetry/api';
import { spanRequestSymbol } from './constants';

import type { PluginFastifyReply } from './types';

/**
 * Starts Span
 * @param reply - reply function
 * @param tracer - tracer
 * @param spanName - span name
 * @param spanAttributes - span attributes
 */
export function startSpan(
  reply: PluginFastifyReply,
  tracer: Tracer,
  spanName: string,
  spanAttributes: SpanAttributes = {}
) {
  const span = tracer.startSpan(spanName, { attributes: spanAttributes });

  const spans: Span[] = reply[spanRequestSymbol] || [];
  spans.push(span);

  Object.defineProperty(reply, spanRequestSymbol, {
    enumerable: false,
    configurable: true,
    value: spans,
  });

  return span;
}

/**
 * Ends span
 * @param reply - reply function
 * @param err - error
 */
export function endSpan(reply: PluginFastifyReply, err?: any) {
  const spans = reply[spanRequestSymbol] || [];
  // there is no active span, or it has already ended
  if (!spans.length) {
    return;
  }
  spans.forEach(span => {
    if (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
      span.recordException(err);
    }
    span.end();
  });
  delete reply[spanRequestSymbol];
}

// @TODO after approve add this to instrumentation package and replace usage
// when it will be released

/**
 * This function handles the missing case from instrumentation package when
 * execute can either return a promise or void. And using async is not an
 * option as it is producing unwanted side effects.
 * @param execute - function to be executed
 * @param onFinish - function called when function executed
 * @param preventThrowingError - prevent to throw error when execute
 * function fails
 */
export function safeExecuteInTheMiddleMaybePromise<T>(
  execute: () => Promise<T> | T,
  onFinish: (e: Error | undefined, result?: T) => void,
  preventThrowingError?: boolean
): Promise<T> | T | void {
  let error: Error | undefined;
  let executeResult: Promise<T> | T | void;
  let isPromise = false;
  let result: T | undefined = undefined;
  try {
    executeResult = execute();
    const promiseResult = executeResult as Promise<T>;

    isPromise = promiseResult && typeof promiseResult.then === 'function';

    if (isPromise) {
      promiseResult.then(
        res => {
          onFinish(undefined, res);
        },
        (err: Error) => {
          onFinish(err);
        }
      );
    } else {
      result = executeResult as T | undefined;
    }
  } catch (e) {
    error = e;
  } finally {
    if (!isPromise) {
      onFinish(error, result);
      if (error && !preventThrowingError) {
        // eslint-disable-next-line no-unsafe-finally
        throw error;
      }
    }
    // eslint-disable-next-line no-unsafe-finally
    return executeResult;
  }
}
