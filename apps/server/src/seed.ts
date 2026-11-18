import { uid, type Person, type Service, type Settings, type Song } from '@hub/core';
import type { Store } from './store';

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  churchName: 'My Church',
  ccliLicense: '',
  linesPerSlide: 2,
  positions: [
    { name: 'Worship Leader', chartView: 'chords' },
    { name: 'Vocals', chartView: 'lyrics' },
    { name: 'Acoustic Guitar', chartView: 'chords' },
    { name: 'Electric Guitar', chartView: 'nashville' },
    { name: 'Bass', chartView: 'nashville' },
    { name: 'Keys', chartView: 'chords' },
    { name: 'Drums', chartView: 'lyrics' },
    { name: 'FOH Audio', chartView: 'lyrics' },
    { name: 'Lyrics / ProPresenter', chartView: 'lyrics' },
    { name: 'Lighting', chartView: 'lyrics' },
  ],
};

// Public-domain hymns so the hub is usable (and demoable) on first launch.
const HYMNS: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Amazing Grace', author: 'John Newton', defaultKey: 'G', bpm: 72, timeSignature: '3/4',
    defaultArrangement: ['V1', 'V2', 'V3', 'V4'],
    chordPro: `{title: Amazing Grace}
{key: G}
Verse 1
A[G]mazing grace, how [G7]sweet the [C]sound
That [G]saved a wretch like [D]me
I [G]once was lost, but [G7]now am [C]found
Was [G]blind, but [D]now I [G]see

Verse 2
'Twas [G]grace that taught my [G7]heart to [C]fear
And [G]grace my fears re[D]lieved
How [G]precious did that [G7]grace ap[C]pear
The [G]hour I [D]first be[G]lieved

Verse 3
Through [G]many dangers, [G7]toils and [C]snares
I [G]have already [D]come
'Tis [G]grace hath brought me [G7]safe thus [C]far
And [G]grace will [D]lead me [G]home

Verse 4
When [G]we've been there ten [G7]thousand [C]years
Bright [G]shining as the [D]sun
We've [G]no less days to [G7]sing God's [C]praise
Than [G]when we'd [D]first be[G]gun`,
  },
  {
    title: 'Come Thou Fount', author: 'Robert Robinson', defaultKey: 'D', bpm: 92, timeSignature: '3/4',
    defaultArrangement: ['V1', 'V2', 'V3'],
    chordPro: `{title: Come Thou Fount}
{key: D}
Verse 1
[D]Come thou fount of [G]every [D]blessing
Tune my [Bm]heart to [Em]sing thy [A]grace
[D]Streams of mercy [G]never [D]ceasing
Call for [Bm]songs of [A]loudest [D]praise
[D]Teach me some me[A]lodious [Bm]sonnet
[G]Sung by [D]flaming [Em]tongues a[A]bove
[D]Praise the mount, I'm [G]fixed up[D]on it
Mount of [Bm]thy re[A]deeming [D]love

Verse 2
[D]Here I raise my [G]Eben[D]ezer
Hither [Bm]by thy [Em]help I'm [A]come
[D]And I hope by [G]thy good [D]pleasure
Safely [Bm]to ar[A]rive at [D]home
[D]Jesus sought me [A]when a [Bm]stranger
[G]Wandering [D]from the [Em]fold of [A]God
[D]He to rescue [G]me from [D]danger
Interp[Bm]osed his [A]precious [D]blood

Verse 3
[D]O to grace how [G]great a [D]debtor
Daily [Bm]I'm con[Em]strained to [A]be
[D]Let thy goodness [G]like a [D]fetter
Bind my [Bm]wandering [A]heart to [D]thee
[D]Prone to wander, [A]Lord I [Bm]feel it
[G]Prone to [D]leave the [Em]God I [A]love
[D]Here's my heart, O [G]take and [D]seal it
Seal it [Bm]for thy [A]courts a[D]bove`,
  },
  {
    title: 'It Is Well With My Soul', author: 'Horatio Spafford', defaultKey: 'C', bpm: 68, timeSignature: '4/4',
    defaultArrangement: ['V1', 'C', 'V2', 'C', 'V3', 'C'],
    chordPro: `{title: It Is Well With My Soul}
{key: C}
Verse 1
When [C]peace like a [F]river at[C]tendeth my way
When [Am]sorrows like [D7]sea billows [G]roll
What[C]ever my [F]lot, thou hast [C]taught me to [Am]say
It is [C]well, it is [G7]well with my [C]soul

Verse 2
Though [C]Satan should [F]buffet, though [C]trials should come
Let [Am]this blest as[D7]surance con[G]trol
That [C]Christ has re[F]garded my [C]helpless es[Am]tate
And hath [C]shed his own [G7]blood for my [C]soul

Verse 3
My [C]sin, oh the [F]bliss of this [C]glorious thought
My [Am]sin, not in [D7]part but the [G]whole
Is [C]nailed to the [F]cross, and I [C]bear it no [Am]more
Praise the [C]Lord, praise the [G7]Lord, O my [C]soul

Chorus
It is [G]well, [G7]with my [C]soul
It is [F]well, it is [G]well with my [C]soul`,
  },
];

