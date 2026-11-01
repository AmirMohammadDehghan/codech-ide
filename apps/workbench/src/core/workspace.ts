import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import * as os from 'node:os';
export const digest = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
export async function command(exe: string, args: string[], cwd: string, timeout = 20000, env?: NodeJS.ProcessEnv): Promise<string> {
    return new Promise((resolve, reject) => execFile(exe, args, { cwd, timeout, maxBuffer: 4 * 1024 * 1024, windowsHide: true, encoding: 'utf8', env: env || process.env }, (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout)));
}
export interface Change {
    path: string;
    status: string;
    before: string;
    after: string;
    revision: string;
    approved: boolean;
}
export interface Note {
    path: string;
    title: string;
    text: string;
    links: string[];
}
const ignored = new Set(['.git', 'node_modules', '.runtime', '.cache', '.upstream', 'release', '.venv', 'venv', 'dist', 'build', '__pycache__', '.next', '.obsidian']);
const sensitive = /(^|\/)(\.env(?:\..*)?|auth\.json|credentials(?:\..*)?|id_rsa|id_ed25519|.*\.(?:pem|key|p12))$/i;
export class Workspace {
    approvals = new Map<string, string>();
    constructor(public root: string) { this.root = path.resolve(root); }
    async safe(relative: string, allowNew = false): Promise<string> {
        if (typeof relative !== 'string' || !relative || relative.includes('\0') || path.isAbsolute(relative) || relative.includes('\\'))
            throw new Error('Use a workspace-relative path with forward slashes.');
        const normalized = path.posix.normalize(relative);
        if (normalized === '..' || normalized.startsWith('../') || normalized.split('/').some(x => x === '.git') || sensitive.test(normalized))
            throw new Error('Path is outside the allowed workspace or contains credentials.');
        const resolved = path.resolve(this.root, normalized);
        const base = await fs.realpath(this.root);
        let real: string;
        try {
            real = await fs.realpath(resolved);
        }
        catch (e) {
            if (!allowNew || (e as NodeJS.ErrnoException).code !== 'ENOENT')
                throw e;
            real = path.join(await fs.realpath(path.dirname(resolved)), path.basename(resolved));
        }
        const rel = path.relative(base, real);
        if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel))
            throw new Error('Symlinks cannot escape the workspace.');
        return real;
    }
    async read(relative: string) { const file = await this.safe(relative); const stat = await fs.stat(file); if (!stat.isFile() || stat.size > 400000)
        throw new Error('Only text files under 400 KB can be read.'); const data = await fs.readFile(file, 'utf8'); if (data.includes('\0'))
        throw new Error('Binary file.'); return data; }
    async files(max = 2500) {
        try {
            const listed = (await this.git(['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.'])).split('\0');
            const allowed = [...new Set(listed)].filter(p => p && !sensitive.test(p) && !p.split('/').some(x => ignored.has(x)));
            const result: string[] = [];
            for (const p of allowed) {
                if (result.length >= max) break;
                try { const stat = await fs.lstat(await this.safe(p)); if (stat.isFile()) result.push(p); } catch { }
            }
            return result.sort();
        } catch { /* A plain vault does not have to be a Git repository. */ }
        const files: string[] = [];
        const walk = async (dir: string) => { for (const entry of await fs.readdir(path.join(this.root, dir), { withFileTypes: true })) {
            if (files.length >= max)
                return;
            const rel = path.posix.join(dir, entry.name);
            if (sensitive.test(rel) || ignored.has(entry.name) || entry.isSymbolicLink())
                continue;
            if (entry.isDirectory())
                await walk(rel);
            else if (entry.isFile())
                files.push(rel);
        } };
        await walk('');
        return files;
    }
    git(args: string[]) { return command('git', args, this.root); }
    async notes(): Promise<Note[]> {
        const files = (await this.files()).filter(x => x.startsWith('.codech/knowledge/') && x.endsWith('.md'));
        return Promise.all(files.map(async (p) => { const text = await this.read(p); return { path: p, title: text.match(/^#\s+(.+)$/m)?.[1] || path.basename(p, '.md'), text, links: [...text.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)].map(m => m[1]) }; }));
    }
    async saveNote(title: string, text: string) {
        if (!title.trim() || title.length > 90 || /[\\/:*?"<>|\x00-\x1f]/.test(title) || /^\.+$/.test(title))
            throw new Error('Choose a short note title without path separators.');
        const codech = await this.safe('.codech', true);
        await fs.mkdir(codech, { recursive: true });
        const dir = await this.safe('.codech/knowledge', true);
        await fs.mkdir(dir, { recursive: true });
        const target = await this.safe(`.codech/knowledge/${title}.md`, true);
        await fs.writeFile(target, text, { encoding: 'utf8', flag: 'wx' });
        return `.codech/knowledge/${title}.md`;
    }
    async context(query: string, budget = 12000) {
        const words = query.toLocaleLowerCase().split(/[^\p{L}\p{N}_]+/u).filter(x => x.length > 2);
        const files = await this.files();
        const candidates = files.filter(x => /AGENTS\.md$|README\.md$|package\.json$|pyproject\.toml$|\.codech\/knowledge\/.*\.md$/i.test(x));
        const rank = (p: string) => words.reduce((n, w) => n + (p.toLowerCase().includes(w) ? 10 : 0), /AGENTS\.md$/.test(p) ? 100 : /README\.md$/.test(p) ? 30 : 0);
        candidates.sort((a, b) => rank(b) - rank(a) || a.localeCompare(b));
        const map = ('Workspace map (bounded; request more files with tools):\n' + files.slice(0, 160).join('\n') + '\n').slice(0, Math.floor(budget / 4));
        const blocks: Record<string, string> = { '@map': map };
        let text = map;
        const sources: string[] = [];
        for (const p of candidates.slice(0, 14)) {
            if (text.length >= budget)
                break;
            try {
                const content = await this.read(p);
                const header = `\n<workspace-data path=${JSON.stringify(p)}>\n`;
                const footer = '\n</workspace-data>\n';
                const available = budget - text.length - header.length - footer.length - 40;
                if (available <= 0) break;
                const excerpt = content.slice(0, Math.min(4000, available));
                const block = header + excerpt + (excerpt.length < content.length ? '\n[Excerpt; read file for remaining text.]' : '') + footer;
                text += block;
                blocks[p] = block;
                sources.push(p);
            }
            catch { }
        }
        return { text, chars: text.length, sources, fingerprint: digest(text), blocks };
    }
    async changes(): Promise<Change[]> {
        const prefix = (await this.git(['rev-parse', '--show-prefix'])).trim();
        const status = (await this.git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.'])).split('\0');
        const results: Change[] = [];
        for (let i = 0; i < status.length; i++) {
            const entry = status[i];
            if (!entry)
                continue;
            const state = entry.slice(0, 2);
            const repoPath = entry.slice(3);
            const relative = prefix && repoPath.startsWith(prefix) ? repoPath.slice(prefix.length) : repoPath;
            if (/[RC]/.test(state)) {
                i++;
                continue;
            } // Rename pairs are shown by native SCM until review supports them.
            if (sensitive.test(relative) || relative.startsWith('.codech/local/'))
                continue;
            let before = '';
            let after = '';
            try {
                before = await this.git(['show', `HEAD:${prefix}${relative}`]);
            }
            catch { }
            try {
                after = await this.read(relative);
            }
            catch (e) {
                if (!state.includes('D'))
                    continue;
            }
            if (before.includes('\0') || after.includes('\0'))
                continue;
            const revision = digest(relative + '\0' + before + '\0' + after);
            results.push({ path: relative, status: state.trim(), before, after, revision, approved: this.approvals.get(relative) === revision });
        }
        return results;
    }
    async approve(relative: string, revision: string) { const current = (await this.changes()).find(x => x.path === relative); if (!current || current.revision !== revision)
        throw new Error('The file changed. Refresh and review its new contents.'); this.approvals.set(relative, revision); }
    async commitApproved(message: string) {
        if (!message.trim() || message.length > 2000)
            throw new Error('A commit message is required.');
        const changes = await this.changes();
        if (!changes.length || changes.some(c => !c.approved))
            throw new Error('Review and approve all visible changes first.');
        const paths = changes.map(c => c.path);
        const prefix = (await this.git(['rev-parse', '--show-prefix'])).trim();
        const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'codech-review-'));
        const env = { ...process.env, GIT_INDEX_FILE: path.join(temp, 'index') };
        const git = (args: string[]) => command('git', args, this.root, 20000, env);
        try {
            await git(['read-tree', 'HEAD']);
            await git(['add', '--', ...paths]);
            for (const c of changes) {
                let staged = '';
                try {
                    staged = await git(['show', `:${prefix}${c.path}`]);
                }
                catch (e) {
                    if (!c.status.includes('D'))
                        throw e;
                }
                if (staged !== c.after && staged !== c.after.replace(/\r\n/g, '\n'))
                    throw new Error('Staged contents changed after review. Nothing was committed.');
            }
            await git(['commit', '-m', message]);
            await this.git(['reset', '-q', 'HEAD', '--', ...paths]);
            this.approvals.clear();
            return this.git(['rev-parse', '--short', 'HEAD']);
        }
        finally {
            await fs.rm(temp, { recursive: true, force: true });
        }
    }
    async worktrees() { const raw = await this.git(['worktree', 'list', '--porcelain']); return raw.trim().split(/\r?\n\r?\n/).filter(Boolean).map(block => { const entry = Object.fromEntries(block.split(/\r?\n/).map(line => { const i = line.indexOf(' '); return i < 0 ? [line, true] : [line.slice(0, i), line.slice(i + 1)]; })); entry.worktree = path.resolve(entry.worktree); return entry; }); }
    async createWorktree(branch: string, storage: string) {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,70}$/.test(branch) || branch.includes('..') || branch.endsWith('/'))
            throw new Error('Use a simple new branch name.');
        await this.git(['check-ref-format', '--branch', branch]);
        await fs.mkdir(storage, { recursive: true });
        const folder = path.join(storage, digest(this.root).slice(0, 10) + '-' + branch.replaceAll('/', '-'));
        await this.git(['worktree', 'add', '-b', branch, folder, 'HEAD']);
        return folder;
    }
    async codeGraph() {
        const files = (await this.files()).filter(x => /\.(tsx?|jsx?|py)$/.test(x)).slice(0, 200);
        const nodes = files.map(id => ({ id, label: path.basename(id), kind: 'code' }));
        const edges: {
            source: string;
            target: string;
        }[] = [];
        for (const file of files) {
            let text = '';
            try {
                text = await this.read(file);
            }
            catch {
                continue;
            }
            for (const m of text.matchAll(/(?:from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|from\s+([\w.]+)\s+import)/g)) {
                const ref = m[1] || m[2] || m[3];
                if (ref.startsWith('.')) {
                    const stem = path.posix.normalize(path.posix.join(path.posix.dirname(file), ref));
                    const target = files.find(p => p === stem || ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '.py'].some(ext => p === stem + ext));
                    if (target)
                        edges.push({ source: file, target });
                }
                else if (file.endsWith('.py')) {
                    const target = files.find(p => p === ref.replaceAll('.', '/') + '.py');
                    if (target)
                        edges.push({ source: file, target });
                }
            }
        }
        return { nodes, edges, method: 'Static import scan (bounded to 200 source files; not a semantic language server graph).' };
    }
}
