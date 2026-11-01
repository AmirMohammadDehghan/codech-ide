import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import * as fs from 'node:fs/promises';
export interface RpcMessage {
    id?: number | string;
    method?: string;
    params?: any;
    result?: any;
    error?: {
        message: string;
        code: number;
    };
}
export class CodexBridge {
    private process?: ChildProcessWithoutNullStreams;
    private next = 1;
    private pending = new Map<number, {
        resolve: (x: any) => void;
        reject: (e: Error) => void;
        timer: NodeJS.Timeout;
    }>();
    onEvent: (m: RpcMessage) => void = () => { };
    onRequest: (m: RpcMessage) => void = (m) => this.respond(m.id!, undefined, { code: -32601, message: 'Unsupported client request' });
    async connect(executable: string, home: string, args = ['app-server']) {
        if (this.process)
            return;
        await fs.mkdir(home, { recursive: true });
        const child = spawn(executable, args, { env: { ...process.env, CODEX_HOME: home }, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
        this.process = child;
        child.on('error', error => this.fail(error));
        child.on('exit', code => this.fail(new Error(`Codex app-server exited (${code}).`)));
        child.stderr.on('data', () => { }); // Never forward auth/config diagnostics into the webview.
        createInterface({ input: child.stdout }).on('line', line => {
            let m: RpcMessage;
            try {
                m = JSON.parse(line);
            }
            catch {
                return;
            }
            if (m.id !== undefined && m.method) {
                this.onRequest(m);
                return;
            }
            if (typeof m.id === 'number') {
                const p = this.pending.get(m.id);
                if (p) {
                    clearTimeout(p.timer);
                    this.pending.delete(m.id);
                    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
                }
            }
            else if (m.method)
                this.onEvent(m);
        });
        try {
            await this.request('initialize', { clientInfo: { name: 'codech_ide', title: 'Codech IDE', version: '0.3.0' } });
            this.notify('initialized', {});
        }
        catch (error) {
            this.close();
            throw error;
        }
    }
    request(method: string, params: any = {}): Promise<any> {
        const id = this.next++;
        return new Promise((resolve, reject) => { if (!this.process) {
            reject(new Error('Codex is not connected.'));
            return;
        } const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Codex request timed out: ${method}`)); }, 45000); this.pending.set(id, { resolve, reject, timer }); this.write({ id, method, params }); });
    }
    notify(method: string, params: any) { this.write({ method, params }); }
    respond(id: number | string, result?: any, error?: any) { this.write(error ? { id, error } : { id, result }); }
    private write(m: RpcMessage) { if (!this.process?.stdin.writable)
        throw new Error('Codex transport is closed.'); this.process.stdin.write(JSON.stringify(m) + '\n'); }
    private fail(error: Error) { this.process = undefined; for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(error);
    } this.pending.clear(); this.onEvent({ method: 'codech/disconnected', params: { message: error.message } }); }
    close() { const child = this.process; this.process = undefined; child?.kill(); for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(new Error('Codex stopped.'));
    } this.pending.clear(); }
}
