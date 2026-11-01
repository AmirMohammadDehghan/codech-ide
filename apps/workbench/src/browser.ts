import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';

export interface BrowserContext { url: string; title: string; element?: any; selectedAt?: number }
export function browserUrl(input: string, engine = 'duckduckgo') {
    const value = input.trim();
    if (!value) return 'https://duckduckgo.com/';
    const candidate = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?([/?#]|$)/i.test(value) ? 'http://' + value : /^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(value) ? 'https://' + value : value;
    if (/^[a-z][\w+.-]*:\/\//i.test(candidate)) {
        const url = new URL(candidate);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) URL without embedded credentials.');
        return url.href;
    }
    return (engine === 'google' ? 'https://www.google.com/search?q=' : engine === 'bing' ? 'https://www.bing.com/search?q=' : 'https://duckduckgo.com/?q=') + encodeURIComponent(value);
}

// Runs only after the user enables Inspect, inside the selected browser page.
export function inspectorScript(binding: string) {
    return `(() => {
        if (globalThis.__codechInspector) { globalThis.__codechInspector.stop(); return false; }
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #86a9ff;background:#86a9ff22;z-index:2147483647;box-sizing:border-box';
        const label = document.createElement('div'); label.style.cssText='position:fixed;pointer-events:none;background:#1e2533;color:white;padding:5px 8px;font:12px monospace;z-index:2147483647;border-radius:4px';
        document.documentElement.append(overlay,label); let selected;
        const selector = el => { if(el.id) return '#'+CSS.escape(el.id); const parts=[]; for(let n=el;n&&n!==document.documentElement&&parts.length<5;n=n.parentElement){ const index=[...n.parentElement.children].filter(x=>x.tagName===n.tagName).indexOf(n)+1; parts.unshift(n.tagName.toLowerCase()+':nth-of-type('+index+')'); } return parts.join(' > '); };
        const move = event => { const el=event.composedPath()[0]; if(!(el instanceof Element)||el===overlay||el===label)return; selected=el;const r=el.getBoundingClientRect(); Object.assign(overlay.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});label.textContent=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+' · '+Math.round(r.width)+' × '+Math.round(r.height);label.style.left=Math.max(0,Math.min(r.x,innerWidth-260))+'px';label.style.top=Math.max(0,r.y-30)+'px'; };
        const stop = () => { document.removeEventListener('pointermove',move,true);document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);overlay.remove();label.remove();delete globalThis.__codechInspector; };
        const click = event => {event.preventDefault();event.stopImmediatePropagation();const el=event.composedPath()[0];if(!(el instanceof Element))return; const css=getComputedStyle(el); const styles={};for(const k of ['display','position','color','background-color','font-family','font-size','font-weight','line-height','padding','margin','width','height','gap','grid-template-columns','align-items','justify-content','border-radius'])styles[k]=css.getPropertyValue(k);
            const clone=el.cloneNode(true);for(const n of [clone,...clone.querySelectorAll('*')]){for(const a of [...n.attributes])if(/value|password|token|secret|authorization|cookie/i.test(a.name)||/^on/i.test(a.name))n.removeAttribute(a.name);if(n.matches('script,style,textarea'))n.textContent='';}const r=el.getBoundingClientRect();
            globalThis.__codechSelected=el;const source=el.closest('[data-codech-source],[data-source]');const data={selector:selector(el),tag:el.tagName.toLowerCase(),id:el.id,className:el.getAttribute('class'),html:clone.outerHTML.slice(0,5000),text:(el.matches('input,textarea,select')?'':clone.textContent||'').slice(0,1000),styles,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},sourceHint:source?.getAttribute('data-codech-source')||source?.getAttribute('data-source')||null};
            stop();globalThis[${JSON.stringify(binding)}](JSON.stringify(data));el.scrollIntoView({block:'center',behavior:'smooth'});
        };
        const key = event => {if(event.key==='Escape'){event.preventDefault();stop();globalThis[${JSON.stringify(binding)}]('null');}};
        globalThis.__codechInspector={stop};document.addEventListener('pointermove',move,true);document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);return true;
    })()`;
}

export class CodechBrowser implements vscode.Disposable {
    private last?: vscode.BrowserTab;
    private cdp?: vscode.BrowserCDPSession;
    private sessionId?: string;
    private next = 1;
    private requests = new Map<number, { resolve: (x: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
    private listeners: vscode.Disposable[] = [];
    context?: BrowserContext;
    private binding = 'codechPick_' + randomUUID().replaceAll('-', '');
    constructor(private changed: (context?: BrowserContext) => void) {
        try {
            this.listeners.push(vscode.window.onDidChangeActiveBrowserTab(tab => { if (tab) { if (tab !== this.last) void this.disconnect(); this.last = tab; this.context = { url: tab.url, title: tab.title }; this.changed(this.context); } }), vscode.window.onDidChangeBrowserTabState(tab => { if (tab === this.last) { if (tab.url !== this.context?.url) { void this.disconnect(); this.context = { url: tab.url, title: tab.title }; } else if (this.context) this.context.title = tab.title; this.changed(this.context); } }), vscode.window.onDidCloseBrowserTab(tab => { if (tab === this.last) { void this.disconnect(); this.last = undefined; this.context = undefined; this.changed(); } }));
        } catch { /* Browser API is enabled by the standalone distribution only. */ }
    }
    async open(input: string) {
        const url = browserUrl(input, vscode.workspace.getConfiguration('codech').get('searchEngine', 'duckduckgo'));
        try { this.last = await vscode.window.openBrowserTab(url, { viewColumn: vscode.ViewColumn.Active }); }
        catch { await vscode.commands.executeCommand('workbench.action.browser.open', url); }
    }
    private async request(method: string, params: any = {}, page = true): Promise<any> {
        if (!this.cdp) throw new Error('Open a browser tab in standalone Codech first.');
        const id = this.next++;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => { this.requests.delete(id); reject(new Error(`Browser request timed out: ${method}`)); }, 10000);
            this.requests.set(id, { resolve, reject, timer });
            void this.cdp!.sendMessage({ id, method, params, ...(page && this.sessionId ? { sessionId: this.sessionId } : {}) }).then(undefined, e => { clearTimeout(timer); this.requests.delete(id); reject(e); });
        });
    }
    private async connect() {
        if (this.cdp) return;
        const tab = vscode.window.activeBrowserTab || this.last;
        if (!tab) throw new Error('Open a page in the integrated browser first.');
        this.last = tab;
        this.cdp = await tab.startCDPSession();
        this.cdp.onDidReceiveMessage((raw: any) => {
            const m = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (m.id) { const p = this.requests.get(m.id); if (p) { clearTimeout(p.timer); this.requests.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); } }
            if (m.method === 'Runtime.bindingCalled' && m.params?.name === this.binding) {
                try { const value = JSON.parse(String(m.params.payload).slice(0, 20000)); this.context = { url: tab.url, title: tab.title, element: value, selectedAt: Date.now() }; this.changed(this.context); } catch { }
            }
        });
        this.cdp.onDidClose(() => { this.cdp = undefined; this.sessionId = undefined; });
        try {
            const targets = await this.request('Target.getTargets', {}, false);
            const target = targets.targetInfos?.find((t: any) => t.type === 'page' && t.url === tab.url) || targets.targetInfos?.find((t: any) => t.type === 'page');
            if (!target) throw new Error('Browser page target is not ready.');
            const result = await this.request('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false);
            this.sessionId = result.sessionId;
            await this.request('Runtime.enable');
            await this.request('Runtime.addBinding', { name: this.binding });
        } catch (e) { await this.disconnect(); throw e; }
    }
    async evaluate(expression: string) {
        await this.connect();
        const result = await this.request('Runtime.evaluate', { expression, returnByValue: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Page script failed.');
        return result.result?.value;
    }
    async inspect() { return this.evaluate(inspectorScript(this.binding)); }
    async scroll(direction: string) {
        return this.evaluate(direction === 'element' ? "globalThis.__codechSelected?.scrollIntoView({block:'center',behavior:'smooth'})" : `window.scrollBy({top: ${direction === 'up' ? '-1' : '1'} * innerHeight * 0.75, behavior:'smooth'})`);
    }
    async attachPage() {
        const page = await this.evaluate("({url:location.href,title:document.title,selection:String(getSelection()).slice(0,3000)})");
        this.context = { ...page, selectedAt: Date.now() }; this.changed(this.context); return page;
    }
    async disconnect() { const cdp = this.cdp; this.cdp = undefined; this.sessionId = undefined; for (const r of this.requests.values()) { clearTimeout(r.timer); r.reject(new Error('Browser tab changed.')); } this.requests.clear(); await cdp?.close(); }
    dispose() { void this.disconnect(); for (const l of this.listeners) l.dispose(); }
}
