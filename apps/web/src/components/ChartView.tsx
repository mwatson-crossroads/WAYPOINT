import { useMemo } from 'react';
import {
  keyPrefersFlats, mapChords, parseChordPro, semitonesBetween, toNashville, transposeChord, transposeKey,
  type ChartView as View, type ParsedChart,
} from '@hub/core';

interface Props {
  chordPro: string;
  /** Key the source is written in. */
  sourceKey: string;
  /** Key to display/perform in. */
  targetKey?: string;
  view: View;
  capo?: number;
}

/** Render a ChordPro chart as chords-over-lyrics, Nashville numbers, or lyrics only. */
export function ChartView({ chordPro, sourceKey, targetKey, view, capo = 0 }: Props) {
  const key = targetKey || sourceKey;
  const chart: ParsedChart = useMemo(() => {
    const parsed = parseChordPro(chordPro);
    if (view === 'nashville') {
      return mapChords(parsed, (c) => toNashville(c, sourceKey));
    }
    const shapeKey = transposeKey(key, -capo);
    const semis = semitonesBetween(sourceKey, shapeKey);
    const flats = keyPrefersFlats(shapeKey);
    return mapChords(parsed, (c) => transposeChord(c, semis, flats));
  }, [chordPro, sourceKey, key, view, capo]);

  return (
    <div className={`chart chart-${view}`}>
      {chart.sections.map((section, si) => (
        <section key={si} className={`chart-section type-${section.type}`}>
          <h4>{section.label}</h4>
          {section.lines.map((line, li) =>
            line.kind === 'comment' ? (
              <div key={li} className="chart-comment">{line.text}</div>
            ) : view === 'lyrics' ? (
              line.segments.some((s) => s.lyric.trim()) && (
                <div key={li} className="chart-line">{line.segments.map((s) => s.lyric).join('')}</div>
              )
            ) : (
              <div key={li} className="chart-line">
                {line.segments.map((seg, i) => (
                  <span key={i} className="seg">
                    <span className="chord">{seg.chord ?? ' '}</span>
                    <span className="lyric">{seg.lyric || ' '}</span>
                  </span>
                ))}
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  );
}
