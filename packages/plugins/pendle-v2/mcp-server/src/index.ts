import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerResources } from './resources.js';
import { initDatabase } from './storage.js';
import { startSyncLoop, syncAll } from './sync.js';
import { registerTools } from './tools/index.js';

const server = new McpServer({
  name: 'pendle-v2',
  version: '0.1.0',
});

const db = initDatabase();

try {
  await syncAll(db);
} catch (err) {
  console.error('[pendle-mcp-v2] Initial sync failed — starting with empty data:', err);
}

startSyncLoop(db);

registerResources(server);
registerTools(server, db);

const transport = new StdioServerTransport();
await server.connect(transport);
