import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// Fixed generated directory inside this repository, never derived from user input.
const generated = fileURLToPath(new URL('../apps/workbench/dist', import.meta.url));
await rm(generated, { recursive: true, force: true });
await mkdir('apps/workbench/dist', { recursive: true });
await Promise.all([
    ...['target', 'project-graph', 'audio', 'codex-protocol'].map(name => build({entryPoints: ['apps/workbench/src/core/'+name+'.ts'], bundle:true, platform:'node', target:'node20', format:'cjs', outfile:'apps/workbench/dist/'+name+'.cjs'})),
    build({entryPoints:['apps/workbench/src/browser.ts'],bundle:true,platform:'node',target:'node20',format:'cjs',outfile:'apps/workbench/dist/browser.cjs',external:['vscode']}),
    build({entryPoints:['apps/workbench/src/voice.ts'],bundle:true,platform:'node',target:'node20',format:'cjs',outfile:'apps/workbench/dist/voice.cjs',external:['vscode']}),
    build({entryPoints:['apps/workbench/src/dock.ts'],bundle:true,platform:'browser',target:'es2022',outfile:'apps/workbench/dist/dock.js'}),
    build({ entryPoints: ['apps/workbench/src/core/context.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/context.cjs' }),
    build({ entryPoints: ['apps/workbench/src/extension.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/extension.cjs', external: ['vscode'], sourcemap: true }),
    build({ entryPoints: ['apps/workbench/src/ui.ts'], bundle: true, platform: 'browser', target: 'es2022', outfile: 'apps/workbench/dist/ui.js', sourcemap: true }),
    build({ entryPoints: ['apps/workbench/src/core/workspace.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/core.cjs' }),
    build({ entryPoints: ['apps/workbench/src/core/codex.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/codex.cjs' }),
    build({ entryPoints: ['apps/workbench/src/core/api.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/api.cjs' }),
    build({ entryPoints: ['apps/workbench/src/core/graphiti.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: 'apps/workbench/dist/graphiti.cjs' })
]);
await copyFile('apps/workbench/src/ui.css', 'apps/workbench/dist/ui.css');
await copyFile('LICENSE', 'apps/workbench/LICENSE');
console.log('Codech workbench built.');

await copyFile('apps/workbench/src/dock.css','apps/workbench/dist/dock.css');
await copyFile('apps/workbench/src/record.ps1','apps/workbench/dist/record.ps1');
