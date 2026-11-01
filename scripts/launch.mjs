import { spawn } from 'node:child_process';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const root = path.resolve('.');
await mkdir('.runtime', { recursive: true });
const args = ['--new-window', '--user-data-dir', path.join(root, '.runtime/user-data'), '--extensions-dir', path.join(root, '.runtime/extensions'), '--extensionDevelopmentPath=' + path.join(root, 'apps/workbench'), path.join(root, 'examples/starter')];
let executable = process.env.CODECH_CODE_BINARY;
if (!executable && process.platform === 'win32')
    executable = path.join(process.env.LOCALAPPDATA, 'Programs/Microsoft VS Code/Code.exe');
if (!executable)
    executable = 'code';
const child = spawn(executable, args, { stdio: 'ignore', detached: true, windowsHide: true, shell: false });
child.on('error', error => { console.error('Could not launch a VS Code / Code-OSS host:', error.message, '\nSet CODECH_CODE_BINARY to the full executable path.'); process.exitCode = 1; });
child.unref();
