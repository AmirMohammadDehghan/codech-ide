import path from 'node:path';
import { access, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { download, root } from './download-runtime.mjs';
if (process.platform !== 'win32') throw new Error('Inno Setup requires Windows.');
const folder = path.join(root, '.cache/inno');
const compiler = path.join(folder, 'ISCC.exe');
try { await access(compiler); console.log(compiler); }
catch {
  const installer = await download('inno');
  await mkdir(folder, { recursive: true });
  execFileSync(installer, ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/CURRENTUSER', `/DIR=${folder}`, '/NOICONS'], { windowsHide: true, stdio: 'inherit' });
  await access(compiler);
  console.log(compiler);
}
