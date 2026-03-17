import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

// Lazy-cached file contents — read once from disk on first access, then served from memory.
let docsText: string | undefined;
let openapiText: string | undefined;

export function registerResources(server: McpServer) {
  server.registerResource(
    'pendle-v2-docs',
    'pendle-v2://docs',
    {
      description:
        'Complete Pendle V2 developer documentation (architecture, Hosted SDK, contracts, oracles, limit orders, protocol mechanics)',
    },
    async (uri) => {
      docsText ??= readFileSync(join(DATA_DIR, 'llms-v2.txt'), 'utf-8');
      return {
        contents: [{ uri: uri.href, mimeType: 'text/plain', text: docsText }],
      };
    },
  );

  server.registerResource(
    'pendle-v2-openapi',
    'pendle-v2://openapi',
    {
      description:
        'OpenAPI 3.0 spec for the Pendle V2 backend — ~34 endpoint definitions with parameters and response schemas',
    },
    async (uri) => {
      openapiText ??= readFileSync(join(DATA_DIR, 'open-api.json'), 'utf-8');
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: openapiText }],
      };
    },
  );
}
