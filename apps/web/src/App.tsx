import { NavLink, Route, Routes } from 'react-router-dom';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceEditor } from './pages/ServiceEditor';
import { SongsPage } from './pages/SongsPage';
import { PeoplePage } from './pages/PeoplePage';
import { SettingsPage } from './pages/SettingsPage';
import { ChartsPage } from './pages/ChartsPage';
import { PresenterPage } from './pages/PresenterPage';
import { OutputPage } from './pages/OutputPage';
import { StagePage } from './pages/StagePage';

const NAV = [
  { to: '/', label: 'Services', end: true },
  { to: '/songs', label: 'Songs' },
  { to: '/people', label: 'People' },
  { to: '/settings', label: 'Settings' },
];

const SOON = ['Playback', 'Lighting'];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">Production<span>Hub</span></div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>
        ))}
        <div className="nav-group">Coming next</div>
        {SOON.map((s) => <span key={s} className="nav-soon">{s}</span>)}
        <div className="nav-group">Outputs</div>
        <a href="/output" target="hubOutput">Audience output ↗</a>
        <a href="/stage" target="hubStage">Stage display ↗</a>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      {/* Full-screen views without the app chrome */}
      <Route path="/output" element={<OutputPage />} />
      <Route path="/stage" element={<StagePage />} />
      <Route path="/services/:id/present" element={<PresenterPage />} />
      <Route path="/services/:id/charts" element={<ChartsPage />} />
      <Route path="*" element={
        <Shell>
          <Routes>
            <Route path="/" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceEditor />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/songs/:id" element={<SongsPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Shell>
      } />
    </Routes>
  );
}
