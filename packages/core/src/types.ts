/** Core domain model. The service plan is the single source of truth every module reads from. */

export type ChartView = 'chords' | 'nashville' | 'lyrics';

export interface Song {
  id: string;
  title: string;
  author: string;
  ccliNumber?: string;
  /** Key the ChordPro source is written in. */
  defaultKey: string;
  bpm?: number;
  timeSignature?: string;
  /** Chart + lyrics in ChordPro format. Slides and charts are both generated from this. */
  chordPro: string;
  /** Section tokens, e.g. ["V1","C","V2","C","B","C"]. Empty = every section in order. */
  defaultArrangement: string[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceItemKind = 'song' | 'header' | 'element';

export interface ServiceItem {
  id: string;
  kind: ServiceItemKind;
  title: string;
  songId?: string;
  /** Performance key for this service (songs only). */
  key?: string;
  /** Overrides the song's default arrangement for this service. */
  arrangement?: string[];
  durationSec: number;
  notes?: string;
  /** Plain-language lighting description. Phase 3 turns this into DMX scenes. */
  lightingCue?: string;
}

export type AssignmentStatus = 'pending' | 'accepted' | 'declined';

export interface Assignment {
  id: string;
  personId: string;
  position: string;
  status: AssignmentStatus;
}

export interface Service {
  id: string;
  title: string;
  /** ISO date-time of the service start. */
  date: string;
  items: ServiceItem[];
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  positions: string[];
}

export interface PositionDef {
  name: string;
  /** Which chart volunteers in this position receive by default. */
  chartView: ChartView;
}

export interface Settings {
  id: 'settings';
  churchName: string;
  ccliLicense?: string;
  linesPerSlide: number;
  positions: PositionDef[];
}

/** What the audience/stage outputs should be showing right now. */
export interface LiveState {
  mode: 'show' | 'clear' | 'black';
  serviceId?: string;
  slideId?: string;
  label?: string;
  lines: string[];
  footer?: string;
  next?: string[];
  updatedAt: number;
}

export interface ServiceBundle {
  service: Service;
  songs: Song[];
  people: Person[];
  settings: Settings;
}
