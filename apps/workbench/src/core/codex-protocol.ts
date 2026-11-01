/** Wire values verified against Codex 0.166.0 app-server generate-json-schema.
 * SandboxMode (thread requests) is kebab-case; SandboxPolicy.type (turn requests) is camelCase.
 */
export function threadOptions(cwd: string, model: string) {
    return { cwd, model, approvalPolicy: 'untrusted' as const, sandbox: 'workspace-write' as const };
}
export function turnOptions(threadId: string, cwd: string, model: string, text: string) {
    return { threadId, cwd, model, approvalPolicy: 'untrusted' as const, input: [{ type: 'text' as const, text, text_elements: [] }], sandboxPolicy: { type: 'workspaceWrite' as const, writableRoots: [cwd], networkAccess: false } };
}
