/** Streamable HTTP MCP client for an explicitly configured local Graphiti service. */
export class GraphitiClient {
    private session?: string;
    private id = 1;
    private ready = false;
    constructor(public url = 'http://127.0.0.1:8000/mcp/') {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname))
            throw new Error('Graphiti must use a loopback HTTP endpoint.');
    }
    private async post(message: any) {
        const response = await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(this.session ? { 'Mcp-Session-Id': this.session } : {}) }, body: JSON.stringify(message), signal: AbortSignal.timeout(20000) });
        if (!response.ok)
            throw new Error(`Graphiti MCP returned ${response.status}.`);
        const session = response.headers.get('mcp-session-id');
        if (session)
            this.session = session;
        if (response.status === 202 || response.status === 204)
            return {};
        const content = await response.text();
        let result: any;
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            for (const line of content.split(/\r?\n/)) {
                if (line.startsWith('data:')) {
                    try {
                        const data = JSON.parse(line.slice(5));
                        if (data.id === message.id)
                            result = data;
                    }
                    catch { }
                }
            }
        }
        else
            result = JSON.parse(content);
        if (result?.error)
            throw new Error(result.error.message);
        return result?.result || {};
    }
    async connect() { if (!this.ready) {
        await this.post({ jsonrpc: '2.0', id: this.id++, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'codech-ide', version: '0.1.0' } } });
        await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' });
        this.ready = true;
    } return this.post({ jsonrpc: '2.0', id: this.id++, method: 'tools/list', params: {} }); }
    async search(query: string, group: string) { await this.connect(); return this.post({ jsonrpc: '2.0', id: this.id++, method: 'tools/call', params: { name: 'search_memory_facts', arguments: { query, group_ids: [group], max_facts: 8 } } }); }
}
