export {};
declare const acquireVsCodeApi: () => { postMessage(m: any): void; getState(): any; setState(s: any): void };
const host = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : { postMessage: (m: any) => window.dispatchEvent(new CustomEvent('codech-preview', { detail: m })), getState: () => undefined, setState: (_: any) => {} };
const saved = host.getState() || {};
let draft = saved.draft || '', model = saved.model || 'gpt-6.1-terra', provider = saved.provider || 'codex';
let state: any = { targetEnabled: true, pet: true }, stream = '', activity = '', error = '', voice = 'idle', approvals: any[] = [];
let petGreeting = false;
const el = document.querySelector('#dock')!;
const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const post = (m: any) => host.postMessage(m);
const persist = () => host.setState({ draft, provider, model });
const btn = (label: string, action: string, title = label, cls = '') => `<button class="${cls}" data-action="${action}" title="${esc(title)}" aria-label="${esc(title)}">${label}</button>`;
function pet() {
    return `<button class="pet ${state.running ? 'thinking' : voice === 'recording' ? 'listening' : petGreeting ? 'greeting' : ''}" data-action="petGreet" title="کدچی · ${state.running ? 'مشغول کار' : 'همراه کدچ'}" aria-label="Codechi companion"><svg viewBox="0 0 80 64" aria-hidden="true"><path class="tail" d="M59 43q24 8 12-18q-2 14-15 12"/><path class="ears" d="M18 25 13 5 32 16M48 16 67 5 63 29"/><rect class="body" x="15" y="15" width="50" height="41" rx="19"/><path class="cheek" d="m20 34 17 9-9 8M60 34 43 43l9 8"/><g class="eyes"><path d="m26 28-5 5 5 4M54 28l5 5-5 4"/></g><path class="mouth" d="m36 42 4 3 4-3"/><path class="feet" d="M25 54v5M55 54v5"/></svg></button>`;
}
function render() {
    const focused = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    const focusId = focused?.id; const selection = focused && 'selectionStart' in focused ? [focused.selectionStart, focused.selectionEnd] : undefined;
    const t = state.target;
    const targetLabel = state.targetKind === 'browser' && state.browser ? `${state.browser.element?.selector || state.browser.title || 'Browser'} · ${state.browser.url}` : t ? `${t.path}:${t.line} ${t.side ? '· ' + t.side : ''} ${t.symbol ? '· ' + t.symbol.name : ''} ${t.selections?.length ? '· selected text' : ''} ${t.dirty ? '· unsaved' : ''}` : 'Open a file or browser page to attach context';
    const reply = stream || [...(state.session?.messages || [])].reverse().find((m: any) => m.role === 'assistant')?.text || '';
    el.innerHTML = `<div class="dock"><div class="dock-heading"><div class="identity">${state.pet ? pet() : ''}<strong>Ask Codech</strong><span class="status">${state.running ? 'Working' : voice === 'recording' ? 'Recording · offline' : voice === 'preparing' ? 'Preparing offline voice' : ['preparing', 'transcribing'].includes(voice) ? 'Transcribing locally' : petGreeting ? 'سلام، من کدچی‌ام!' : 'Ready'}</span></div><div class="actions">${btn('↗ Web', 'browserOpen', 'Open browser or search the web')}${btn('＋ Sources', 'addSource', 'Add a reference folder or Obsidian vault')}${btn('⊞ Tools', 'capabilities', 'Extensions, skills and MCP tools')}${btn('◷ History', 'history')}${btn('＋', 'newChat', 'New conversation')}</div></div>
    <div class="target-line"><label><input id="attach" type="checkbox" ${state.targetEnabled ? 'checked' : ''}> Context</label><span title="${esc(targetLabel)}">${esc(targetLabel)}</span>${btn('Details', 'details')}</div>
    ${state.targetKind === 'browser' && state.browser ? `<div class="browser-tools">${btn('⌖ Inspect', 'browserInspect', 'Select and attach a page element')}${btn('↥', 'scrollUp', 'Scroll page up')}${btn('↧', 'scrollDown', 'Scroll page down')}${btn('◎ Reveal', 'revealElement', 'Scroll to selected element')}${btn('&lt;/&gt; Source', 'browserSource', 'Find element source in project')}${btn('Attach selection', 'browserAttach')}${btn('DevTools', 'browserDevTools')}</div>` : ''}
    ${error ? `<div class="error" role="alert">${esc(error)} ${btn('×', 'dismiss', 'Dismiss error')}</div>` : ''}
    ${approvals.map(a => `<div class="approval"><strong>Permission requested</strong><p>${esc(a.reason)}</p><pre>${esc(a.command || a.method)}</pre>${btn('Decline', 'decline:' + a.id)}${btn('Allow once', 'allow:' + a.id)}</div>`).join('')}
    ${reply ? `<details class="reply" ${state.running ? 'open' : ''}><summary>${state.running ? 'Live reply' : 'Latest reply'} · ${esc(reply.slice(0, 110).replace(/\n/g, ' '))}</summary><pre dir="auto">${esc(reply)}</pre></details>` : ''}
    <div class="input-wrap"><textarea id="prompt" dir="auto" aria-label="Message Codech" placeholder="دربارهٔ همین کد، یادداشت یا المان بپرس…" rows="2">${esc(draft)}</textarea><div class="input-tools"><div class="models"><select id="provider" aria-label="Provider"><option value="codex" ${provider === 'codex' ? 'selected' : ''}>ChatGPT / Codex</option><option value="api" ${provider === 'api' ? 'selected' : ''}>API</option></select><input id="model" aria-label="Model" value="${esc(model)}" list="models"><datalist id="models"><option value="gpt-6-luna"><option value="gpt-6.1-terra"><option value="gpt-6.1-sol"></datalist></div><div class="actions">${btn(voice === 'recording' ? '■ Stop mic' : ['preparing', 'transcribing'].includes(voice) ? 'Cancel voice' : '◉ فارسی', ['preparing', 'transcribing'].includes(voice) ? 'voiceCancel' : 'voice', 'Offline Persian dictation; transcript stays in draft', voice === 'recording' ? 'recording' : '')}${btn(state.running ? '■ Stop' : '↑ Send', state.running ? 'stop' : 'send', state.running ? 'Stop agent' : 'Send message', 'primary')}</div></div></div><div class="caption" role="status">${esc(activity || 'Enter to send · Shift+Enter for a new line · Only selected context and relevant graph neighbors are included')}</div><dialog id="details"><h3>Context preview</h3><pre dir="auto">${esc(JSON.stringify(state.targetKind === 'browser' ? state.browser : state.target || {}, null, 2))}</pre>${btn('Close', 'closeDetails')}</dialog></div>`;
    el.querySelectorAll<HTMLElement>('[data-action]').forEach(b => b.onclick = () => action(b.dataset.action!));
    const prompt = el.querySelector<HTMLTextAreaElement>('#prompt')!;
    prompt.oninput = () => { draft = prompt.value; persist(); };
    prompt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); action('send'); } };
    el.querySelector<HTMLInputElement>('#attach')!.onchange = e => post({ type: 'targetEnabled', enabled: (e.target as HTMLInputElement).checked });
    el.querySelector<HTMLSelectElement>('#provider')!.onchange = e => { provider = (e.target as HTMLSelectElement).value; persist(); };
    el.querySelector<HTMLInputElement>('#model')!.oninput = e => { model = (e.target as HTMLInputElement).value; persist(); };
    if (focusId) { const input = document.getElementById(focusId) as HTMLInputElement; input?.focus(); if (selection && input?.type !== 'checkbox' && input?.tagName !== 'SELECT') { try { input.setSelectionRange(selection[0], selection[1]); } catch { } } }
}
function action(action: string) {
    if (action === 'send') { if (!draft.trim() || state.running) return; post({ type: 'send', text: draft, provider, model }); draft = ''; stream = ''; error = ''; persist(); render(); return; }
    if (action === 'dismiss') { error = ''; render(); return; }
    if (action === 'details' || action === 'closeDetails') { const d = document.querySelector<HTMLDialogElement>('#details')!; action === 'details' ? d.showModal() : d.close(); return; }
    if (action === 'petGreet') { petGreeting = !petGreeting; render(); return; }
    if (['scrollUp', 'scrollDown', 'revealElement'].includes(action)) { post({ type: 'browserScroll', direction: action === 'scrollUp' ? 'up' : action === 'scrollDown' ? 'down' : 'element' }); return; }
    if (action.startsWith('allow:') || action.startsWith('decline:')) { const [choice, id] = action.split(':'); post({ type: 'approval', id, accept: choice === 'allow' }); approvals = approvals.filter(a => a.id !== id); render(); return; }
    post({ type: action });
}
window.addEventListener('message', e => {
    const m = e.data; if (!m?.type) return;
    if (m.type === 'state') { if (state.session?.id !== m.session?.id) { stream = ''; provider = m.session?.provider || provider; model = m.session?.model || model; } state = { ...state, ...m }; }
    if (m.type === 'target') { state.target = m.target; state.targetKind = m.kind; }
    if (m.type === 'browser') { state.browser = m.browser; state.targetKind = 'browser'; }
    if (m.type === 'delta') stream += m.text;
    if (m.type === 'message') { if (m.role === 'assistant') stream = m.text; }
    if (m.type === 'activity') activity = m.text;
    if (m.type === 'error') error = m.text;
    if (m.type === 'approval') approvals.push(m);
    if (m.type === 'done') { state.running = false; approvals = []; if (m.error) error = m.error; }
    if (m.type === 'voice') { voice = m.status; if (m.text) { draft += (draft ? '\n' : '') + m.text; persist(); } if (m.error) error = m.error; }
    render(); if (m.type === 'focus') document.getElementById('prompt')?.focus();
});
render(); post({ type: 'ready' });
