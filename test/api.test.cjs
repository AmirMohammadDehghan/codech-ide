const { test } = require('node:test');
const assert = require('node:assert/strict');
const { apiTurn } = require('../apps/workbench/dist/api.cjs');
test('API bounds tool output, reports measured usage and applies the configured response ceiling', async t => {
    const old = global.fetch; t.after(() => { global.fetch = old; });
    let step = 0;
    global.fetch = async (_url, options) => {
        const body = JSON.parse(options.body);
        assert.equal(body.max_output_tokens, 1000);
        if (step++ === 0) return { ok: true, json: async () => ({ id: 'r1', output: [{ type: 'function_call', call_id: 'c1', name: 'read_file', arguments: '{"path":"large.ts","start_line":3,"end_line":80}' }], usage: { total_tokens: 50, input_tokens: 40, output_tokens: 10, input_tokens_details: { cached_tokens: 20 } } }) };
        assert.ok(body.input[0].output.length < 1400);
        assert.equal(JSON.parse(body.input[0].output).truncated, true);
        return { ok: true, json: async () => ({ id: 'r2', output: [], usage: { total_tokens: 20, input_tokens: 15, output_tokens: 5 } }) };
    };
    const result = await apiTurn({ key: 'mock', model: 'gpt-6-luna', workspace: { read: async () => ('x'.repeat(300) + '\n').repeat(100) }, prompt: 'inspect', maxSteps: 3, maxOutputTokens: 1000, toolOutputChars: 1000, signal: new AbortController().signal, onText() {}, onTool() {}, onProposal() {}, approveCheck: async () => false });
    assert.equal(result.inputTokens, 55); assert.equal(result.outputTokens, 15); assert.equal(result.cachedTokens, 20);
});
test('API usage guard stops before executing additional tools', async t => {
    const old = global.fetch; t.after(() => { global.fetch = old; });
    global.fetch = async () => ({ ok: true, json: async () => ({ id: 'r1', output: [{ type: 'function_call', name: 'run_check', call_id: 'c1', arguments: '{"name":"test"}' }], usage: { total_tokens: 2001 } }) });
    let tools = 0;
    const result = await apiTurn({ key: 'mock', model: 'gpt-6-luna', workspace: {}, prompt: 'test', maxSteps: 4, usageGuard: 2000, signal: new AbortController().signal, onText() {}, onTool() { tools++; }, onProposal() {}, approveCheck: async () => { throw Error('Must not execute'); } });
    assert.equal(tools, 0); assert.equal(result.previous, undefined);
});
test('Responses tool loop returns proposals without writing and bounds tool steps', async (t) => { const previousFetch = global.fetch; t.after(() => global.fetch = previousFetch); let step = 0; const toolOutputs = []; global.fetch = async (url, options) => { assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(options.headers.Authorization, 'Bearer test-key'); const body = JSON.parse(options.body); if (step++ === 0)
    return { ok: true, json: async () => ({ id: 'r1', output: [{ type: 'function_call', call_id: 'c1', name: 'propose_edit', arguments: JSON.stringify({ path: 'src/app.ts', content: 'new contents', reason: 'simplify' }) }], usage: { total_tokens: 10 } }) }; toolOutputs.push(...body.input); return { ok: true, json: async () => ({ id: 'r2', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Proposed a focused edit.' }] }], usage: { total_tokens: 5 } }) }; }; const proposals = []; const result = await apiTurn({ key: 'test-key', model: 'gpt-6.1-terra', workspace: { safe: async () => '/workspace/src/app.ts', read: async () => 'old contents' }, prompt: 'improve', maxSteps: 3, signal: new AbortController().signal, onText: () => { }, onTool: () => { }, onProposal: p => proposals.push(p), approveCheck: async () => false }); assert.equal(proposals.length, 1); assert.equal(proposals[0].before, 'old contents'); assert.equal(result.tokens, 15); assert.match(toolOutputs[0].output, /pendingReview/); });
