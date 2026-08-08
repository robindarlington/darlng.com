// Zero-dependency, dev-only stand-in for Listmonk's public subscription
// endpoint (`POST /api/public/subscription`). Never imported by anything
// under `src/` — this is a local/CI testing harness only, not shipped in
// `dist/`.
//
// NOTE: the `already_subscribed: true` field this mock adds to a repeat
// submission is a TESTING ARTIFACT this mock invents so the UI-SPEC's
// already-subscribed branch is visually exercisable locally. Real Listmonk
// never emits this field — its public endpoint returns an identical 200 for
// both a brand-new and a repeat subscriber (verified from `cmd/public.go`,
// see 04-RESEARCH.md Common Pitfalls #2).
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const PORT = process.env.MOCK_LISTMONK_PORT || 8890;
const LOG_PATH = process.env.MOCK_LISTMONK_LOG || '/tmp/darlng-phase4/mock.log';

mkdirSync(path.dirname(LOG_PATH), { recursive: true });
writeFileSync(LOG_PATH, '');

const seenEmails = new Set();

const server = createServer((req, res) => {
  const origin = req.headers.origin || 'http://localhost:4321';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/public/subscription') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', origin);

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'invalid body' }));
        return;
      }

      appendFileSync(LOG_PATH, `${new Date().toISOString()} ${parsed.email}\n`);

      if (parsed.email === 'error@test.local') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'simulated server error' }));
        return;
      }

      const alreadySeen = seenEmails.has(parsed.email);
      seenEmails.add(parsed.email);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          data: { has_optin: true, ...(alreadySeen ? { already_subscribed: true } : {}) },
        })
      );
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Mock Listmonk listening on http://localhost:${PORT}`);
  console.log('Trigger error state: email = error@test.local');
  console.log('Trigger already-subscribed state: submit the same email twice');
  console.log('Trigger network-failure state: stop this server, then submit');
});
