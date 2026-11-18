import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDuration } from '@hub/core';
import { api } from '../api';
import { useLoad } from '../hooks';

function nextSundayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
}

export function ServicesPage() {
  const [services] = useLoad(() => api.services.list(), []);
  const [title, setTitle] = useState('Sunday Gathering');
  const [date, setDate] = useState(nextSundayLocal());
  const nav = useNavigate();

  const create = async () => {
    const s = await api.services.create({ title, date: new Date(date).toISOString() });
    nav(`/services/${s.id}`);
  };

  const sorted = [...(services ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="page">
      <header className="page-head"><h1>Services</h1></header>
      <div className="card row gap">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Service title" />
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="primary" onClick={create}>+ New service</button>
      </div>
      <div className="list">
        {sorted.map((s) => {
          const songs = s.items.filter((i) => i.kind === 'song').length;
          const total = s.items.reduce((n, i) => n + i.durationSec, 0);
          return (
            <Link key={s.id} to={`/services/${s.id}`} className="list-row">
              <div>
                <strong>{s.title}</strong>
                <div className="muted">{new Date(s.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</div>
              </div>
              <div className="muted">{songs} songs · {formatDuration(total)} · {s.assignments.length} scheduled</div>
            </Link>
          );
        })}
        {services && !services.length && <p className="muted">No services yet.</p>}
      </div>
    </div>
  );
}
