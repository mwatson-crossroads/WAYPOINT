import type { Person, Service, Settings, Song } from '@hub/core';
import { Collection, openDb } from './db';

export function createStore(file: string) {
  const db = openDb(file);
  return {
    songs: new Collection<Song>(db, 'songs'),
    services: new Collection<Service>(db, 'services'),
    people: new Collection<Person>(db, 'people'),
    settings: new Collection<Settings>(db, 'settings'),
  };
}
export type Store = ReturnType<typeof createStore>;
