import { useState, useEffect } from 'react';
import TopBar from './components/TopBar.jsx';
import StatsRail from './components/StatsRail.jsx';
import PositionsTable from './components/PositionsTable.jsx';
import DetailsPanel from './components/DetailsPanel.jsx';
import MapPage from './components/MapPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import usePositions from './hooks/usePositions.js';

export default function App() {
  const [page, setPage] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const { positions, update, add, remove, duplicate } = usePositions();

  const selected = positions.find(p => p.id === selectedId) || null;

  useEffect(() => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString('he-IL'));
  }, [positions]);

  const goPin = (id) => {
    setSelectedId(id);
    setPinningId(id);
    setPage('map');
  };

  return (
    <div className="app-shell">
      <TopBar page={page} setPage={setPage} lastSaved={lastSaved} />
      <StatsRail positions={positions} />
      <main className="main-area">
        {page === 'list' && (
          <div className="list-layout">
            <PositionsTable
              positions={positions}
              update={update}
              add={add}
              remove={remove}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setPage={setPage}
              setPinningId={setPinningId}
            />
            <DetailsPanel
              selected={selected}
              update={update}
              remove={remove}
              duplicate={duplicate}
              goPin={goPin}
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
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
