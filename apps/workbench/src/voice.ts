import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { spawn, ChildProcess } from 'node:child_process';
import { tmpdir } from 'node:os';
import { command } from './core/workspace';
import { hasAudibleAudio } from './core/audio';
export const voiceAssets = {
    runtime: { url: 'https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip', sha256: '6ba69e3482d7826214f90a6a9c84ca07782aec1e1d0c6a7c30c994fd5d816ccb' },
    model: { url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin?download=true', sha256: 'ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb' }
};
async function hash(file: string) { const h = createHash('sha256'); for await (const data of createReadStream(file)) h.update(data); return h.digest('hex'); }
export async function downloadVoice(file: string, asset: { url: string; sha256: string }, signal?: AbortSignal) {
    if (await hash(file).catch(() => '') === asset.sha256) return;
    const part = file + '.part';
    try {
        const timeout = AbortSignal.timeout(900000); const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
        if (process.platform === 'win32') {
            await new Promise<void>((resolve, reject) => { const child = spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/curl.exe'), ['--location', '--fail', '--silent', '--show-error', '--retry', '2', '--max-time', '900', '--output', part, asset.url], { windowsHide: true, shell: false, stdio: ['ignore', 'ignore', 'pipe'], signal: combined }); let error = ''; child.stderr?.on('data', d => { error = (error + d.toString()).slice(-1000); }); child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(error || `Voice download exited ${code}.`))); });
        } else { const response = await fetch(asset.url, { signal: combined }); if (!response.ok || !response.body) throw new Error(`Voice download failed (${response.status}).`); await pipeline(response.body as any, createWriteStream(part), { signal: combined }); }
        if (await hash(part) !== asset.sha256) throw new Error('Voice asset checksum mismatch.'); await fs.rename(part, file);
    }
    finally { await fs.rm(part, { force: true }).catch(() => {}); }
}
export class OfflineVoice implements vscode.Disposable {
    private dir?: string; private child?: ChildProcess; private abort?: AbortController; private cancelled = false;
    status = 'idle';
    constructor(private storage: string, private script: string, private changed: (m: any) => void) {}
    private emit(status: string, extra: any = {}) { this.status = status; this.changed({ type: 'voice', status, ...extra }); }
    async setup() {
        if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('The built-in recorder currently supports Windows x64.');
        const dir = path.join(this.storage, 'voice'); await fs.mkdir(dir, { recursive: true });
        const model = path.join(dir, 'ggml-small-q5_1.bin');
        const runtime = path.join(dir, 'whisper-bin-x64.zip');
        const marker = path.join(dir, 'verified.json');
        let ready: { executable: string; model: string } | undefined;
        try { ready = JSON.parse(await fs.readFile(marker, 'utf8')); if (ready) { await fs.access(ready.executable); await fs.access(ready.model); return ready; } } catch { }
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Offline Persian voice · downloading verified Whisper runtime + model (~199 MB)', cancellable: true }, async (_, token) => {
            const abort = this.abort = new AbortController(); token.onCancellationRequested(() => abort.abort());
            await downloadVoice(runtime, voiceAssets.runtime, abort.signal);
            await downloadVoice(model, voiceAssets.model, abort.signal);
            // Fixed, verified archive; native extraction without executing interpolated paths.
            await command('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Add-Type -AssemblyName System.IO.Compression.FileSystem; $dest = [IO.Path]::GetFullPath($env:CODECH_VOICE_DEST) + [IO.Path]::DirectorySeparatorChar; $zip = [IO.Compression.ZipFile]::OpenRead($env:CODECH_VOICE_ZIP); try { foreach ($entry in $zip.Entries) { $target = [IO.Path]::GetFullPath([IO.Path]::Combine($dest, $entry.FullName)); if (-not $target.StartsWith($dest, [StringComparison]::OrdinalIgnoreCase)) { throw "Invalid archive path" }; if ($entry.Name) { [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null; [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true) } } } finally { $zip.Dispose() }'], dir, 60000, { ...process.env, CODECH_VOICE_ZIP: runtime, CODECH_VOICE_DEST: path.join(dir, 'runtime') });
        });
        const find = async (folder: string): Promise<string | undefined> => { for (const entry of await fs.readdir(folder, { withFileTypes: true })) { const full = path.join(folder, entry.name); if (entry.isFile() && entry.name === 'whisper-cli.exe') return full; if (entry.isDirectory()) { const result = await find(full); if (result) return result; } } };
        const executable = await find(path.join(dir, 'runtime')); if (!executable) throw new Error('Whisper executable is missing.');
        ready = { executable, model }; await fs.writeFile(marker, JSON.stringify(ready)); return ready;
    }
    async toggle() {
        if (this.status === 'recording' && this.dir) { await fs.writeFile(path.join(this.dir, 'stop'), ''); this.emit('transcribing'); return; }
        if (this.status !== 'idle') return;
        if (!vscode.workspace.isTrusted) throw new Error('Trust the project before starting offline dictation.');
        this.emit('preparing'); this.cancelled = false;
        try {
            const ready = await this.setup();
            if (this.cancelled) return;
            const dir = this.dir = await fs.mkdtemp(path.join(tmpdir(), 'codech-voice-'));
            const wav = path.join(dir, 'audio.wav');
            await new Promise<void>((resolve, reject) => {
                const child = this.child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.script, '-OutputPath', wav, '-StopPath', path.join(dir, 'stop')], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
                let error = '';
                child.stdout?.on('data', data => { if (String(data).includes('RECORDING')) this.emit('recording'); });
                child.stderr?.on('data', data => { error = (error + String(data)).slice(-1500); });
                child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(error || 'Microphone recording failed.')));
            });
            this.child = undefined;
            if (this.cancelled) return;
            this.emit('transcribing');
            if (!hasAudibleAudio(await fs.readFile(wav))) { this.emit('idle', { error: 'No audible speech was detected. Check your microphone and try again.' }); return; }
            const output = path.join(dir, 'transcript');
            this.abort = new AbortController();
            const text = await this.transcribe(ready.executable, ready.model, wav, output, this.abort.signal);
            if (!this.cancelled) this.emit('idle', { text });
        } catch (e) { if (!this.cancelled) this.emit('idle', { error: (e as Error).message }); }
        finally { this.child = undefined; this.abort = undefined; if (this.dir) { const dir = this.dir; this.dir = undefined; await fs.rm(dir, { recursive: true, force: true }).catch(() => {}); } this.emit('idle'); }
    }
    async transcribe(executable: string, model: string, wav: string, output: string, signal?: AbortSignal) {
        return new Promise<string>((resolve, reject) => {
            const child = spawn(executable, ['-m', model, '-f', wav, '-l', 'fa', '-t', String(vscode.workspace.getConfiguration('codech').get('voiceThreads', 4)), '-nt', '-otxt', '-of', output, '-np', '-ng'], { windowsHide: true, shell: false, stdio: ['ignore', 'ignore', 'pipe'], signal });
            let error = ''; const timer = setTimeout(() => child.kill(), 240000);
            child.stderr?.on('data', data => { error = (error + String(data)).slice(-1500); });
            child.on('error', e => { clearTimeout(timer); reject(e); });
            child.on('exit', async code => { clearTimeout(timer); if (code !== 0) { reject(new Error(error || 'Local transcription failed.')); return; } try { resolve((await fs.readFile(output + '.txt', 'utf8')).trim()); } catch (e) { reject(e); } });
        });
    }
    async cancel() { this.cancelled = true; this.abort?.abort(); if (this.dir && this.child) await fs.writeFile(path.join(this.dir, 'stop'), '').catch(() => {}); }
    dispose() { this.cancelled = true; this.abort?.abort(); this.child?.kill(); if (this.dir) void fs.rm(this.dir, { recursive: true, force: true }).catch(() => {}); }
}
