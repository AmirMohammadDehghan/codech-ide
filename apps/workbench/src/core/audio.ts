/** Reject silence before loading Whisper; speech recognition can hallucinate on an empty recording. */
export function hasAudibleAudio(wav: Buffer) {
    if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Invalid WAV recording.');
    let format = false;
    for (let at = 12; at + 8 <= wav.length;) {
        const size = wav.readUInt32LE(at + 4), start = at + 8, end = Math.min(wav.length, start + size);
        const id = wav.toString('ascii', at, at + 4);
        if (id === 'fmt ') { format = size >= 16 && wav.readUInt16LE(start) === 1 && wav.readUInt16LE(start + 14) === 16; }
        if (id === 'data') {
            if (!format) throw new Error('The recorder must produce 16-bit PCM WAV.');
            let audible = 0;
            for (let pos = start; pos + 640 <= end; pos += 640) { let energy = 0; for (let i = pos; i < pos + 640; i += 2) energy += (wav.readInt16LE(i) / 32768) ** 2; if (Math.sqrt(energy / 320) > .004) audible++; }
            return audible >= 5;
        }
        at = end + size % 2;
    }
    return false;
}
