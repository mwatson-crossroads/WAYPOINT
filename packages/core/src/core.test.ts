import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  abbreviate, buildSongSlides, chordsOverLyricsToChordPro, parseChordPro, parseDuration,
  resolveArrangement, semitonesBetween, toNashville, transposeChord, transposeKey, formatDuration,
  type Song,
} from './index';

test('transposeChord handles quality, slash chords and spelling', () => {
  assert.equal(transposeChord('G', 2, false), 'A');
  assert.equal(transposeChord('Em7', 2, false), 'F#m7');
  assert.equal(transposeChord('D/F#', 3, true), 'F/A');
  assert.equal(transposeChord('Csus4', -2, true), 'Bbsus4');
  assert.equal(transposeChord('not a chord', 2, false), 'not a chord');
});

test('keys and intervals', () => {
  assert.equal(semitonesBetween('G', 'A'), 2);
  assert.equal(semitonesBetween('A', 'G'), 10);
  assert.equal(transposeKey('G', 3), 'Bb');
  assert.equal(transposeKey('Em', 1), 'Fm');
});

test('Nashville numbers', () => {
  assert.equal(toNashville('Em7', 'G'), '6m7');
  assert.equal(toNashville('D/F#', 'G'), '5/7');
  assert.equal(toNashville('F', 'G'), 'b7');
  assert.equal(toNashville('Csus2', 'G'), '4sus2');
});

test('parseChordPro: directives, headers and segments', () => {
  const chart = parseChordPro(`{title: Test}
{key: G}
Verse 1:
[G]Amazing [C]grace
{soc}
[D]Chorus line
{eoc}`);
  assert.equal(chart.meta.title, 'Test');
  assert.deepEqual(chart.sections.map((s) => s.label), ['Verse 1', 'Chorus']);
  assert.deepEqual(chart.sections[0].lines[0].segments, [
    { chord: 'G', lyric: 'Amazing ' },
    { chord: 'C', lyric: 'grace' },
  ]);
  assert.equal(chart.sections[1].type, 'chorus');
});

test('arrangement tokens resolve by label and abbreviation', () => {
  assert.equal(abbreviate('Pre-Chorus 2'), 'PC2');
  const chart = parseChordPro('Verse 1\na\nVerse 2\nb\nChorus 1\nc\nBridge\nd');
  const labels = resolveArrangement(['V1', 'C', 'V2', 'chorus 1', 'B', 'X'], chart.sections).map((s) => s.label);
  assert.deepEqual(labels, ['Verse 1', 'Chorus 1', 'Verse 2', 'Chorus 1', 'Bridge']);
});

test('chords-over-lyrics import', () => {
  const out = chordsOverLyricsToChordPro('G       C\nAmazing grace\nD   G\n\nChorus');
  assert.equal(out, '[G]Amazing [C]grace\n[D] [G]\n\nChorus');
});

test('slides follow arrangement, balance lines and carry a footer', () => {
  const song: Song = {
    id: 's', title: 'Song', author: 'Writer', ccliNumber: '123', defaultKey: 'G',
    chordPro: 'Verse 1\none\ntwo\nthree\nChorus\nfour\nfive', defaultArrangement: ['V1', 'C', 'C'],
    createdAt: '', updatedAt: '',
  };
  const slides = buildSongSlides(song, { id: 'i', title: 'Song' }, { linesPerSlide: 2, ccliLicense: '999' });
  assert.deepEqual(slides.map((s) => s.lines), [['one', 'two'], ['three'], ['four', 'five'], ['four', 'five']]);
  assert.equal(slides[0].footer, 'Song · Writer · CCLI Song #123 · CCLI License #999');
  assert.equal(slides[1].footer, undefined);
});

test('durations', () => {
  assert.equal(parseDuration('4:30'), 270);
  assert.equal(parseDuration('5'), 300);
  assert.equal(parseDuration('abc'), null);
  assert.equal(formatDuration(3725), '1:02:05');
});
