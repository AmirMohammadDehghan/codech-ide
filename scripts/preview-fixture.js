/* Explicitly a UI fixture: no file access, no inference, no account access. */
const root = 'D:/projects/codech-studio';
const notes = [{ path: '.codech/knowledge/Architecture.md', title: 'Architecture', text: '# Architecture\n\nA modular Django backend and a focused React frontend. Keep contracts explicit.\n\n[[Engineering conventions]]', links: ['Engineering conventions'] }, { path: '.codech/knowledge/Engineering conventions.md', title: 'Engineering conventions', text: '# Engineering conventions\n\nSmall changes. Useful tests. Decisions saved close to the code.\n\n[[Architecture]]', links: ['Architecture'] }, { path: '.codech/knowledge/Release checklist.md', title: 'Release checklist', text: '# Release checklist\n\nReview the changes, run the checks, then ship with confidence.', links: [] }];
const state = { type: 'state', tab: 'chat', root, trusted: true, running: false, files: ['src/app.ts', 'src/auth.ts', 'src/session.ts', 'tests/auth.test.ts', 'README.md', 'package.json'], notes, changes: [{ path: 'src/auth.ts', status: 'M', revision: '7629b2e71b129', approved: false }, { path: 'tests/auth.test.ts', status: 'M', revision: 'b2a83e108cb19', approved: false }], worktrees: [{ worktree: root, branch: 'refs/heads/main', HEAD: '9b7ea30299c4' }, { worktree: 'D:/projects/codech-auth', branch: 'refs/heads/feature/auth', HEAD: '9b7ea30299c4' }], sessions: [{ id: 'welcome', title: 'New conversation', root, model: 'gpt-6.1-terra', provider: 'codex', tokens: 0 }, { id: 'auth', title: 'Build the authentication flow', root, model: 'gpt-6.1-terra', provider: 'codex', tokens: 0 }, { id: 'architecture', title: 'Explore the project architecture', root, model: 'gpt-6.1-sol', provider: 'codex', tokens: 0 }], session: { id: 'welcome', title: 'New conversation', root, provider: 'codex', model: 'gpt-6.1-terra', messages: [] }, proposals: [] };
function emit(m) { window.postMessage(structuredClone(m), '*'); }
window.addEventListener('codech-preview', e => {
    const m = e.detail;
    if (m.type === 'appearance') { const themes = ['dark', 'light', 'forest']; document.body.dataset.theme = themes[(themes.indexOf(document.body.dataset.theme || 'dark') + 1) % themes.length]; return; }
    if (m.type === 'navigate') {
        state.tab = m.tab;
        emit(state);
    }
    else if (m.type === 'ready' || m.type === 'refresh')
        emit(state);
    else if (m.type === 'approve') {
        const c = state.changes.find(c => c.path === m.path);
        if (c)
            c.approved = true;
        emit(state);
    }
    else if (m.type === 'newChat') {
        state.session = { ...state.sessions[0], messages: [] };
        state.tab = 'chat';
        emit(state);
    }
    else if (m.type === 'selectSession') {
        state.session = { ...state.sessions.find(s => s.id === m.id), messages: [] };
        state.tab = 'chat';
        emit(state);
    }
    else if (m.type === 'send') {
        state.session.messages.push({ role: 'user', text: m.text }, { role: 'assistant', text: 'This is the interactive design preview. In the installed workbench, this action connects to Codex App Server or the OpenAI API. No model request was made here.' });
        emit(state);
    }
    else if (m.type === 'graph') {
        emit({ type: 'graph', kind: m.kind, graph: m.kind === 'knowledge' ? { nodes: notes.map(n => ({ id: n.title, label: n.title, path: n.path })), edges: [{ source: 'Architecture', target: 'Engineering conventions' }, { source: 'Engineering conventions', target: 'Architecture' }], method: 'UI fixture: Markdown wikilinks.' } : { nodes: state.files.slice(0, 4).map(f => ({ id: f, label: f.split('/').pop() })), edges: [{ source: 'src/app.ts', target: 'src/auth.ts' }, { source: 'src/auth.ts', target: 'src/session.ts' }, { source: 'tests/auth.test.ts', target: 'src/auth.ts' }], method: 'UI fixture: static import graph.' } });
    }
    else
        emit({ type: 'activity', text: 'Preview only: “' + m.type + '” is handled by the native extension in the installed workbench.' });
});
