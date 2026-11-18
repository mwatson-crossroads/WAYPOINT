import { api } from '../api';
import { useLoad } from '../hooks';
import type { Person } from '@hub/core';

export function PeoplePage() {
  const [people, reload] = useLoad(() => api.people.list(), []);
  const [settings] = useLoad(() => api.settings.get(), []);
  const positions = settings?.positions.map((p) => p.name) ?? [];

  const save = async (p: Person, patch: Partial<Person>) => { await api.people.update(p.id, patch); reload(); };

  return (
    <div className="page">
      <header className="page-head">
        <h1>People</h1>
        <button className="primary" onClick={async () => { await api.people.create({ name: 'New Volunteer' }); reload(); }}>
          + Add volunteer
        </button>
      </header>
      <div className="list">
        {(people ?? []).map((p) => (
          <div key={p.id} className="card person">
            <div className="row gap wrap">
              <input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && save(p, { name: e.target.value })} />
              <input placeholder="Email" defaultValue={p.email ?? ''} onBlur={(e) => save(p, { email: e.target.value || undefined })} />
              <input placeholder="Phone" defaultValue={p.phone ?? ''} onBlur={(e) => save(p, { phone: e.target.value || undefined })} />
              <span className="grow" />
              <button className="icon" title="Remove" onClick={async () => {
                if (confirm(`Remove ${p.name}?`)) { await api.people.remove(p.id); reload(); }
              }}>✕</button>
            </div>
            <div className="chips">
              {positions.map((pos) => {
                const on = p.positions.includes(pos);
                return (
                  <button key={pos} className={`chip ${on ? 'on' : ''}`}
                    onClick={() => save(p, { positions: on ? p.positions.filter((x) => x !== pos) : [...p.positions, pos] })}>
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
