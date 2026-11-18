/** Random id that works in non-secure (plain http LAN) browser contexts, unlike crypto.randomUUID. */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Accepts "4:30", "1:02:00", "4" (minutes) → seconds. Returns null when unparseable. */
export function parseDuration(text: string): number | null {
  const t = text.trim();
  if (!t) return 0;
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t) * 60);
  if (!/^\d+(:\d{1,2}){1,2}$/.test(t)) return null;
  return t.split(':').map(Number).reduce((acc, n) => acc * 60 + n, 0);
}
