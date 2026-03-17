/**
 * Generates a fully-typed PendleApi client from the live Pendle V2 OpenAPI spec.
 *
 * Output: src/openapi/api.ts
 * Run with: npm run generate:api
 */

import * as path from 'node:path';
import { generateApi } from 'swagger-typescript-api';

const PENDLE_API_SPEC = 'https://staging-api.pendle.finance/core/docs/specs.json';

const outputPath = path.resolve(import.meta.dirname, '../src/openapi');

console.log('Fetching Pendle V2 OpenAPI spec...');
await generateApi({
  url: PENDLE_API_SPEC,
  output: outputPath,
  fileName: 'api.ts',
  httpClientType: 'fetch',
  apiClassName: 'PendleApi',
  silent: false,
  unwrapResponseData: true,
  defaultResponseType: 'any',
  moduleNameFirstTag: true,
  hooks: {
    onCreateRouteName(routeNameInfo) {
      // Strip "Controller" suffix that NestJS adds to operation IDs
      if (routeNameInfo.usage?.includes('Controller')) {
        routeNameInfo.usage = routeNameInfo.usage.split('Controller')[1];
        routeNameInfo.usage =
          routeNameInfo.usage.charAt(0).toLowerCase() + routeNameInfo.usage.slice(1);
      }
      if (routeNameInfo.original?.includes('Controller')) {
        routeNameInfo.original = routeNameInfo.original.split('Controller')[1];
        routeNameInfo.original =
          routeNameInfo.original.charAt(0).toLowerCase() + routeNameInfo.original.slice(1);
      }
      return routeNameInfo;
    },
  },
});

console.log('✓ OpenAPI types generated at src/openapi/api.ts');
