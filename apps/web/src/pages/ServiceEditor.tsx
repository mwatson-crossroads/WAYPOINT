import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ALL_KEYS, formatDuration, parseArrangement, parseDuration, uid,
  type Assignment, type Person, type Service, type ServiceItem, type ServiceItemKind,
} from '@hub/core';
import { api } from '../api';
import { useAutosave, useLoad } from '../hooks';

export function ServiceEditor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [loaded] = useLoad(() => api.services.get(id!), [id]);
  const [songs] = useLoad(() => api.songs.list(), []);
  const [people] = useLoad(() => api.people.list(), []);
  const [settings] = useLoad(() => api.settings.get(), []);
  const [service, setService] = useState<Service>();
  useEffect(() => setService(loaded), [loaded]);
  const status = useAutosave(service, (s) => api.services.update(s.id, s));

  const songById = useMemo(() => new Map((songs ?? []).map((s) => [s.id, s])), [songs]);
  if (!service) return <div className="page muted">Loading…</div>;

  const patch = (p: Partial<Service>) => setService({ ...service, ...p });
  const setItems = (items: ServiceItem[]) => patch({ items });
  const updateItem = (itemId: string, p: Partial<ServiceItem>) =>
    setItems(service.items.map((i) => (i.id === itemId ? { ...i, ...p } : i)));
  const move = (index: number, dir: -1 | 1) => {
    const items = [...service.items];
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    [items[index], items[j]] = [items[j], items[index]];
    setItems(items);
  };
  const add = (kind: ServiceItemKind, songId?: string) => {
    const song = songId ? songById.get(songId) : undefined;
    const item: ServiceItem = {
      id: uid(), kind,
      title: song?.title ?? (kind === 'header' ? 'New Section' : 'New Element'),
      songId, key: song?.defaultKey,
      durationSec: kind === 'song' ? 300 : kind === 'element' ? 180 : 0,
    };
    setItems([...service.items, item]);
  };

  let clock = new Date(service.date).getTime();
  const total = service.items.reduce((n, i) => n + i.durationSec, 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <input className="title-input" value={service.title} onChange={(e) => patch({ title: e.target.value })} />
          <div className="muted">
            {new Date(service.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })} ·
            {' '}{formatDuration(total)} total · <span className={`save-${status}`}>{status}</span>
          </div>
        </div>
        <div className="row gap">
          <Link className="btn" to={`/services/${service.id}/charts`} target="_blank">Charts ↗</Link>
          <Link className="btn primary" to={`/services/${service.id}/present`} target="hubPresenter">Present ↗</Link>
        </div>
      </header>

      <div className="split">
        <section>
          <h2>Order of service</h2>
          <div className="order">
            {service.items.map((item, index) => {
              const start = clock;
              clock += item.durationSec * 1000;
              const song = item.songId ? songById.get(item.songId) : undefined;
              if (item.kind === 'header') {
                return (
                  <div key={item.id} className="order-header">
                    <input value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} />
                    <ItemControls onUp={() => move(index, -1)} onDown={() => move(index, 1)}
                      onDelete={() => setItems(service.items.filter((i) => i.id !== item.id))} />
                  </div>
                );
              }
              return (
                <div key={item.id} className={`order-item kind-${item.kind}`}>
                  <div className="order-time muted">{new Date(start).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                  <div className="order-body">
                    <div className="row gap wrap">
                      <span className={`badge ${item.kind}`}>{item.kind}</span>
                      <input className="grow" value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} />
                      {item.kind === 'song' && (
                        <label className="inline">Key
                          <select value={item.key ?? song?.defaultKey} onChange={(e) => updateItem(item.id, { key: e.target.value })}>
                            {ALL_KEYS.map((k) => <option key={k}>{k}</option>)}
                          </select>
                        </label>
                      )}
                      <DurationInput value={item.durationSec} onChange={(durationSec) => updateItem(item.id, { durationSec })} />
                      <ItemControls onUp={() => move(index, -1)} onDown={() => move(index, 1)}
                        onDelete={() => setItems(service.items.filter((i) => i.id !== item.id))} />
                    </div>
                    {item.kind === 'song' && (
                      <div className="row gap wrap small">
                        <ArrangementInput
                          value={item.arrangement}
                          placeholder={song?.defaultArrangement.join(' ') || 'All sections'}
                          onChange={(arrangement) => updateItem(item.id, { arrangement })} />
                        {song && <span className="muted">{song.bpm ? `${song.bpm} BPM · ` : ''}{song.timeSignature}</span>}
                        {!song && <span className="warn">Song missing from library</span>}
                      </div>
                    )}
                    <div className="row gap wrap small">
                      <input className="grow" placeholder="Notes for the team" value={item.notes ?? ''}
                        onChange={(e) => updateItem(item.id, { notes: e.target.value })} />
                      <input className="grow lighting" placeholder="💡 Describe the lighting look (AI scene builder: phase 3)"
                        value={item.lightingCue ?? ''} onChange={(e) => updateItem(item.id, { lightingCue: e.target.value })} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="row gap wrap add-bar">
            <select value="" onChange={(e) => e.target.value && add('song', e.target.value)}>
              <option value="">+ Add song…</option>
              {(songs ?? []).map((s) => <option key={s.id} value={s.id}>{s.title} ({s.defaultKey})</option>)}
            </select>
            <button onClick={() => add('element')}>+ Element</button>
            <button onClick={() => add('header')}>+ Header</button>
            <span className="grow" />
            <button className="danger" onClick={async () => {
              if (!confirm(`Delete "${service.title}"?`)) return;
              await api.services.remove(service.id);
              nav('/');
            }}>Delete service</button>
          </div>
        </section>

        <aside>
          <TeamPanel
            service={service}
            people={people ?? []}
            positions={settings?.positions.map((p) => p.name) ?? []}
            onChange={(assignments) => patch({ assignments })}
          />
        </aside>
      </div>
    </div>
  );
}

function ItemControls({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) {
  return (
    <span className="item-controls">
      <button className="icon" title="Move up" onClick={onUp}>↑</button>
      <button className="icon" title="Move down" onClick={onDown}>↓</button>
      <button className="icon" title="Remove" onClick={onDelete}>✕</button>
    </span>
  );
}

function DurationInput({ value, onChange }: { value: number; onChange: (sec: number) => void }) {
  const [text, setText] = useState(formatDuration(value));
  useEffect(() => setText(formatDuration(value)), [value]);
  const parsed = parseDuration(text);
  return (
    <input className={`duration ${parsed === null ? 'invalid' : ''}`} value={text} title="Duration (m:ss)"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => (parsed === null ? setText(formatDuration(value)) : onChange(parsed))} />
  );
}

function ArrangementInput({ value, placeholder, onChange }:
  { value?: string[]; placeholder: string; onChange: (v: string[] | undefined) => void }) {
  const [text, setText] = useState(value?.join(' ') ?? '');
  return (
    <label className="inline grow">Arrangement
      <input className="grow mono" value={text} placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { const t = parseArrangement(text); onChange(t.length ? t : undefined); }} />
    </label>
  );
}

