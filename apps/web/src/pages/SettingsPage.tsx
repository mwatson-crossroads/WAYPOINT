import { useEffect, useState } from 'react';
import type { ChartView, Settings } from '@hub/core';
import { api } from '../api';
import { useAutosave, useLoad } from '../hooks';

export function SettingsPage() {
  const [loaded] = useLoad(() => api.settings.get(), []);
  const [s, setS] = useState<Settings>();
  useEffect(() => setS(loaded), [loaded]);
  const status = useAutosave(s, (v) => api.settings.update(v));
  if (!s) return <div className="page muted">Loading…</div>;
  const patch = (p: Partial<Settings>) => setS({ ...s, ...p });

  return (
    <div className="page narrow">
      <header className="page-head"><h1>Settings</h1><span className={`save-${status}`}>{status}</span></header>
      <div className="card grid-fields">
        <label>Church name<input value={s.churchName} onChange={(e) => patch({ churchName: e.target.value })} /></label>
        <label>CCLI license #<input value={s.ccliLicense ?? ''} onChange={(e) => patch({ ccliLicense: e.target.value })} /></label>
        <label>Lyric lines per slide
          <input type="number" min={1} max={8} value={s.linesPerSlide}
            onChange={(e) => patch({ linesPerSlide: Math.max(1, Number(e.target.value) || 1) })} />
        </label>
      </div>
      <h2>Team positions</h2>
      <p className="muted">Each position gets its own default chart type when you send charts.</p>
      <div className="card">
        {s.positions.map((p, i) => (
          <div key={i} className="row gap position-row">
            <input className="grow" value={p.name} onChange={(e) =>
              patch({ positions: s.positions.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <select value={p.chartView} onChange={(e) =>
              patch({ positions: s.positions.map((x, j) => (j === i ? { ...x, chartView: e.target.value as ChartView } : x)) })}>
              <option value="chords">Chord chart</option>
              <option value="nashville">Number chart</option>
              <option value="lyrics">Lyrics only</option>
            </select>
            <button className="icon" onClick={() => patch({ positions: s.positions.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button onClick={() => patch({ positions: [...s.positions, { name: 'New Position', chartView: 'chords' }] })}>
          + Add position
        </button>
      </div>
    </div>
  );
}
