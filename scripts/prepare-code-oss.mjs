import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('.');
const upstream = JSON.parse(await readFile('desktop/upstream.json', 'utf8'));
const folder = path.join(root, '.upstream/vscode');
await mkdir(path.dirname(folder), { recursive: true });
try {
    await access(folder);
}
catch {
    execFileSync('git', ['clone', '--depth', '1', '--branch', upstream.ref, upstream.repository, folder], { stdio: 'inherit' });
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: folder, encoding: 'utf8' }).trim();
if (head !== upstream.commit)
    throw new Error('Unexpected upstream revision. Inspect .upstream/vscode; no changes were applied.');
const product = JSON.parse(await readFile(path.join(folder, 'product.json'), 'utf8'));
const overrides = JSON.parse(await readFile('desktop/product.overrides.json', 'utf8'));
await writeFile(path.join(folder, 'product.json'), JSON.stringify({ ...product, ...overrides }, null, 2) + '\n');
await access('apps/workbench/dist/extension.cjs');
await cp('apps/workbench', path.join(folder, 'extensions/codech-workbench'), { recursive: true, filter: src => !src.includes('node_modules') });
console.log('Prepared pinned Code-OSS source and built-in Codech workbench at ' + folder + '\nThis does not compile or package the desktop application. Follow docs/DESKTOP.md for platform prerequisites and the upstream build.');
