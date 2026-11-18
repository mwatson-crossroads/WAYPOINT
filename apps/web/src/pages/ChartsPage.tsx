import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { formatDuration, parseChordPro, resolveArrangement, abbreviate, type ChartView as View } from '@hub/core';
import { api } from '../api';
import { useLoad } from '../hooks';
import { ChartView } from '../components/ChartView';
import { ViewToggle } from './SongsPage';

/** Volunteer-facing chart packet for a whole service. Works on phones and prints one song per page. */
export function ChartsPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const [bundle, , error] = useLoad(() => api.bundle(id!), [id]);
  const [view, setView] = useState<View>((params.get('view') as View) ?? 'chords');
  const [capo, setCapo] = useState(Number(params.get('capo') ?? 0));
  const [size, setSize] = useState(16);

  const personId = params.get('for');
  const person = bundle?.people.find((p) => p.id === personId);
  const myPositions = bundle?.service.assignments.filter((a) => a.personId === personId).map((a) => a.position) ?? [];

  // Default the view from the volunteer's position (e.g. vocals → lyrics, bass → numbers).
  useEffect(() => {
    if (!bundle || params.get('view')) return;
    const def = bundle.settings.positions.find((p) => myPositions.includes(p.name));
    if (def) setView(def.chartView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle]);

  const changeView = (v: View) => {
    setView(v);
    params.set('view', v);
    setParams(params, { replace: true });
  };

  if (error) return <div className="page">Could not load charts: {error}</div>;
  if (!bundle) return <div className="page muted">Loading charts…</div>;
  const { service, songs } = bundle;
  const songById = new Map(songs.map((s) => [s.id, s]));

  return (
    <div className="charts-page" style={{ fontSize: size }}>
      <div className="charts-toolbar no-print">
        <div>
          <strong>{service.title}</strong>
          <div className="muted">
            {new Date(service.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            {person && <> · {person.name} ({myPositions.join(', ')})</>}
          </div>
        </div>
        <div className="row gap wrap">
          <ViewToggle view={view} onChange={changeView} />
          {view === 'chords' && (
            <label className="inline">Capo
              <select value={capo} onChange={(e) => setCapo(Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n || 'None'}</option>)}
              </select>
            </label>
          )}
          <button onClick={() => setSize((s) => Math.max(11, s - 1))}>A−</button>
          <button onClick={() => setSize((s) => Math.min(28, s + 1))}>A+</button>
          <button onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <ol className="runsheet no-print">
        {service.items.map((item) => (
          <li key={item.id} className={`kind-${item.kind}`}>
            {item.kind === 'song' ? <a href={`#item-${item.id}`}>{item.title}</a> : item.title}
            {item.kind === 'song' && <span className="muted"> · {item.key}</span>}
            {item.durationSec > 0 && <span className="muted"> · {formatDuration(item.durationSec)}</span>}
          </li>
        ))}
      </ol>

      {service.items.filter((i) => i.kind === 'song').map((item) => {
        const song = item.songId ? songById.get(item.songId) : undefined;
        if (!song) return null;
        const tokens = item.arrangement?.length ? item.arrangement : song.defaultArrangement;
        const roadmap = resolveArrangement(tokens, parseChordPro(song.chordPro).sections).map((s) => abbreviate(s.label));
        const key = item.key ?? song.defaultKey;
        return (
          <article key={item.id} id={`item-${item.id}`} className="chart-page">
            <header>
              <h2>{item.title}</h2>
              <div className="chart-meta">
                <span>Key <b>{key}</b>{view === 'chords' && capo > 0 && ` (capo ${capo})`}</span>
                {song.bpm && <span><b>{song.bpm}</b> BPM</span>}
                {song.timeSignature && <span>{song.timeSignature}</span>}
                <span className="muted">{song.author}</span>
              </div>
              {roadmap.length > 0 && <div className="roadmap">{roadmap.map((r, i) => <span key={i}>{r}</span>)}</div>}
              {item.notes && <div className="chart-notes">{item.notes}</div>}
            </header>
            <ChartView chordPro={song.chordPro} sourceKey={song.defaultKey} targetKey={key} view={view} capo={capo} />
          </article>
        );
      })}
    </div>
  );
}
