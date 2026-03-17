/**
 * Sync data files from live sources.
 * Run with: npm run sync-data
 *
 * - data/open-api.json  ← fetched from api-v2.pendle.finance/core/docs-json
 * - data/llms-v2.txt    ← fetched from docs.pendle.finance/llms-full.txt (V2 portion)
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

async function syncOpenApi() {
  console.log('Fetching V2 OpenAPI spec...');
  const res = await fetch('https://api-v2.pendle.finance/core/docs-json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const spec = await res.json();
  const json = JSON.stringify(spec, null, 2);
  writeFileSync(join(DATA_DIR, 'open-api.json'), json);
  const paths = Object.keys(
    ((spec as Record<string, unknown>).paths as Record<string, unknown>) ?? {},
  ).length;
  console.log(`✓ open-api.json — ${paths} endpoints`);
}

async function syncDocs() {
  console.log('Fetching llms-full.txt...');
  const res = await fetch('https://docs.pendle.finance/llms-full.txt');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const full = await res.text();
  // Extract only the V2 portion (before the Boros section)
  const v2Part = full.split('# Part 2: Pendle Boros')[0].trim();
  writeFileSync(join(DATA_DIR, 'llms-v2.txt'), v2Part);
  console.log(`✓ llms-v2.txt — ${v2Part.split('\n').length} lines`);
}

await Promise.all([syncOpenApi(), syncDocs()]);
console.log('\nSync complete.');
