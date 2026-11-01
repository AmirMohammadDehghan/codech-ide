import * as fs from 'node:fs/promises';
import path from 'node:path';
import extractZip from 'extract-zip';
import * as ResEdit from 'resedit';
import sharp from 'sharp';
import { download, lock, root } from './download-runtime.mjs';

if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This packaging target requires Windows x64.');
const output = path.join(root, 'release/Codech IDE');
const cached = path.join(root, '.cache/vscodium');
const json = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const writeJson = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2) + '\n');
const version = (await json(path.join(root, 'package.json'))).version;
const extract = (archive, dest) => extractZip(archive, { dir: dest });
// Verify even cached archives. Re-extract the pristine runtime so stale modifications never propagate.
const archive = await download('vscodium');
await fs.mkdir(cached, { recursive: true });
await extract(archive, cached);
// Replace only the fixed generated app. Never overwrite portable user data.
if (await fs.stat(path.join(output, 'data')).catch(() => undefined)) throw new Error('Move portable user data out of the build output before rebuilding.');
if (path.dirname(output) !== path.join(root, 'release')) throw new Error('Invalid output directory');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
await fs.cp(cached, output, { recursive: true, force: true });
const app = path.join(output, 'resources/app');
const product = await json(path.join(app, 'product.json'));
const provenance = { codech: version, runtime: lock.vscodium, upstreamRuntimeVersion: product.version, upstreamCommit: product.commit, codex: lock.codex, packaging: 'Official verified VSCodium binary plus Codech metadata, icons and built-in workbench. Not a new Code-OSS source compilation.' };
Object.assign(product, await json(path.join(root, 'desktop/product.overrides.json')), {
  sharedDataFolderName: '.codech-ide-shared', serverApplicationName: 'codech-server', serverDataFolderName: '.codech-server',
  win32ShellNameShort: 'Codech IDE', win32x64AppId: '{{35A3EC14-66AA-44A2-A9DC-EF63D07FC1D2}', win32x64UserAppId: '{{A9AB61D4-504D-4383-9BBE-279CE453BEA1}',
  win32TunnelServiceMutex: 'codech-tunnelservice', win32TunnelMutex: 'codech-tunnel', tunnelApplicationName: 'codech-tunnel',
  codechVersion: version, downloadUrl: 'https://github.com/AmirMohammadDehghan/codech-ide/releases',
  documentationUrl: 'https://github.com/AmirMohammadDehghan/codech-ide#readme', releaseNotesUrl: 'https://github.com/AmirMohammadDehghan/codech-ide/releases'
});
// An upstream automatic update would overwrite our distribution. Updates are manual Codech installers.
delete product.updateUrl;
delete product.win32arm64AppId;
delete product.win32arm64UserAppId;
await writeJson(path.join(app, 'product.json'), product);
const pkg = await json(path.join(app, 'package.json'));
pkg.name = 'codech-ide'; pkg.author = { name: 'Codech contributors' };
// Preserve the runtime version: VS Code extensions use it for API compatibility checks.
await writeJson(path.join(app, 'package.json'), pkg);
const extensionDir = path.join(app, 'extensions/codech-workbench');
await fs.mkdir(extensionDir, { recursive: true });
for (const name of ['package.json', 'dist', 'media', 'themes']) await fs.cp(path.join(root, 'apps/workbench', name), path.join(extensionDir, name), { recursive: true, force: true });
await fs.copyFile(path.join(root, 'LICENSE'), path.join(extensionDir, 'LICENSE'));
const defaults = path.join(app, 'extensions/codech-defaults');
await fs.mkdir(defaults, { recursive: true });
await writeJson(path.join(defaults, 'package.json'), { name: 'codech-defaults', publisher: 'codech', version, engines: { vscode: '^1.95.0' }, contributes: { configurationDefaults: {
  'workbench.colorTheme': 'Codech Graphite', 'workbench.startupEditor': 'none', 'editor.minimap.enabled': false,
  'workbench.tips.enabled': false, 'workbench.secondarySideBar.defaultVisibility': 'hidden'
} } });
const tools = path.join(app, 'tools/codex');
await fs.mkdir(tools, { recursive: true });
for (const key of ['codex']) {
  const zip = await download(key);
  const dest = path.join(root, '.cache', key);
  await fs.mkdir(dest, { recursive: true });
  await extract(zip, dest);
  await fs.cp(dest, tools, { recursive: true, force: true });
  await fs.rename(path.join(tools, 'codex-x86_64-pc-windows-msvc.exe'), path.join(tools, 'codex.exe'));
  const codexPackage = await json(path.join(tools, 'codex-package.json'));
  codexPackage.entrypoint = 'codex.exe';
  await writeJson(path.join(tools, 'codex-package.json'), codexPackage);
}
for (const [repo, ref, file, dest] of [['openai/codex', 'rust-v0.166.0', 'LICENSE', 'CODEX-LICENSE'], ['openai/codex', 'rust-v0.166.0', 'NOTICE', 'CODEX-NOTICE'], ['VSCodium/vscodium', '1.143.17232', 'LICENSE', 'VSCODIUM-LICENSE']]) {
  const response = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${file}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Required notice missing: ${repo}/${file}`);
  await fs.writeFile(path.join(output, dest), await response.text());
}
await fs.copyFile(path.join(root, 'LICENSE'), path.join(output, 'CODECH-LICENSE'));
await writeJson(path.join(output, 'CODECH-PROVENANCE.json'), provenance);
await fs.writeFile(path.join(output, 'README-CODECH.txt'), `Codech IDE ${version}\r\nStandalone Windows x64 application. Run Codech.exe.\r\nExtensions: Open VSX or compatible VSIX. Theme: Ctrl+K Ctrl+T.\r\nUser data: %APPDATA%\\Codech IDE. Extensions: %USERPROFILE%\\.codech-ide\\extensions.\r\nOptional portable mode: create an empty data directory next to Codech.exe.\r\nBundled Codex starts only on demand. Sign in with ChatGPT inside Codech or set an API key.\r\nUpdates: https://github.com/AmirMohammadDehghan/codech-ide/releases\r\nObsidian plugin execution is not implemented; Markdown vaults and wikilinks are supported.\r\nCodech binaries are currently unsigned. Upstream license/notices are preserved.\r\n`);
const svg = await fs.readFile(path.join(root, 'branding/codech-ide-app.svg'));
const mark = await fs.readFile(path.join(root, 'apps/workbench/media/logo.svg'), 'utf8');
const neutralMark = mark.replaceAll('#d4b65e', '#a7b8ff').replaceAll('#69b89b', '#e0e1e6');
await fs.writeFile(path.join(app, 'out/media/code-icon.svg'), neutralMark);
for (const mode of ['light', 'dark', 'hcLight', 'hcDark']) {
  const color = mode === 'light' || mode === 'hcLight' ? '#d0d2db' : '#373941';
  await fs.writeFile(path.join(app, `out/media/letterpress-${mode}.svg`), neutralMark.replaceAll('#a7b8ff', color).replaceAll('#e0e1e6', color));
}
const icon = new ResEdit.Data.IconFile();
for (const size of [16, 24, 32, 48, 64, 128, 256]) icon.icons.push({ data: new ResEdit.Data.RawIconItem(await sharp(svg).resize(size, size).png().toBuffer(), size, size, 32) });
const ico = Buffer.from(icon.generate());
await fs.writeFile(path.join(root, 'branding/codech.ico'), ico);
await fs.writeFile(path.join(app, 'resources/win32/code.ico'), ico);
for (const size of [70, 150]) await sharp(svg).resize(size, size).png().toFile(path.join(app, `resources/win32/code_${size}x${size}.png`));
await sharp(svg).resize(256, 256).png().toFile(path.join(root, 'apps/workbench/media/icon.png'));
await fs.copyFile(path.join(root, 'apps/workbench/media/icon.png'), path.join(extensionDir, 'media/icon.png'));
await sharp(svg).png().toFile(path.join(root, 'branding/codech-ide-app.png'));
const executable = ResEdit.NtExecutable.from(await fs.readFile(path.join(output, 'VSCodium.exe')), { ignoreCert: true });
const resources = ResEdit.NtExecutableResource.from(executable);
for (const group of ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries)) ResEdit.Resource.IconGroupEntry.replaceIconsForResource(resources.entries, group.id, group.lang, icon.icons.map(i => i.data));
for (const info of ResEdit.Resource.VersionInfo.fromEntries(resources.entries)) {
  info.setFileVersion(...version.split('.').map(Number), 0, 1033);
  info.setProductVersion(...version.split('.').map(Number), 0, 1033);
  info.setStringValues({ lang: 1033, codepage: 1200 }, { FileDescription: 'Codech IDE', ProductName: 'Codech IDE', CompanyName: 'Codech contributors', InternalName: 'Codech', OriginalFilename: 'Codech.exe' });
  info.outputToResourceEntries(resources.entries);
}
resources.outputResource(executable);
await fs.writeFile(path.join(output, 'Codech.exe'), Buffer.from(executable.generate()));
await fs.rm(path.join(output, 'VSCodium.exe'));
const manifest = await fs.readFile(path.join(output, 'VSCodium.VisualElementsManifest.xml'), 'utf8');
await fs.writeFile(path.join(output, 'Codech.VisualElementsManifest.xml'), manifest);
await fs.rm(path.join(output, 'VSCodium.VisualElementsManifest.xml'));
const cmd = await fs.readFile(path.join(output, 'bin/codium.cmd'), 'utf8');
await fs.writeFile(path.join(output, 'bin/codech.cmd'), cmd.replaceAll('VSCodium.exe', 'Codech.exe'));
await fs.rm(path.join(output, 'bin/codium.cmd'));
const shell = await fs.readFile(path.join(output, 'bin/codium'), 'utf8');
await fs.writeFile(path.join(output, 'bin/codech'), shell.replaceAll('VSCodium.exe', 'Codech.exe').replaceAll('VSCodium', 'Codech IDE').replaceAll('codium', 'codech'));
await fs.rm(path.join(output, 'bin/codium'));
console.log(`Standalone application ready: ${output}`);
