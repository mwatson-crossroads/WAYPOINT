import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { buildServiceSlides, type Slide } from '@hub/core';
import { api } from '../api';
import { useLive, useLoad } from '../hooks';

/** Operator view: click a slide (or use arrow keys) to send it to every output. */
export function PresenterPage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, reload] = useLoad(() => api.bundle(id!), [id]);
  const [live, send, connected] = useLive();

  const slides = useMemo(
    () => (bundle ? buildServiceSlides(bundle.service, bundle.songs, bundle.settings) : []), [bundle]);
  const current = slides.findIndex((s) => s.id === live?.slideId);

  const go = useCallback((slide: Slide | undefined) => {
    if (!slide) return;
    const i = slides.indexOf(slide);
    send({
      mode: 'show', serviceId: id, slideId: slide.id, label: `${slide.itemTitle} — ${slide.label}`,
      lines: slide.lines, footer: slide.footer, next: slides[i + 1]?.lines,
    });
  }, [slides, send, id]);

  const setMode = useCallback((mode: 'clear' | 'black') => {
    send({ ...(live ?? { lines: [] }), mode: live?.mode === mode ? 'show' : mode });
  }, [live, send]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(slides[current + 1] ?? slides[0]); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(slides[Math.max(0, current - 1)]); }
      if (e.key === 'b') setMode('black');
      if (e.key === 'c') setMode('clear');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, slides, current, setMode]);

  if (!bundle) return <div className="page muted">Loading…</div>;
  const groups = bundle.service.items
    .map((item) => ({ item, slides: slides.filter((s) => s.itemId === item.id) }))
    .filter((g) => g.slides.length || g.item.kind === 'header');

  return (
    <div className="presenter">
      <header className="presenter-bar">
        <strong>{bundle.service.title}</strong>
        <span className={connected ? 'ok' : 'warn'}>{connected ? '● Connected' : '○ Reconnecting…'}</span>
        <span className="grow" />
        <button className={live?.mode === 'clear' ? 'active' : ''} onClick={() => setMode('clear')}>Clear (C)</button>
        <button className={live?.mode === 'black' ? 'active danger' : ''} onClick={() => setMode('black')}>Black (B)</button>
        <button onClick={reload}>Reload service</button>
        <button onClick={() => window.open('/output', 'hubOutput', 'popup,width=960,height=540')}>Open output</button>
        <button onClick={() => window.open('/stage', 'hubStage', 'popup,width=960,height=540')}>Open stage</button>
      </header>
      <div className="presenter-body">
        <div className="slide-groups">
          {groups.map(({ item, slides: ss }) => (
            <section key={item.id}>
              <h3 className={item.kind === 'header' ? 'group-header' : ''}>{item.title}{item.key ? ` · ${item.key}` : ''}</h3>
              <div className="slide-grid">
                {ss.map((s) => (
                  <button key={s.id} className={`slide-thumb ${s.id === live?.slideId ? 'live' : ''}`} onClick={() => go(s)}>
                    <span className="slide-label">{s.label}</span>
                    {s.lines.map((l, i) => <span key={i}>{l}</span>)}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <aside className="presenter-preview">
          <div className="muted small">LIVE</div>
          <div className="preview-screen"><Screen state={live} /></div>
          <div className="muted small">{live?.label}</div>
          <div className="muted small" style={{ marginTop: 16 }}>NEXT</div>
          <div className="next-lines">{live?.next?.map((l, i) => <div key={i}>{l}</div>) ?? '—'}</div>
          <p className="muted small">→ / Space: next · ←: previous · B: black · C: clear</p>
        </aside>
      </div>
    </div>
  );
}

export function Screen({ state }: { state: ReturnType<typeof useLive>[0] }) {
  const hidden = !state || state.mode !== 'show';
  return (
    <div className={`screen ${state?.mode === 'black' ? 'black' : ''}`}>
      {!hidden && (
        <>
          <div className="screen-lines">{state.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
          {state.footer && <div className="screen-footer">{state.footer}</div>}
        </>
      )}
    </div>
  );
}
