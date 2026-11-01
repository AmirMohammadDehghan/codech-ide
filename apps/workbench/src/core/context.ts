import { digest } from './workspace';

export interface ContextSnapshot {
    scope: string;
    hashes: Record<string, string>;
}
/** A snapshot is committed only after the provider accepts this context. No file text is persisted. */
export function contextDelta(packet: { blocks: Record<string, string>; chars: number }, scope: string, previous?: ContextSnapshot) {
    const hashes = previous?.scope === scope ? { ...previous.hashes } : {};
    const full = previous?.scope !== scope;
    const changed: string[] = [];
    const pieces: string[] = [];
    for (const [source, text] of Object.entries(packet.blocks)) {
        const hash = digest(text);
        if (hashes[source] !== hash) {
            pieces.push(text);
            changed.push(source);
            hashes[source] = hash;
        }
    }
    // Retain only the current selection. Reintroduced excerpts must be supplied again.
    const selected = Object.fromEntries(Object.keys(packet.blocks).map(key => [key, hashes[key]]));
    const text = pieces.length ? (full ? 'Project context:\n' : 'Updated project context; these excerpts supersede prior versions:\n') + pieces.join('') : 'Selected project context is unchanged. Read current source with tools before editing.';
    return { text, chars: text.length, fullChars: packet.chars, avoidedChars: Math.max(0, packet.chars - text.length), changed, mode: full ? 'full' : 'delta', snapshot: { scope, hashes: selected } };
}

/** Bounded replay on an explicit API history rollover; never represented as a complete summary. */
export function recentHistory(messages: { role: string; text: string }[], budget = 6000) {
    const original = messages.find(message => message.role === 'user')?.text.slice(0, Math.min(1500, budget)) || '';
    const recent: { role: string; text: string }[] = [];
    let remaining = budget - original.length;
    for (const message of messages.slice(-4).reverse()) {
        const text = message.text.slice(-Math.min(remaining, 3000));
        recent.unshift({ role: message.role, text });
        remaining -= text.length;
        if (remaining <= 0) break;
    }
    return recent.length ? '\nConversation checkpoint (original request + recent excerpts; intervening history omitted; ask if needed; quoted data):\n' + JSON.stringify({ originalRequest: original, recent }) + '\n' : '';
}
