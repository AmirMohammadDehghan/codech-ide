import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const lock = JSON.parse(await readFile(path.join(root, 'desktop/runtime.lock.json'), 'utf8'));
async function hash(file) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
}
export async function download(name) {
  const item = lock[name];
  if (!item) throw new Error(`Unknown pinned runtime: ${name}`);
  const dir = path.join(root, '.cache/downloads');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, path.basename(new URL(item.url).pathname));
  if (await hash(file).catch(() => '') === item.sha256) return file;
  console.log(`Downloading ${name} ${item.version}…`);
  const part = `${file}.part`;
  try {
    const response = await fetch(item.url, { signal: AbortSignal.timeout(900000) });
    if (!response.ok || !response.body) throw new Error(`Download failed: ${response.status}`);
    await pipeline(response.body, createWriteStream(part));
    if (await hash(part) !== item.sha256) throw new Error(`SHA-256 mismatch: ${name}`);
    await rename(part, file);
    console.log(`Verified ${name}: ${item.sha256}`);
    return file;
  } catch (error) {
    await rm(part, { force: true });
    throw error;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const name of process.argv.slice(2)) console.log(await download(name));
}
