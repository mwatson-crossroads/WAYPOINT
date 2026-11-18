import Fastify, { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { WebSocket } from 'ws';
import { uid, type LiveState, type Person, type Service, type ServiceBundle, type Settings, type Song } from '@hub/core';
import { createStore } from './store';
import type { Collection } from './db';
import { DEFAULT_SETTINGS, seed } from './seed';

const PORT = Number(process.env.PORT ?? 4300);
const DB_FILE = process.env.HUB_DB ?? fileURLToPath(new URL('../../../data/hub.db', import.meta.url));
const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));

const store = createStore(DB_FILE);
seed(store);

const app = Fastify({ logger: { level: 'warn' } });
await app.register(websocket);

type Doc = { id: string };
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Standard REST routes for a document collection. */
function crud<T extends Doc>(
  app: FastifyInstance,
  path: string,
  col: Collection<T>,
  create: (body: Record<string, unknown>) => T,
) {
  app.get(path, async () => col.list());
  app.get<{ Params: { id: string } }>(`${path}/:id`, async (req, reply) =>
    col.get(req.params.id) ?? reply.code(404).send({ error: 'Not found' }));
  app.post(path, async (req, reply) => {
    if (!isObject(req.body)) return reply.code(400).send({ error: 'Expected a JSON object' });
    return reply.code(201).send(col.put(create(req.body)));
  });
  app.put<{ Params: { id: string } }>(`${path}/:id`, async (req, reply) => {
    const existing = col.get(req.params.id);
    if (!existing) return reply.code(404).send({ error: 'Not found' });
    if (!isObject(req.body)) return reply.code(400).send({ error: 'Expected a JSON object' });
    const merged = { ...existing, ...req.body, id: existing.id } as T;
    if ('updatedAt' in existing) (merged as T & { updatedAt: string }).updatedAt = new Date().toISOString();
    return col.put(merged);
  });
  app.delete<{ Params: { id: string } }>(`${path}/:id`, async (req, reply) =>
    col.delete(req.params.id) ? reply.code(204).send() : reply.code(404).send({ error: 'Not found' }));
}

const now = () => new Date().toISOString();
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

crud<Song>(app, '/api/songs', store.songs, (b) => ({
  id: uid(),
  title: str(b.title, 'Untitled Song'),
  author: str(b.author),
  ccliNumber: str(b.ccliNumber) || undefined,
  defaultKey: str(b.defaultKey, 'G'),
  bpm: typeof b.bpm === 'number' ? b.bpm : undefined,
  timeSignature: str(b.timeSignature, '4/4'),
  chordPro: str(b.chordPro, 'Verse 1\n[G]New song lyrics'),
  defaultArrangement: Array.isArray(b.defaultArrangement) ? b.defaultArrangement.map(String) : [],
  createdAt: now(),
  updatedAt: now(),
}));

crud<Service>(app, '/api/services', store.services, (b) => ({
  id: uid(),
  title: str(b.title, 'Sunday Service'),
  date: str(b.date, now()),
  items: Array.isArray(b.items) ? (b.items as Service['items']) : [],
  assignments: Array.isArray(b.assignments) ? (b.assignments as Service['assignments']) : [],
  createdAt: now(),
  updatedAt: now(),
}));

crud<Person>(app, '/api/people', store.people, (b) => ({
  id: uid(),
  name: str(b.name, 'New Volunteer'),
  email: str(b.email) || undefined,
  phone: str(b.phone) || undefined,
  positions: Array.isArray(b.positions) ? b.positions.map(String) : [],
}));

const getSettings = (): Settings => store.settings.get('settings') ?? DEFAULT_SETTINGS;
app.get('/api/settings', async () => getSettings());
app.put('/api/settings', async (req, reply) => {
  if (!isObject(req.body)) return reply.code(400).send({ error: 'Expected a JSON object' });
  return store.settings.put({ ...getSettings(), ...req.body, id: 'settings' } as Settings);
});

/** Everything a chart, presenter or stage view needs for one service, in one request. */
app.get<{ Params: { id: string } }>('/api/services/:id/bundle', async (req, reply) => {
  const service = store.services.get(req.params.id);
  if (!service) return reply.code(404).send({ error: 'Not found' });
  const songIds = new Set(service.items.map((i) => i.songId).filter(Boolean));
  const bundle: ServiceBundle = {
    service,
    songs: store.songs.list().filter((s) => songIds.has(s.id)),
    people: store.people.list(),
    settings: getSettings(),
  };
  return bundle;
});

// ---- Live output channel: presenter sends state, every output/stage display receives it ----
let live: LiveState = { mode: 'clear', lines: [], updatedAt: Date.now() };
const sockets = new Set<WebSocket>();

app.get('/ws', { websocket: true }, (socket) => {
  sockets.add(socket);
  socket.send(JSON.stringify({ type: 'live', state: live }));
  socket.on('message', (raw) => {
    let msg: unknown;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    if (isObject(msg) && msg.type === 'live' && isObject(msg.state)) {
      live = { ...(msg.state as unknown as LiveState), updatedAt: Date.now() };
      const out = JSON.stringify({ type: 'live', state: live });
      for (const s of sockets) if (s.readyState === s.OPEN) s.send(out);
    }
  });
  socket.on('close', () => sockets.delete(socket));
});
app.get('/api/live', async () => live);

// ---- Serve the built web app (production) with SPA fallback ----
if (existsSync(WEB_DIST)) {
  await app.register(fastifyStatic, { root: WEB_DIST });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith('/api') ? reply.code(404).send({ error: 'Not found' }) : reply.sendFile('index.html'));
}

await app.listen({ port: PORT, host: '0.0.0.0' });

const lan = Object.values(networkInterfaces()).flat()
  .filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n!.address);
console.log(`\nProduction Hub server on http://localhost:${PORT}`);
for (const ip of lan) console.log(`  Volunteers on the LAN: http://${ip}:${PORT}`);
console.log(`  Database: ${DB_FILE}\n`);
