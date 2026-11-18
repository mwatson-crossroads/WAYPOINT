import { useEffect, useState } from 'react';
import { useLive } from '../hooks';

/** Confidence monitor for the platform: current lyrics, next lines, and a clock. */
export function StagePage() {
  const [live] = useLive();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="stage" onDoubleClick={() => document.documentElement.requestFullscreen?.()}>
      <div className="stage-top">
        <span>{live?.label ?? ''}</span>
        <span className="stage-clock">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
      <div className="stage-current">
        {live?.mode === 'show' ? live.lines.map((l, i) => <div key={i}>{l}</div>) : <div className="muted">— {live?.mode ?? 'waiting'} —</div>}
      </div>
      <div className="stage-next">{live?.next?.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
}
