import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ALL_KEYS, buildSongSlides, chordsOverLyricsToChordPro, parseArrangement, parseChordPro, abbreviate,
  type ChartView as View, type Song,
} from '@hub/core';
import { api } from '../api';
import { useAutosave, useLoad } from '../hooks';
import { ChartView } from '../components/ChartView';

export function SongsPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [songs, reload] = useLoad(() => api.songs.list(), []);
  const [q, setQ] = useState('');

  const filtered = (songs ?? [])
    .filter((s) => `${s.title} ${s.author}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  const create = async () => {
    const s = await api.songs.create({ title: 'New Song' });
    reload();
    nav(`/songs/${s.id}`);
  };

  return (
    <div className="page songs-page">
      <div className="song-list">
        <div className="row gap">
          <input className="grow" placeholder="Search songs" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="primary" onClick={create}>+ New</button>
        </div>
        {filtered.map((s) => (
          <button key={s.id} className={`song-row ${s.id === id ? 'active' : ''}`} onClick={() => nav(`/songs/${s.id}`)}>
            <strong>{s.title}</strong>
            <span className="muted">{s.author} · {s.defaultKey}</span>
          </button>
        ))}
      </div>
      {id ? <SongEditor key={id} id={id} onChange={reload} onDeleted={() => { reload(); nav('/songs'); }} />
          : <div className="muted center">Select a song, or create one.</div>}
    </div>
  );
}

function SongEditor({ id, onChange, onDeleted }: { id: string; onChange: () => void; onDeleted: () => void }) {
  const [loaded] = useLoad(() => api.songs.get(id), [id]);
  const [song, setSong] = useState<Song>();
  const [view, setView] = useState<View>('chords');
  const [previewKey, setPreviewKey] = useState<string>();
  const [arrText, setArrText] = useState('');
  useEffect(() => { setSong(loaded); setArrText(loaded?.defaultArrangement.join(' ') ?? ''); }, [loaded]);
  const status = useAutosave(song, async (s) => { await api.songs.update(s.id, s); onChange(); });

  const sections = useMemo(() => (song ? parseChordPro(song.chordPro).sections : []), [song?.chordPro]);
  const slideCount = useMemo(
    () => (song ? buildSongSlides(song, { id: 'p', title: song.title }, { linesPerSlide: 2 }).length : 0), [song]);

  if (!song) return <div className="muted">Loading…</div>;
  const patch = (p: Partial<Song>) => setSong({ ...song, ...p });

  return (
    <div className="song-editor">
      <div className="song-fields">
        <div className="row gap wrap">
          <input className="title-input grow" value={song.title} onChange={(e) => patch({ title: e.target.value })} />
          <span className={`save-${status}`}>{status}</span>
        </div>
        <div className="grid-fields">
          <label>Author<input value={song.author} onChange={(e) => patch({ author: e.target.value })} /></label>
          <label>CCLI #<input value={song.ccliNumber ?? ''} onChange={(e) => patch({ ccliNumber: e.target.value })} /></label>
          <label>Written in key
            <select value={song.defaultKey} onChange={(e) => patch({ defaultKey: e.target.value })}>
              {ALL_KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label>BPM<input type="number" value={song.bpm ?? ''} onChange={(e) => patch({ bpm: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <label>Time<input value={song.timeSignature ?? ''} onChange={(e) => patch({ timeSignature: e.target.value })} /></label>
        </div>
        <label>Default arrangement
          <input className="mono" value={arrText} placeholder="e.g. V1 C V2 C B C"
            onChange={(e) => setArrText(e.target.value)}
            onBlur={() => patch({ defaultArrangement: parseArrangement(arrText) })} />
        </label>
        <div className="muted small">
          Sections: {sections.map((s) => `${abbreviate(s.label)} = ${s.label}`).join(' · ') || 'none'} · {slideCount} slides
        </div>
        <label className="grow-col">Chart (ChordPro — put chords in [brackets] before the syllable)
          <textarea className="mono chordpro" value={song.chordPro} spellCheck={false}
            onChange={(e) => patch({ chordPro: e.target.value })} />
        </label>
        <div className="row gap">
          <button onClick={() => patch({ chordPro: chordsOverLyricsToChordPro(song.chordPro) })}
            title="Convert pasted chords-above-lyrics text into ChordPro">Convert chords-over-lyrics</button>
          <span className="grow" />
          <button className="danger" onClick={async () => {
            if (!confirm(`Delete "${song.title}"?`)) return;
            await api.songs.remove(song.id);
            onDeleted();
          }}>Delete song</button>
        </div>
      </div>
      <div className="song-preview">
        <div className="row gap">
          <ViewToggle view={view} onChange={setView} />
          <select value={previewKey ?? song.defaultKey} onChange={(e) => setPreviewKey(e.target.value)} disabled={view === 'nashville'}>
            {ALL_KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <ChartView chordPro={song.chordPro} sourceKey={song.defaultKey} targetKey={previewKey} view={view} />
      </div>
    </div>
  );
}

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="segmented">
      {(['chords', 'nashville', 'lyrics'] as const).map((v) => (
        <button key={v} className={view === v ? 'active' : ''} onClick={() => onChange(v)}>
          {v === 'nashville' ? 'Numbers' : v[0].toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}
