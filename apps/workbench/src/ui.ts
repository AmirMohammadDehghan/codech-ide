declare const acquireVsCodeApi: undefined | (() => {
    postMessage: (m: any) => void;
    getState: () => any;
    setState: (s: any) => void;
});
const host = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
const icons: Record<string, string> = { chat: 'M4 4h16v12H9l-5 4V4z', files: 'M8 3H4v18h16V7h-8V3zm4 0 8 4', book: 'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2zm0 0v16', review: 'M6 3v12m12-6v12M6 7h8a4 4 0 0 1 4 4M3 3h6M15 21h6', branch: 'M6 3v13a4 4 0 0 0 8 0V8m-3 0h6M3 3h6', graph: 'M12 5 5 18h14L12 5zm0 0v13', box: 'm12 3 9 5v9l-9 5-9-5V8l9-5zm0 10v9M3 8l9 5 9-5', plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-6-6 6 6-6 6', search: 'M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14', check: 'm5 12 4 4L19 6', stop: 'M6 6h12v12H6z', refresh: 'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2', chevron: 'm9 5 7 7-7 7', terminal: 'm4 6 6 6-6 6m9 0h7', key: 'M14 10a5 5 0 1 0-4 4l-6 6m0-4 4 4', settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 3v3m0 12v3M3 12h3m12 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2' };
const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.box}"/></svg>`;
const logo = `<svg viewBox="0 0 64 64" aria-label="Codech"><path fill="var(--accent)" d="M7 23 30 6v15L7 38zM34 44l23-17v15L34 59z"/><path fill="currentColor" d="m34 6 23 17v3L34 43V28l7-5-7-5zM30 59 7 42v-3l23-17v15l-7 5 7 5z"/></svg>`;
const esc = (value: any) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
let data: any = { sessions: [], files: [], notes: [], changes: [], worktrees: [], proposals: [], tab: 'chat', trusted: true };
let draft = '';
let provider = 'codex';
let model = 'gpt-6.1-terra';
let activity = '';
let error = '';
let graphKind = 'code';
let graphData: any;
let contextInfo: any;
let models: any[] = [];
let pluginReport = '';
let stream = new Map<string, string>();
let approvals: any[] = [];
let memoryReport = '';
const app = document.querySelector('#app')!;
function post(m: any) { if (host)
    host.postMessage(m);
else
    window.dispatchEvent(new CustomEvent('codech-preview', { detail: m })); }
