const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Conventional spelling for each major / minor key. */
export const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const MINOR_KEYS = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];
export const ALL_KEYS = [...MAJOR_KEYS, ...MINOR_KEYS];

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

const NOTE = '([A-G])([#b♯♭]?)';
const CHORD_RE = new RegExp(`^${NOTE}([^/]*)(?:/${NOTE})?$`);

function idx(letter: string, acc: string): number {
  let i = BASE[letter];
  if (acc === '#' || acc === '♯') i++;
  if (acc === 'b' || acc === '♭') i--;
  return (i + 12) % 12;
}

export function noteIndex(note: string): number {
  const m = note.trim().match(new RegExp(`^${NOTE}`));
  return m ? idx(m[1], m[2]) : -1;
}

export function isMinorKey(key: string): boolean {
  return /^[A-G][#b♯♭]?m$/.test(key.trim());
}

export function keyPrefersFlats(key: string): boolean {
  return FLAT_KEYS.has(key.trim());
}

/** Semitones to move from one key to another (0–11). */
export function semitonesBetween(from: string, to: string): number {
  const a = noteIndex(from);
  const b = noteIndex(to);
  if (a < 0 || b < 0) return 0;
  return (b - a + 12) % 12;
}

export function transposeKey(key: string, semis: number): string {
  const i = noteIndex(key);
  if (i < 0) return key;
  const n = (i + semis + 120) % 12;
  return isMinorKey(key) ? MINOR_KEYS[n] : MAJOR_KEYS[n];
}

export function transposeChord(chord: string, semis: number, preferFlats: boolean): string {
  const m = chord.match(CHORD_RE);
  if (!m) return chord;
  const names = preferFlats ? FLATS : SHARPS;
  const move = (l: string, a: string) => names[(idx(l, a) + semis + 120) % 12];
  if (semis % 12 === 0) return chord;
  return move(m[1], m[2]) + m[3] + (m[4] ? '/' + move(m[4], m[5]) : '');
}

const DEGREES = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];

/** Chord → Nashville number relative to `key`, e.g. ("Em7", "G") → "6m7", ("D/F#","G") → "5/7". */
export function toNashville(chord: string, key: string): string {
  const m = chord.match(CHORD_RE);
  const k = noteIndex(key);
  if (!m || k < 0) return chord;
  const deg = (l: string, a: string) => DEGREES[(idx(l, a) - k + 12) % 12];
  return deg(m[1], m[2]) + m[3] + (m[4] ? '/' + deg(m[4], m[5]) : '');
}

/** True for tokens that look like chords: G, F#m7, Bbsus4, D/F#, Cmaj7(add9), N.C. */
export function isChordToken(token: string): boolean {
  if (token === 'N.C.' || token === 'NC') return true;
  return /^[A-G][#b♯♭]?(m|maj|min|dim|aug|sus|add|M|°|ø|\+|\d|b|#|\(|\))*(\/[A-G][#b♯♭]?)?$/.test(token);
}
