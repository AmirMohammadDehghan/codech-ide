const rl = require('node:readline').createInterface({ input: process.stdin });
const send = x => process.stdout.write(JSON.stringify(x) + '\n');
rl.on('line', line => { const m = JSON.parse(line); if (m.method === 'initialize')
    send({ id: m.id, result: { userAgent: 'test' } });
else if (m.method === 'model/list')
    send({ id: m.id, result: { data: [{ model: 'test-model' }] } });
else if (m.method === 'test/approval') {
    send({ id: m.id, result: { ok: true } });
    send({ id: 'server-1', method: 'item/commandExecution/requestApproval', params: { command: 'npm test', threadId: 'thread-1' } });
}
else if (m.method === 'test/error')
    send({ id: m.id, error: { code: 1, message: 'fixture failure' } });
else if (m.id === 'server-1')
    send({ method: 'test/decision', params: m.result }); });