const navs = [['chat', 'Conversations', 'chat'], ['knowledge', 'Knowledge', 'book'], ['review', 'Code review', 'review'], ['worktrees', 'Worktrees', 'branch'], ['graph', 'Graph', 'graph'], ['extensions', 'Extensions', 'box']];
function button(label: string, action: string, cls = '', attrs = '') { return `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`; }
function render() {
    const session = data.session;
    const root = (session?.root || data.root || '').split(/[\\/]/).pop() || 'No project open';
    const count = data.changes?.filter((x: any) => !x.approved).length || 0;
    app.innerHTML = `<div class="shell"><aside class="rail"><div class="rail-logo">${logo}</div>${navs.map(([id, label, ico]) => button(icon(ico), `nav:${id}`, data.tab === id ? 'rail-button active' : 'rail-button', `title="${label}" aria-label="${label}"`)).join('')}<div class="rail-spacer"></div>${button(icon('settings'), 'nav:extensions', 'rail-button', 'aria-label="Settings"')}</aside>
 <aside class="sidebar"><div class="brand">${logo}<span>codech<span class="ide">IDE</span></span><span class="alpha">alpha</span></div><div class="project-label">WORKSPACE</div>${button(`<span class="project-avatar">${esc(root.slice(0, 1).toUpperCase())}</span><span class="project-text">${esc(root)}<small>${data.root ? 'Local workspace' : 'Open a project to begin'}</small></span>${icon('chevron')}`, 'openFolder', 'project')}
 <div class="side-nav">${navs.slice(0, 3).map(([id, label, ico]) => button(`${icon(ico)}<span>${label}</span>${id === 'review' && count ? `<span class="count">${count}</span>` : ''}`, `nav:${id}`, data.tab === id ? 'nav-item selected' : 'nav-item')).join('')}</div>
 <div class="section-label"><span>CONVERSATIONS</span>${button(icon('plus'), 'newChat', 'icon-button', 'title="New conversation" aria-label="New conversation"')}</div><div class="sessions">${data.sessions.slice(0, 12).map((s: any) => button(`${icon('chat')}<span>${esc(s.title)}<small>${esc(s.provider === 'codex' ? 'ChatGPT / Codex' : 'OpenAI API')}</small></span>`, `session:${s.id}`, s.id === session?.id ? 'session selected' : 'session')).join('') || '<p class="muted side-empty">Your work starts here.</p>'}</div>
 <div class="sidebar-bottom"><span class="status-dot"></span>Local first<span class="version">v0.2.0</span></div></aside>
 <main><header class="topbar"><div class="breadcrumbs">${esc(root)}<span>/</span><strong>${esc(navs.find(n => n[0] === data.tab)?.[1] || 'Conversations')}</strong></div><div class="header-actions"><span class="pill">${icon('branch')} ${esc(data.worktrees?.find((w: any) => w.worktree === session?.root)?.branch?.replace('refs/heads/', '') || 'workspace')}</span>${button(`${icon('settings')} Theme`, 'appearance', 'icon-button appearance-button', 'title="Change color theme" aria-label="Change color theme"')}${button(icon('refresh'), 'refresh', 'icon-button', 'title="Refresh" aria-label="Refresh"')}</div></header>
 <div class="tabs">${navs.map(([id, label, ico]) => button(`${icon(ico)}${label}${id === 'review' && count ? `<span class="tab-count">${count}</span>` : ''}`, `nav:${id}`, data.tab === id ? 'tab current' : 'tab')).join('')}</div>
 ${!data.trusted ? '<div class="notice">Workspace Trust is required before the agent can read files or run tools.</div>' : ''}
 ${error ? `<div class="error" role="alert">${esc(error)}${button('Dismiss', 'dismiss', 'text-button')}</div>` : ''}
 <div class="workspace-content">${renderContent()}</div><footer class="footer"><span><span class="status-dot"></span>${data.running ? 'Agent working' : 'Ready when you are'}</span><span>Code-OSS workbench<span class="footer-dot">·</span>Human review enabled</span></footer></main>
 <aside class="inspector"><div class="inspector-title">PROJECT CONTEXT<span class="live-dot"></span></div><div class="context-project">${icon('files')}<div>${esc(root)}<small>${data.files.length} indexed paths · bounded scan</small></div></div><div class="context-card"><span class="eyebrow">CONTEXT BUDGET</span><div class="budget">${contextInfo ? contextInfo.chars.toLocaleString() : '—'}<small>context characters sent</small></div><div class="meter"><i></i></div><p>${contextInfo ? `${contextInfo.avoidedChars || 0} repeated characters avoided. ${contextInfo.mode === 'delta' ? 'Changes only.' : 'Fresh context.'}` : 'Context is collected when you send a message.'}</p></div><div class="section-label">KNOWLEDGE <span>${data.notes.length}</span></div><div class="context-notes">${data.notes.slice(0, 4).map((n: any) => button(`${icon('book')}<span>${esc(n.title)}</span>`, `file:${n.path}`, 'context-note')).join('') || '<p class="muted">Save decisions and conventions as local Markdown notes.</p>'}</div><div class="section-label">WORKING AGREEMENT</div><ul class="agreement"><li>${icon('check')}Prepared tools</li><li>${icon('check')}Explicit project context</li><li>${icon('check')}Review before committing</li></ul><div class="inspector-bottom">${logo}<p>One space.<br>From thought to working code.</p></div></aside></div><div class="toast" role="status">${esc(activity)}</div>`;
    bind();
}
function renderContent() {
    if (data.tab === 'chat')
        return chat();
    if (data.tab === 'knowledge')
        return `<section class="page"><div class="page-heading"><div><span class="eyebrow">YOUR PROJECT'S MEMORY</span><h1>Knowledge, connected.</h1><p>Local Markdown. Wikilinks. Decisions the next session can find.</p></div>${button(`${icon('plus')} New note`, 'newNote', 'primary')}</div><div class="note-grid">${data.notes.map((n: any) => `<button class="note-card" data-action="file:${esc(n.path)}"><span class="note-icon">${icon('book')}</span><h3>${esc(n.title)}</h3><p>${esc(n.text.replace(/^#.*\n/, '').slice(0, 160))}</p><small>${n.links.length} outgoing links ${icon('arrow')}</small></button>`).join('') || empty('book', 'A home for project knowledge', 'Create your first note. Store architecture decisions, conventions and answers here.')}</div><div class="subtle-banner">Compatible with plain Markdown vaults. The Obsidian plugin runtime is not included in 0.2.</div></section>`;
    if (data.tab === 'review')
        return `<section class="page"><div class="page-heading"><div><span class="eyebrow">HUMAN IN THE LOOP</span><h1>Make every change clear.</h1><p>Open a native diff, inspect the code, then approve or request a revision.</p></div>${button(`${icon('refresh')} Refresh`, 'refresh', 'secondary')}</div>${data.gitError ? `<div class="notice">${esc(data.gitError)}</div>` : ''}<div class="review-list">${data.changes.map((c: any) => `<article class="review-row"><div class="file-status ${c.approved ? 'approved' : ''}">${c.approved ? icon('check') : esc(c.status)}</div><div class="review-name"><strong>${esc(c.path)}</strong><small>${c.approved ? 'Approved for these exact contents' : 'Waiting for your review'} · ${esc(c.revision.slice(0, 8))}</small></div><div class="review-actions">${button('Open diff', `diff:${c.path}`, 'secondary')}${button(icon('chat'), `feedback:${c.path}`, 'icon-button', 'title="Request changes" aria-label="Request changes"')}${button(c.approved ? 'Approved' : `${icon('check')} Approve`, `approve:${c.path}`, c.approved ? 'approved-label' : 'primary', c.approved ? 'disabled' : '')}</div></article>`).join('') || empty('review', 'A clean working tree', 'Agent changes and your edits will appear here. Approvals expire when the file changes.')}</div>${data.proposals.length ? `<h2>Agent proposals</h2>${data.proposals.map((p: any) => `<article class="review-row"><div class="review-name"><strong>${esc(p.path)}</strong><small>${esc(p.reason)}</small></div>${button('Open diff', `proposalDiff:${p.id}`, 'secondary')}${button(p.applied ? 'Applied' : 'Apply reviewed edit', `apply:${p.id}`, 'primary', p.applied ? 'disabled' : '')}</article>`).join('')}` : ''}<div class="subtle-banner">Approvals refer to the exact reviewed contents. Commit when every visible change is approved.<div class="memory-toolbar">${button("Commit approved changes", "commit", "primary", data.changes.length > 0 && data.changes.every((c: any) => c.approved) ? "" : "disabled")}${button("Open native source control", "sourceControl", "text-button")}</div></div></section>`;
    if (data.tab === 'worktrees')
        return `<section class="page"><div class="page-heading"><div><span class="eyebrow">SPACE FOR EACH TASK</span><h1>Parallel work. Clear boundaries.</h1><p>Each worktree has its own files and branch. New worktrees start from committed HEAD.</p></div>${button(`${icon('plus')} New worktree`, 'createWorktree', 'primary')}</div><div class="worktree-grid">${data.worktrees.map((w: any) => `<article class="worktree-card">${icon('branch')}<span class="pill">${w.worktree === data.session?.root ? 'Active' : 'Available'}</span><h3>${esc(w.branch?.replace('refs/heads/', '') || 'Detached HEAD')}</h3><code>${esc(w.worktree)}</code><small>${esc(String(w.HEAD || '').slice(0, 10))}</small>${button(`Use for new chat ${icon('arrow')}`, `worktree:${w.worktree}`, 'secondary')}</article>`).join('') || empty('branch', 'Open a Git repository', 'Worktrees require an existing Git repository with a commit.')}</div></section>`;
    if (data.tab === 'graph')
        return `<section class="page graph-page"><div class="page-heading"><div><span class="eyebrow">SEE THE CONNECTIONS</span><h1>A map of what matters.</h1><p>Explore code imports and the connections between your notes.</p></div><div class="segmented">${button('Code', 'graph:code', graphKind === 'code' ? 'on' : '')}${button('Knowledge', 'graph:knowledge', graphKind === 'knowledge' ? 'on' : '')}</div></div><div class="graph-canvas">${graphData ? drawGraph() : empty('graph', 'Build your project map', 'Choose Code or Knowledge to scan this workspace.')}</div><div class="subtle-banner">${esc(graphData?.method || 'Local code and Markdown graphs work without a model or database.')}<div class="memory-toolbar"><strong>Graphiti semantic memory</strong>${button('Connect local service', 'graphitiConnect', 'secondary')}${button('Search project memory', 'graphitiSearch', 'text-button')}</div><p>The optional Graphiti service has separate setup and inference requirements. See docs/GRAPHITI.md.</p>${memoryReport ? `<pre class="plugin-report">${esc(memoryReport)}</pre>` : ''}</div></section>`;
    return `<section class="page"><div class="page-heading"><div><span class="eyebrow">MAKE IT YOURS</span><h1>A workbench that grows.</h1><p>Language tools, agent skills and integrations, with clear compatibility boundaries.</p></div></div><div class="extension-grid"><article class="extension-card">${icon('settings')}<h3>Appearance & workflow</h3><p>Graphite, Paper, Forest or any compatible theme. Your chat follows the editor. Add familiar JetBrains keyboard shortcuts.</p>${button('Change color theme', 'appearance', 'primary')}${button('Find IntelliJ / PyCharm keymap', 'keymap', 'text-button')}${button('Agent budgets & settings', 'settings', 'secondary')}</article><article class="extension-card">${icon('box')}<h3>VS Code extensions</h3><p>Use the native extension manager or install a compatible VSIX. The independent app uses Open VSX.</p>${button('Browse extensions', 'extensions', 'secondary')}${button('Install VSIX', 'vsix', 'text-button')}</article><article class="extension-card">${icon('book')}<h3>Obsidian ecosystem</h3><p>Markdown vaults and wikilinks work now. Executing Obsidian plugins needs a dedicated compatibility host.</p>${button('Inspect plugin manifest', 'pluginInspect', 'secondary')}<span class="tag">Compatibility research</span></article><article class="extension-card">${icon('terminal')}<h3>Agent capabilities</h3><p>The Codex provider loads its supported skills and MCP configuration from the isolated Codech runtime home.</p><code>Codech global storage / codex</code><span class="tag">Codex App Server</span></article><article class="extension-card">${icon('key')}<h3>Model connection</h3><p>Sign in through Codex with ChatGPT, or bring an OpenAI API key. Model availability depends on your account.</p>${button('Sign in with ChatGPT', 'login', 'primary')}${button('Set API key', 'apiKey', 'text-button')}${button('Load model catalog', 'models', 'text-button')}</article></div>${pluginReport ? `<pre class="plugin-report">${esc(pluginReport)}</pre>` : ''}</section>`;
}
function empty(ico: string, title: string, body: string) { return `<div class="empty">${icon(ico)}<h3>${title}</h3><p>${body}</p></div>`; }
function chat() {
    const messages = data.session?.messages || [];
    const hasMessages = messages.length > 0;
    return `<div class="chat-layout"><div class="conversation" id="conversation">${hasMessages ? messages.map((m: any) => `<div class="message ${m.role}"><div class="message-avatar">${m.role === 'user' ? 'You' : logo}</div><div><div class="message-author">${m.role === 'user' ? 'You' : 'Codech'}</div><div class="message-text" dir="auto">${esc(m.text)}</div></div></div>`).join('') : [`<div class="hero"><div class="hero-logo">${logo}</div><div class="eyebrow">YOUR AGENT. YOUR WORKSPACE.</div><h1>A clear space<br>to build something great.</h1><p>Bring your ideas, code and project knowledge together.<br>Codech keeps the work connected — and you in control.</p><div class="quick-start">${[['Plan a feature', 'Turn an idea into a clear implementation plan.', 'chat'], ['Understand this project', 'Find the structure, conventions and next steps.', 'files'], ['Review my changes', 'Walk through what changed and why.', 'review']].map(([t, d, i]) => `<button class="quick-card" data-prompt="${esc(t)}">${icon(i)}<strong>${t}</strong><small>${d}</small><span>${icon('arrow')}</span></button>`).join('')}</div></div>`].join('')}
 ${[...stream.values()].map(text => `<div class="message assistant streaming"><div class="message-avatar">${logo}</div><div><div class="message-author">Codech <span class="live-dot"></span></div><div class="message-text" dir="auto">${esc(text)}</div></div></div>`).join('')}
 ${approvals.map(a => `<div class="approval"><span class="eyebrow">AGENT NEEDS YOUR DECISION</span><p>${esc(a.reason)}</p><pre>${esc(a.command || a.method)}</pre><small>${esc(a.cwd)}</small><div>${button('Decline', `decline:${a.id}`, 'secondary')}${button('Allow once', `allow:${a.id}`, 'primary')}</div></div>`).join('')}</div>
 <div class="composer-area"><div class="composer"><textarea id="prompt" dir="auto" aria-label="Message Codech" placeholder="چه چیزی می‌خواهی بسازیم؟" ${data.running ? 'disabled' : ''}>${esc(draft)}</textarea><div class="composer-toolbar"><div class="composer-left"><span class="agent-label">${icon('terminal')} Agent</span><span class="divider"></span><select id="provider" aria-label="Model provider"><option value="codex" ${provider === 'codex' ? 'selected' : ''}>ChatGPT / Codex</option><option value="api" ${provider === 'api' ? 'selected' : ''}>OpenAI API</option></select><input id="model" aria-label="Model ID" list="model-list" value="${esc(model)}"><datalist id="model-list"><option value="gpt-6-luna"><option value="gpt-6.1-terra"><option value="gpt-6.1-sol">${models.map(m => `<option value="${esc(m.model || m.id)}">`).join('')}</datalist></div>${data.running ? button(icon('stop'), 'stop', 'send-button', 'aria-label="Stop agent"') : button(icon('arrow'), 'send', 'send-button', 'aria-label="Send message"')}</div></div><div class="composer-caption"><span>${icon('book')} Knowledge included on demand</span><span>Enter to send <span class="keycap">↵</span></span></div></div></div>`;
}
function drawGraph() {
    const nodes = graphData.nodes.slice(0, 70);
    if (!nodes.length)
        return empty('graph', 'No connections yet', 'Add source files or linked knowledge notes to this project.');
    const pos = new Map<string, {
        x: number;
        y: number;
    }>();
    nodes.forEach((n: any, i: number) => { const a = i * Math.PI * 2 / nodes.length; const r = nodes.length < 5 ? 125 : 205; pos.set(n.id, { x: 450 + Math.cos(a) * r, y: 265 + Math.sin(a) * r }); });
    return `<svg class="network" viewBox="0 0 900 530" role="img" aria-label="${esc(graphKind)} dependency graph">${graphData.edges.map((e: any) => { const a = pos.get(e.source), b = pos.get(e.target); return a && b ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>` : ''; }).join('')}${nodes.map((n: any) => { const p = pos.get(n.id)!; return `<g class="graph-node" data-action="${graphKind === 'code' ? `file:${esc(n.id)}` : n.path ? `file:${esc(n.path)}` : 'none'}" tabindex="0" role="button" aria-label="${esc(n.label)}"><circle cx="${p.x}" cy="${p.y}" r="7"/><text x="${p.x}" y="${p.y + 24}" text-anchor="middle">${esc(n.label.slice(0, 28))}</text></g>`; }).join('')}</svg><span class="graph-counter">${nodes.length} nodes · ${graphData.edges.length} links</span>`;
}
function bind() {
    app.querySelectorAll<HTMLElement>('[data-action]').forEach(el => { el.onclick = () => action(el.dataset.action!); if (el.tagName.toLowerCase() === 'g')
        el.onkeydown = e => { if (e.key === 'Enter')
            action(el.dataset.action!); }; });
    app.querySelectorAll<HTMLElement>('[data-prompt]').forEach(el => el.onclick = () => { draft = el.dataset.prompt!; render(); (document.querySelector('#prompt') as HTMLTextAreaElement)?.focus(); });
    const prompt = app.querySelector<HTMLTextAreaElement>('#prompt');
    if (prompt) {
        prompt.oninput = () => { draft = prompt.value; };
        prompt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            action('send');
        } };
    }
    const select = app.querySelector<HTMLSelectElement>('#provider');
    if (select)
        select.onchange = () => { provider = select.value; };
    const input = app.querySelector<HTMLInputElement>('#model');
    if (input)
        input.oninput = () => { model = input.value; };
    if (data.running) {
        const c = app.querySelector('#conversation');
        if (c)
            c.scrollTop = c.scrollHeight;
    }
}
function action(value: string) {
    const i = value.indexOf(':');
    const action = i < 0 ? value : value.slice(0, i), arg = i < 0 ? '' : value.slice(i + 1);
    error = '';
    if (action === 'nav') {
        data.tab = arg;
        post({ type: 'navigate', tab: arg });
        render();
        if (arg === 'graph')
            post({ type: 'graph', kind: graphKind });
        return;
    }
    if (action === 'dismiss') {
        error = '';
        render();
        return;
    }
    if (action === 'send') {
        if (!draft.trim() || data.running)
            return;
        const text = draft;
        draft = '';
        stream.clear();
        post({ type: 'send', text, provider, model });
        return;
    }
    if (action === 'session') {
        stream.clear();
        post({ type: 'selectSession', id: arg });
        return;
    }
    if (action === 'file') {
        post({ type: 'openFile', path: arg });
        return;
    }
    if (action === 'graph') {
        graphKind = arg;
        post({ type: 'graph', kind: arg });
        return;
    }
    if (action === 'worktree') {
        post({ type: 'useWorktree', path: arg });
        return;
    }
    if (action === 'approve') {
        const change = data.changes.find((c: any) => c.path === arg);
        if (change)
            post({ type: 'approve', path: arg, revision: change.revision });
        return;
    }
    if (action === 'diff' || action === 'feedback') {
        post({ type: action, path: arg });
        return;
    }
    if (action === 'proposalDiff' || action === 'apply') {
        post({ type: action === 'apply' ? 'applyProposal' : action, id: arg });
        return;
    }
    if (action === 'allow' || action === 'decline') {
        post({ type: 'approval', id: arg, accept: action === 'allow' });
        approvals = approvals.filter(a => a.id !== arg);
        render();
        return;
    }
    post({ type: action });
}
window.addEventListener('message', event => {
    const m = event.data;
    if (!m?.type)
        return;
    if (m.type === 'state') {
        data = { ...data, ...m };
        if (data.session) {
            provider = data.session.provider;
            model = data.session.model;
        }
        if (!data.running)
            stream.clear();
    }
    if (m.type === 'message') {
        data.session?.messages.push({ role: m.role, text: m.text });
    }
    if (m.type === 'delta') {
        stream.set(m.itemId, (stream.get(m.itemId) || '') + m.text);
    }
    if (m.type === 'activity')
        activity = m.text;
    if (m.type === 'error') {
        error = m.text;
        activity = '';
    }
    if (m.type === 'done') {
        data.running = false;
        approvals = [];
        if (m.error)
            error = m.error;
    }
    if (m.type === 'approval') {
        approvals.push(m);
    }
    if (m.type === 'context')
        contextInfo = m;
    if (m.type === 'models') {
        models = m.models;
        activity = `Loaded ${models.length} catalog models. Access is verified by a successful turn.`;
    }
    if (m.type === 'proposal') {
        data.proposals.push(m.proposal);
        activity = `Proposed edit: ${m.proposal.path}. Open Code review to inspect it.`;
    }
    if (m.type === 'graph') {
        graphData = m.graph;
        graphKind = m.kind;
    }
    if (m.type === 'pluginReport')
        pluginReport = m.text;
    if (m.type === 'memory')
        memoryReport = m.text;
    render();
});
render();
post({ type: 'ready' });