export function seed(store: Store): void {
  if (!store.settings.get('settings')) store.settings.put(DEFAULT_SETTINGS);
  if (store.songs.count() > 0) return;

  const now = new Date().toISOString();
  const songs = HYMNS.map((h) => store.songs.put({ ...h, id: uid(), createdAt: now, updatedAt: now }));

  const people: Person[] = [
    { id: uid(), name: 'Sam Leader', email: 'sam@example.com', positions: ['Worship Leader', 'Acoustic Guitar'] },
    { id: uid(), name: 'Jordan Keys', email: 'jordan@example.com', positions: ['Keys', 'Vocals'] },
    { id: uid(), name: 'Riley Bass', positions: ['Bass'] },
    { id: uid(), name: 'Casey Tech', positions: ['FOH Audio', 'Lighting', 'Lyrics / ProPresenter'] },
  ].map((p) => store.people.put(p));

  const sunday = new Date();
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));
  sunday.setHours(10, 0, 0, 0);

  const service: Service = {
    id: uid(),
    title: 'Sunday Gathering',
    date: sunday.toISOString(),
    createdAt: now,
    updatedAt: now,
    items: [
      { id: uid(), kind: 'header', title: 'Pre-Service', durationSec: 0 },
      { id: uid(), kind: 'element', title: 'Welcome', durationSec: 180, lightingCue: 'Bright warm house wash, stage at 60%' },
      { id: uid(), kind: 'header', title: 'Worship', durationSec: 0 },
      { id: uid(), kind: 'song', title: songs[1].title, songId: songs[1].id, key: 'D', durationSec: 270,
        lightingCue: 'Upbeat: warm amber front, slow cyan sweeps on the back truss' },
      { id: uid(), kind: 'song', title: songs[0].title, songId: songs[0].id, key: 'G', durationSec: 300,
        lightingCue: 'Intimate: deep blue wash, single white special on the leader, haze' },
      { id: uid(), kind: 'song', title: songs[2].title, songId: songs[2].id, key: 'D', durationSec: 330 },
      { id: uid(), kind: 'header', title: 'Message', durationSec: 0 },
      { id: uid(), kind: 'element', title: 'Sermon', durationSec: 2100 },
    ],
    assignments: [
      { id: uid(), personId: people[0].id, position: 'Worship Leader', status: 'accepted' },
      { id: uid(), personId: people[1].id, position: 'Keys', status: 'pending' },
      { id: uid(), personId: people[2].id, position: 'Bass', status: 'accepted' },
      { id: uid(), personId: people[3].id, position: 'FOH Audio', status: 'accepted' },
    ],
  };
  store.services.put(service);
}
