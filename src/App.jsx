import { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar.jsx';
import StatsRail from './components/StatsRail.jsx';
import PositionsTable from './components/PositionsTable.jsx';
import DetailsPanel from './components/DetailsPanel.jsx';
import MapPage from './components/MapPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import LinksViewer from './components/LinksViewer.jsx';
import ExamplesPage from './components/ExamplesPage.jsx';
import PolicyViewer from './components/PolicyViewer.jsx';
import usePositions from './hooks/usePositions.js';

export default function App() {
  const [page, setPage] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [statsFilter, setStatsFilter] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('foode3-theme') || 'dark');
  const [showPolicy, setShowPolicy] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(null);
  const { positions, update, add, remove, duplicate, loading } = usePositions();

  const selected = positions.find(p => p.id === selectedId) || null;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foode3-theme', theme);
  }, [theme]);

  useEffect(() => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString('he-IL'));
  }, [positions]);

  const goPin = (id) => {
    setSelectedId(id);
    setPinningId(id);
    setPage('map');
  };

  const handleStatsFilter = useCallback((filter) => {
    setStatsFilter(prev => prev === filter ? null : filter);
    if (page !== 'list') setPage('list');
  }, [page]);

  const filteredPositions = statsFilter
    ? positions.filter(p => {
        if (statsFilter === 'approved') return p.approval === 'מקובלת';
        if (statsFilter === 'pending') return p.approval === 'בבדיקה';
        if (statsFilter === 'rejected') return p.approval === 'לא מקובלת';
        return true;
      })
    : positions;

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>טוען נתונים…</p></div>;

  return (
    <div className="app-shell">
      <TopBar
        page={page}
        setPage={setPage}
        lastSaved={lastSaved}
        editMode={editMode}
        setEditMode={setEditMode}
        onShowPolicy={() => setShowPolicy(true)}
      />
      <StatsRail
        positions={positions}
        activeFilter={statsFilter}
        onFilter={handleStatsFilter}
      />
      <main className="main-area">
        {page === 'list' && (
          <div className="list-layout">
            <DetailsPanel
              selected={selected}
              update={update}
              remove={remove}
              duplicate={duplicate}
              goPin={goPin}
              onClose={() => setSelectedId(null)}
              editMode={editMode}
            />
            <PositionsTable
              positions={filteredPositions}
              allPositions={positions}
              update={update}
              add={add}
              remove={remove}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setPage={setPage}
              setPinningId={setPinningId}
              editMode={editMode}
              statsFilter={statsFilter}
              onClearFilter={() => setStatsFilter(null)}
            />
          </div>
        )}
        {page === 'map' && (
          <MapPage
            positions={positions}
            update={update}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            pinningId={pinningId}
            setPinningId={setPinningId}
          />
        )}
        {page === 'reports' && <ReportsPage positions={positions} />}
        {page === 'examples' && <ExamplesPage editMode={editMode} />}
        {page === 'links' && <LinksViewer iframeUrl={iframeUrl} setIframeUrl={setIframeUrl} />}
        {page === 'settings' && <SettingsPage theme={theme} setTheme={setTheme} />}
      </main>
      {showPolicy && <PolicyViewer onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
