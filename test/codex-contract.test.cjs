const {test}=require('node:test');const assert=require('node:assert/strict');const {threadOptions,turnOptions}=require('../apps/workbench/dist/codex-protocol.cjs');
// Enum spellings taken from the bundled 0.166.0 generated JSON schema, not Rust variant names.
test('Codex thread and turn payloads use their distinct wire enum spellings',()=>{
 const thread=threadOptions('/project','gpt-6.1-terra');assert.ok(['untrusted','on-request','never'].includes(thread.approvalPolicy));assert.ok(['read-only','workspace-write','danger-full-access'].includes(thread.sandbox));
 const turn=turnOptions('thread-1','/project','gpt-6.1-terra','Explain this function');assert.equal(turn.approvalPolicy,thread.approvalPolicy);assert.equal(turn.sandboxPolicy.type,'workspaceWrite');assert.deepEqual(turn.sandboxPolicy.writableRoots,['/project']);assert.equal(turn.sandboxPolicy.networkAccess,false);assert.equal(turn.input[0].text,'Explain this function');assert.deepEqual(turn.input[0].text_elements,[]);
});
