import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { Workspace } = require('../apps/workbench/dist/core.cjs');
const { contextDelta } = require('../apps/workbench/dist/context.cjs');
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codech-bench-'));
try {
  await fs.mkdir(path.join(root, 'src'));
  await fs.writeFile(path.join(root, 'README.md'), '# Test application\n' + 'Architecture: local services, bounded tools, explicit review.\n'.repeat(55));
  await fs.writeFile(path.join(root, 'AGENTS.md'), '# Engineering agreement\n' + 'Run focused checks and record decisions in the knowledge vault.\n'.repeat(25));
  for (let n = 0; n < 100; n++) await fs.writeFile(path.join(root, 'src', `module-${n}.ts`), `export const value = ${n};`);
  const ws = new Workspace(root);
  const packet = await ws.context('Understand this project', 12000);
  const cold = contextDelta(packet, 'benchmark');
  const warm = contextDelta(await ws.context('Understand this project', 12000), 'benchmark', cold.snapshot);
  await fs.appendFile(path.join(root, 'AGENTS.md'), '\nNew rule: verify changed modules.');
  const changed = contextDelta(await ws.context('Understand this project', 12000), 'benchmark', warm.snapshot);
  const result = { benchmark: 'deterministic synthetic workspace, no inference', files: 102, coldChars: cold.chars, unchangedFollowupChars: warm.chars, changedFollowupChars: changed.chars, unchangedReductionPercent: Number((100 * (1 - warm.chars / cold.chars)).toFixed(2)), measures: 'newly attached project-context characters, NOT billed tokens, dollars or model quality' };
  console.log(JSON.stringify(result, null, 2));
  await fs.writeFile('docs/context-benchmark.json', JSON.stringify(result, null, 2) + '\n');
} finally {
  // mkdtemp creates this owned directory directly within the OS temporary directory.
  if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('codech-bench-')) throw new Error('Unexpected benchmark directory');
  await fs.rm(root, { recursive: true, force: true });
}
