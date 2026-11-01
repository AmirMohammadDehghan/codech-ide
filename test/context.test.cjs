const { test } = require('node:test');
const assert = require('node:assert/strict');
const { contextDelta, recentHistory } = require('../apps/workbench/dist/context.cjs');
const { Workspace } = require('../apps/workbench/dist/core.cjs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('warm context omits repeated text, changed excerpts replace old ones, scopes reset', () => {
  const packet = { blocks: { '@map': 'README.md\n', 'README.md': 'Initial architecture.\n'.repeat(200), 'AGENTS.md': 'Run meaningful tests.\n'.repeat(100) }, chars: 6510 };
  const cold = contextDelta(packet, 'api:terra:projectA');
  const warm = contextDelta(packet, 'api:terra:projectA', cold.snapshot);
  assert.equal(warm.changed.length, 0);
  assert.ok(warm.chars < cold.chars / 10);
  const update = contextDelta({ ...packet, blocks: { ...packet.blocks, 'README.md': 'Changed architecture.' } }, 'api:terra:projectA', warm.snapshot);
  assert.deepEqual(update.changed, ['README.md']);
  assert.match(update.text, /Changed architecture/);
  assert.doesNotMatch(update.text, /Initial architecture/);
  for (const scope of ['codex:terra:projectA', 'api:luna:projectA', 'api:terra:projectB']) assert.equal(contextDelta(packet, scope, warm.snapshot).mode, 'full');
  const omitted = contextDelta({ blocks: { '@map': 'README.md\n' }, chars: 10 }, 'api:terra:projectA', warm.snapshot);
  assert.ok(contextDelta(packet, 'api:terra:projectA', omitted.snapshot).changed.includes('README.md'));
});

test('context sees edits and removed files without a stale filesystem cache', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codech-context-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const ws = new Workspace(root);
  await fs.writeFile(path.join(root, 'README.md'), 'Old');
  const a = contextDelta(await ws.context('project'), root);
  await fs.writeFile(path.join(root, 'README.md'), 'New');
  const b = contextDelta(await ws.context('project'), root, a.snapshot);
  assert.match(b.text, /New/);
  await fs.unlink(path.join(root, 'README.md'));
  const c = contextDelta(await ws.context('project'), root, b.snapshot);
  assert.ok(c.changed.includes('@map'));
  assert.equal(c.snapshot.hashes['README.md'], undefined);
});

test('API rollover replays at most four recent bounded excerpts and labels omitted history', () => {
  const messages = Array.from({ length: 20 }, (_, i) => ({ role: 'user', text: `message${i}:` + 'x'.repeat(4000) }));
  const history = recentHistory(messages);
  assert.match(history, /intervening history omitted/);
  assert.ok(history.length < 6400);
  assert.match(history, /message0:/);
  assert.doesNotMatch(history, /message1:/);
  assert.equal(recentHistory([]), '');
});
