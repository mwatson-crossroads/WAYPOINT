import type { Person, Service, ServiceBundle, Settings, Song } from '@hub/core';

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status} ${await res.text()}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

function resource<T extends { id: string }>(base: string) {
  return {
    list: () => req<T[]>('GET', base),
    get: (id: string) => req<T>('GET', `${base}/${id}`),
    create: (body: Partial<T>) => req<T>('POST', base, body),
    update: (id: string, body: Partial<T>) => req<T>('PUT', `${base}/${id}`, body),
    remove: (id: string) => req<void>('DELETE', `${base}/${id}`),
  };
}

export const api = {
  songs: resource<Song>('/api/songs'),
  services: resource<Service>('/api/services'),
  people: resource<Person>('/api/people'),
  bundle: (serviceId: string) => req<ServiceBundle>('GET', `/api/services/${serviceId}/bundle`),
  settings: {
    get: () => req<Settings>('GET', '/api/settings'),
    update: (body: Partial<Settings>) => req<Settings>('PUT', '/api/settings', body),
  },
};
