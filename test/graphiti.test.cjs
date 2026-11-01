const { test } = require('node:test');
const assert = require('node:assert/strict');
// The optional service is not needed to verify its transport contract.
const { GraphitiClient } = require('../apps/workbench/dist/graphiti.cjs');
test('Graphiti rejects remote endpoints and scopes MCP fact searches', async (t) => { assert.throws(() => new GraphitiClient('https://example.com/mcp'), /loopback/); const old = global.fetch; t.after(() => global.fetch = old); const calls = []; global.fetch = async (url, options) => { const m = JSON.parse(options.body); calls.push(m); if (m.method === 'notifications/initialized')
    return new Response(null, { status: 202 }); if (m.method === 'tools/call') {
    assert.equal(options.headers['Mcp-Session-Id'], 'fixture-session');
    assert.deepEqual(m.params.arguments.group_ids, ['codech_test']);
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { content: [{ type: 'text', text: 'fact' }] } }), { headers: { 'Content-Type': 'application/json' } });
} return new Response(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { tools: [] } }), { headers: { 'Content-Type': 'application/json', 'Mcp-Session-Id': 'fixture-session' } }); }; const client = new GraphitiClient(); const result = await client.search('architecture', 'codech_test'); assert.equal(result.content[0].text, 'fact'); assert.equal(calls.filter(c => c.method === 'initialize').length, 1); });
