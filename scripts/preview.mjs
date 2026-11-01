import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('apps/workbench');
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/dist/ui.css"><title>Codech IDE — UI preview</title></head><body class="preview"><div id="app"></div><div class="preview-label">INTERACTIVE UI PREVIEW · FIXTURE DATA · NO LIVE AGENT</div><script src="/preview-fixture.js"></script><script src="/dist/ui.js"></script></body></html>');
        return;
    }
    if (url.pathname === '/preview-fixture.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(await readFile('scripts/preview-fixture.js'));
        return;
    }
    const paths = new Map([['/dist/ui.js', 'dist/ui.js'], ['/dist/ui.css', 'dist/ui.css']]);
    if (!paths.has(url.pathname)) {
        res.writeHead(404);
        res.end();
        return;
    }
    try {
        res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
        res.end(await readFile(path.join(root, paths.get(url.pathname))));
    }
    catch {
        res.writeHead(404);
        res.end('Run npm run build first.');
    }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log('Codech UI preview: http://127.0.0.1:' + server.address().port));
