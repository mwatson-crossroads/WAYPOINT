import { lineText, parseChordPro, resolveArrangement } from './chordpro';
import type { Service, ServiceItem, Settings, Song } from './types';

export interface Slide {
  id: string;
  itemId: string;
  itemTitle: string;
  label: string;
  lines: string[];
  footer?: string;
}

/** Split n lines into evenly sized chunks of at most `per` lines (5 lines @ 2 → 2,2,1; 5 @ 4 → 3,2). */
function balancedChunks<T>(lines: T[], per: number): T[][] {
  if (!lines.length) return [];
  const count = Math.ceil(lines.length / Math.max(1, per));
  const size = Math.ceil(lines.length / count);
  const chunks: T[][] = [];
  for (let i = 0; i < lines.length; i += size) chunks.push(lines.slice(i, i + size));
  return chunks;
}

export function songFooter(song: Song, settings?: Pick<Settings, 'ccliLicense'>): string {
  return [
    song.title,
    song.author,
    song.ccliNumber && `CCLI Song #${song.ccliNumber}`,
    settings?.ccliLicense && `CCLI License #${settings.ccliLicense}`,
  ].filter(Boolean).join(' · ');
}

export function buildSongSlides(
  song: Song,
  item: Pick<ServiceItem, 'id' | 'title' | 'arrangement'>,
  settings: Pick<Settings, 'linesPerSlide' | 'ccliLicense'>,
): Slide[] {
  const chart = parseChordPro(song.chordPro);
  const tokens = item.arrangement?.length ? item.arrangement : song.defaultArrangement;
  const sections = resolveArrangement(tokens, chart.sections);
  const slides: Slide[] = [];
  sections.forEach((section, si) => {
    const lyrics = section.lines.map(lineText).filter(Boolean);
    balancedChunks(lyrics, settings.linesPerSlide).forEach((lines, ci) => {
      slides.push({ id: `${item.id}:${si}:${ci}`, itemId: item.id, itemTitle: item.title, label: section.label, lines });
    });
  });
  if (slides.length) slides[0].footer = songFooter(song, settings);
  return slides;
}

export function buildServiceSlides(
  service: Service,
  songs: Song[],
  settings: Pick<Settings, 'linesPerSlide' | 'ccliLicense'>,
): Slide[] {
  const byId = new Map(songs.map((s) => [s.id, s]));
  return service.items.flatMap((item): Slide[] => {
    if (item.kind === 'song') {
      const song = item.songId ? byId.get(item.songId) : undefined;
      return song ? buildSongSlides(song, item, settings) : [];
    }
    if (item.kind === 'element') {
      return [{ id: `${item.id}:0:0`, itemId: item.id, itemTitle: item.title, label: item.title, lines: [item.title] }];
    }
    return [];
  });
}
