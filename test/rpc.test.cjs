const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { CodexBridge } = require('../apps/workbench/dist/codex.cjs');
test('JSON-RPC handshake, errors and human approval routing', async (t) => { const home = await fs.mkdtemp(path.join(os.tmpdir(), 'codech-rpc-')); const bridge = new CodexBridge(); t.after(() => { bridge.close(); return fs.rm(home, { recursive: true, force: true }); }); await bridge.connect(process.execPath, home, [path.join(__dirname, 'rpc-fixture.cjs')]); const catalog = await bridge.request('model/list'); assert.equal(catalog.data[0].model, 'test-model'); await assert.rejects(() => bridge.request('test/error'), /fixture failure/); const decision = new Promise(resolve => { bridge.onRequest = m => { assert.equal(m.method, 'item/commandExecution/requestApproval'); bridge.respond(m.id, { decision: 'decline' }); }; bridge.onEvent = m => { if (m.method === 'test/decision')
    resolve(m.params); }; }); await bridge.request('test/approval'); assert.deepEqual(await decision, { decision: 'decline' }); });
