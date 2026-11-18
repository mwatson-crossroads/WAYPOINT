import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveState } from '@hub/core';

/** Subscribe to the hub's live output state; reconnects automatically if the server restarts. */
export function useLive(): [LiveState | null, (s: Omit<LiveState, 'updatedAt'>) => void, boolean] {
  const [state, setState] = useState<LiveState | null>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let timer: ReturnType<typeof setTimeout>;
    const connect = () => {
      const sock = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      ws.current = sock;
      sock.onopen = () => setConnected(true);
      sock.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'live') setState(msg.state);
      };
      sock.onclose = () => {
        setConnected(false);
        if (!closed) timer = setTimeout(connect, 1000);
      };
    };
    connect();
    return () => { closed = true; clearTimeout(timer); ws.current?.close(); };
  }, []);

  const send = useCallback((s: Omit<LiveState, 'updatedAt'>) => {
    ws.current?.send(JSON.stringify({ type: 'live', state: s }));
  }, []);
  return [state, send, connected];
}

/** Load async data with a reload function. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): [T | undefined, () => void, string | undefined] {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    fn().then((d) => alive && (setData(d), setError(undefined))).catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return [data, () => setTick((t) => t + 1), error];
}

/** Debounced autosave: call `save` `ms` after the last change to `value`. */
export function useAutosave<T>(value: T | undefined, save: (v: T) => Promise<unknown>, ms = 600) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const first = useRef(true);
  useEffect(() => {
    if (value === undefined) return;
    if (first.current) { first.current = false; return; }
    setStatus('dirty');
    const t = setTimeout(() => {
      setStatus('saving');
      save(value).then(() => setStatus('saved')).catch(() => setStatus('error'));
    }, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return status;
}
