import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './download-runtime.mjs';
const compiler = process.env.ISCC_PATH || path.join(root, '.cache/inno/ISCC.exe');
const version = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).version;
await fs.access(path.join(root, 'release/Codech IDE/Codech.exe'));
execFileSync(compiler, ['/Qp', `/DAppVersion=${version}`, path.join(root, 'desktop/codech.iss')], { windowsHide: true, stdio: 'inherit' });
