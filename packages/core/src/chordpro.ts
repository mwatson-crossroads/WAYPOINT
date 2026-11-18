import { isChordToken } from './transpose';

export type SectionType =
  | 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'tag'
  | 'interlude' | 'instrumental' | 'outro' | 'other';

export interface ChordSegment { chord?: string; lyric: string }
export interface ChartLine { kind: 'lyric' | 'comment'; segments: ChordSegment[]; text?: string }
export interface ChartSection { label: string; type: SectionType; lines: ChartLine[] }
export interface ParsedChart { meta: Record<string, string>; sections: ChartSection[] }

const HEADER_RE =
  /^(intro|verse|pre-?chorus|chorus|bridge|tag|interlude|instrumental|turnaround|outro|ending|vamp|refrain)(\s*\d+)?\s*:?$/i;

const META_ALIASES: Record<string, string> = { t: 'title', st: 'subtitle', a: 'artist', bpm: 'tempo' };
const SHORT_SECTIONS: Record<string, string> = { v: 'verse', c: 'chorus', b: 'bridge' };

export function sectionTypeOf(label: string): SectionType {
  const l = label.toLowerCase().replace(/[\s-]/g, '');
  if (l.startsWith('prechorus')) return 'prechorus';
  for (const t of ['intro', 'verse', 'chorus', 'bridge', 'tag', 'interlude', 'instrumental', 'outro'] as const) {
    if (l.startsWith(t)) return t;
  }
  if (l.startsWith('ending')) return 'outro';
  if (l.startsWith('turnaround')) return 'interlude';
  if (l.startsWith('refrain')) return 'chorus';
  if (l.startsWith('vamp')) return 'bridge';
  return 'other';
}

const titleCase = (s: string) => s.replace(/(^|[\s-])(\w)/g, (_, p, c) => p + c.toUpperCase());

export function parseLine(line: string): ChordSegment[] {
  const segs: ChordSegment[] = [];
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  let chord: string | undefined;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const text = line.slice(last, m.index);
    if (text || chord !== undefined) segs.push({ chord, lyric: text });
    chord = m[1].trim();
    last = re.lastIndex;
  }
  segs.push({ chord, lyric: line.slice(last) });
  return segs.filter((s) => s.chord !== undefined || s.lyric);
}

export function lineText(line: ChartLine): string {
  if (line.kind === 'comment') return '';
  return line.segments.map((s) => s.lyric).join('').replace(/\s+/g, ' ').trim();
}

export function parseChordPro(src: string): ParsedChart {
  const meta: Record<string, string> = {};
  const sections: ChartSection[] = [];
  const counts: Record<string, number> = {};
  let current: ChartSection | null = null;

  const open = (label: string) => {
    current = { label, type: sectionTypeOf(label), lines: [] };
    sections.push(current);
    return current;
  };
  const ensure = () => current ?? open('Untitled');

  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;

    const dir = trimmed.match(/^\{\s*([^:}]+?)\s*(?::\s*([^}]*))?\}$/);
    if (dir) {
      const name = dir[1].toLowerCase();
      const value = (dir[2] ?? '').trim();
      const start = name.match(/^start_of_(\w+)$/) ?? name.match(/^so([vcb])$/);
      if (start) {
        const kind = SHORT_SECTIONS[start[1]] ?? start[1];
        let label = value;
        if (!label) {
          counts[kind] = (counts[kind] ?? 0) + 1;
          label = kind === 'verse' ? `Verse ${counts[kind]}` : titleCase(kind);
        }
        open(label);
        continue;
      }
      if (/^(end_of_\w+|eo[vcb])$/.test(name)) { current = null; continue; }
      if (name === 'c' || name === 'comment' || name === 'ci' || name === 'comment_italic') {
        ensure().lines.push({ kind: 'comment', segments: [], text: value });
        continue;
      }
      meta[META_ALIASES[name] ?? name] = value;
      continue;
    }

    if (HEADER_RE.test(trimmed)) {
      open(titleCase(trimmed.replace(/:$/, '').trim().toLowerCase()));
      continue;
    }
    if (!trimmed) continue;
    ensure().lines.push({ kind: 'lyric', segments: parseLine(line) });
  }
  return { meta, sections: sections.filter((s) => s.lines.length) };
}

/** "Verse 1" → "V1", "Pre-Chorus" → "PC", "Chorus" → "C". */
export function abbreviate(label: string): string {
  const m = label.trim().match(/^(.*?)\s*(\d+)?$/)!;
  const letters = m[1].split(/[\s-]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('');
  return letters + (m[2] ?? '');
}

export function parseArrangement(text: string): string[] {
  return text.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
}

/** Map arrangement tokens ("V1 C B") onto chart sections. Unknown tokens are skipped. */
export function resolveArrangement(tokens: string[], sections: ChartSection[]): ChartSection[] {
  if (!tokens.length) return sections;
  return tokens.flatMap((tok) => {
    const t = tok.toLowerCase();
    const hit =
      sections.find((s) => s.label.toLowerCase() === t) ??
      sections.find((s) => abbreviate(s.label).toLowerCase() === t) ??
      sections.find((s) => abbreviate(s.label).replace(/\d+$/, '').toLowerCase() === t);
    return hit ? [hit] : [];
  });
}

/** Return a copy of the chart with every chord passed through `fn`. */
export function mapChords(chart: ParsedChart, fn: (chord: string) => string): ParsedChart {
  return {
    meta: chart.meta,
    sections: chart.sections.map((s) => ({
      ...s,
      lines: s.lines.map((l) => ({
        ...l,
        segments: l.segments.map((seg) => (seg.chord ? { ...seg, chord: fn(seg.chord) } : seg)),
      })),
    })),
  };
}

const isChordLine = (line: string) => {
  const tokens = line.trim().split(/\s+/).filter((t) => t && t !== '|' && !/^x\d+$/i.test(t));
  return tokens.length > 0 && tokens.every(isChordToken);
};

/**
 * Convert the common "chords above lyrics" text format (what you'd copy off a chart PDF or website)
 * into ChordPro by merging each chord line into the lyric line beneath it by column.
 */
export function chordsOverLyricsToChordPro(text: string): string {
  const lines = text.replace(/\t/g, '    ').split(/\r?\n/);
  const out: string[] = [];
  const inlineChords = (l: string) => l.trim().split(/\s+/).map((c) => `[${c}]`).join(' ');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isChordLine(line)) { out.push(line.trimEnd()); continue; }
    const next = lines[i + 1];
    if (next === undefined || !next.trim() || isChordLine(next) || HEADER_RE.test(next.trim())) {
      out.push(inlineChords(line));
      continue;
    }
    const chords: { col: number; chord: string }[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) chords.push({ col: m.index, chord: m[0] });
    let lyric = next.padEnd(Math.max(...chords.map((c) => c.col)), ' ');
    for (const { col, chord } of chords.reverse()) {
      lyric = lyric.slice(0, col) + `[${chord}]` + lyric.slice(col);
    }
    out.push(lyric.trimEnd());
    i++;
  }
  return out.join('\n');
}