function TeamPanel({ service, people, positions, onChange }: {
  service: Service; people: Person[]; positions: string[]; onChange: (a: Assignment[]) => void;
}) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const chartUrl = (personId: string) => `${location.origin}/services/${service.id}/charts?for=${personId}`;
  const update = (aid: string, p: Partial<Assignment>) =>
    onChange(service.assignments.map((a) => (a.id === aid ? { ...a, ...p } : a)));

  return (
    <div className="card team">
      <h2>Team</h2>
      {positions.map((position) => {
        const assigned = service.assignments.filter((a) => a.position === position);
        const candidates = people.filter((p) => p.positions.includes(position) && !assigned.some((a) => a.personId === p.id));
        return (
          <div key={position} className="position">
            <div className="position-name">{position}</div>
            {assigned.map((a) => {
              const person = byId.get(a.personId);
              const mail = person?.email &&
                `mailto:${person.email}?subject=${encodeURIComponent(`Charts: ${service.title}`)}&body=${encodeURIComponent(
                  `Hi ${person.name.split(' ')[0]},\n\nHere are your charts for ${service.title} (${new Date(service.date).toLocaleDateString()}):\n${chartUrl(a.personId)}\n`)}`;
              return (
                <div key={a.id} className="assignment">
                  <span className="grow">{person?.name ?? 'Unknown'}</span>
                  <select className={`status-${a.status}`} value={a.status}
                    onChange={(e) => update(a.id, { status: e.target.value as Assignment['status'] })}>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                  {mail
                    ? <a className="icon-link" href={mail} title="Email chart link">✉</a>
                    : <button className="icon" title="Copy chart link"
                        onClick={() => navigator.clipboard?.writeText(chartUrl(a.personId))}>⧉</button>}
                  <button className="icon" title="Unschedule"
                    onClick={() => onChange(service.assignments.filter((x) => x.id !== a.id))}>✕</button>
                </div>
              );
            })}
            {candidates.length > 0 && (
              <select className="add-person" value="" onChange={(e) => e.target.value && onChange([
                ...service.assignments, { id: uid(), personId: e.target.value, position, status: 'pending' },
              ])}>
                <option value="">+ Schedule…</option>
                {candidates.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
