import * as vscode from 'vscode';
import * as path from 'node:path';
import { Workspace } from './core/workspace';
import { inferredSymbol, targetExcerpt, Target } from './core/target';
export interface Source { id: string; label: string; root: string }
export interface DiffSource { root: string; path: string; side: 'original' | 'modified' }

export class EditorContext implements vscode.Disposable {
    private last?: vscode.TextEditor;
    private timer?: NodeJS.Timeout;
    private generation = 0;
    private disposables: vscode.Disposable[];
    target?: Target;
    readonly diffs = new Map<string, DiffSource>();
    constructor(private sources: () => Source[], private changed: (target?: Target) => void) {
        const track = (editor?: vscode.TextEditor) => {
            if (editor) this.last = editor;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => void this.capture().then(t => this.changed(t)), 160);
        };
        this.last = vscode.window.activeTextEditor;
        this.disposables = [vscode.window.onDidChangeActiveTextEditor(track), vscode.window.onDidChangeTextEditorSelection(e => track(e.textEditor)), vscode.workspace.onDidChangeTextDocument(e => { if (e.document === this.last?.document) track(this.last); })];
    }
    async capture(): Promise<Target | undefined> {
        const generation = ++this.generation;
        const editor = this.last;
        const save = (target?: Target) => { if (generation === this.generation) this.target = target; return target; };
        if (!editor || editor.document.isClosed || !vscode.workspace.isTrusted) return save();
        const doc = editor.document;
        const diff = this.diffs.get(doc.uri.toString());
        let file = diff ? path.join(diff.root, diff.path) : doc.uri.fsPath;
        let side = diff?.side;
        if (!diff && !['file', 'git', 'untitled'].includes(doc.uri.scheme)) return save();
        if (doc.uri.scheme === 'untitled' && !path.isAbsolute(file)) return save();
        for (const group of vscode.window.tabGroups.all) {
            const input = group.activeTab?.input;
            if (input instanceof vscode.TabInputTextDiff) {
                if (input.original.toString() === doc.uri.toString()) side = 'original';
                if (input.modified.toString() === doc.uri.toString()) side = 'modified';
            }
        }
        const source = this.sources().find(s => { const relative = path.relative(s.root, file); return relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative); });
        if (!source) return save();
        const relative = path.relative(source.root, file).split(path.sep).join('/');
        try { await new Workspace(source.root).safe(relative, !!diff || doc.isDirty); } catch { return save(); }
        const text = doc.getText();
        if (text.length > 400000 || text.includes('\0')) return save();
        const position = editor.selection.active;
        const version = doc.version;
        let symbol: Target['symbol'];
        const symbols = await Promise.race([
            vscode.commands.executeCommand<(vscode.DocumentSymbol | vscode.SymbolInformation)[]>('vscode.executeDocumentSymbolProvider', doc.uri).then(x => x || [], () => []),
            new Promise<never[]>(resolve => { const timer = setTimeout(() => resolve([]), 500); timer.unref(); })
        ]);
        const visit = (items: (vscode.DocumentSymbol | vscode.SymbolInformation)[]) => { for (const item of items) {
            const range = 'range' in item ? item.range : item.location.range;
            if (range.contains(position)) { symbol = { name: item.name, start: range.start.line + 1, end: range.end.line + 1 }; if ('children' in item) visit(item.children); }
        } };
        visit(symbols);
        if (doc.version !== version || editor.selection.active.compareTo(position) !== 0) return this.capture();
        symbol ||= inferredSymbol(text, doc.languageId, position.line + 1);
        let remaining = 2000;
        const selections = editor.selections.filter(s => !s.isEmpty).slice(0, 4).map(s => { const selected = doc.getText(s).slice(0, remaining); remaining -= selected.length; return { start: s.start.line + 1, end: s.end.line + 1, text: selected }; });
        return save({ source: source.id, path: relative, language: doc.languageId, version, dirty: doc.isDirty, line: position.line + 1, column: position.character + 1, side, selections, symbol, ...targetExcerpt(text, position.line + 1, symbol) });
    }
    dispose() { clearTimeout(this.timer); for (const disposable of this.disposables) disposable.dispose(); }
}
