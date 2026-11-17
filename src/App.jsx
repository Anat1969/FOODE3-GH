import { useState, useEffect } from 'react';
import TopBar from './components/TopBar.jsx';
import HomePage from './components/HomePage.jsx';
import PositionsTable from './components/PositionsTable.jsx';
import PositionCard from './components/PositionCard.jsx';
import MapPage from './components/MapPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import usePositions from './hooks/usePositions.js';
import useTrucks from './hooks/useTrucks.js';
import TrucksPage from './components/TrucksPage.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const { positions: allPositions, update, add, remove, duplicate, loading } = usePositions();
  const [query, setQuery] = useState('');

  const { trucks: allTrucks, update: updateTruck } = useTrucks();
  const q = query.trim();
  const has = (...vals) => vals.some(v => String(v ?? '').includes(q));
  const positions = q ? allPositions.filter(p => has(p.number, p.positionName, p.complexName, p.businessName, p.notes, p.approval)) : allPositions;
  const trucks = q ? allTrucks.filter(t => has(t.number, t.ownerName, t.businessLabel, t.location, t.ownerType, t.phone, t.status)) : allTrucks;
  const selected = allPositions.find(p => p.id === selectedId) || null;

  useEffect(() => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString('he-IL'));
  }, [positions]);

  const goPin = (id) => {
    setSelectedId(id);
    setPinningId(id);
    setPage('map');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>טוען נתונים…</p></div>;

  return (
    <div className="app-shell">
      <TopBar page={page} setPage={setPage} lastSaved={lastSaved} editMode={editMode} setEditMode={setEditMode} query={query} setQuery={setQuery} found={q ? positions.length + trucks.length : null} />
      <main className="main-area">
        {page === 'home' && (
          <HomePage positions={allPositions} trucks={allTrucks} setPage={setPage}
            mapProps={{ update, remove, duplicate, selectedId, setSelectedId, pinningId, setPinningId, trucks: allTrucks, editMode, setPage }} />
        )}
        {page === 'list' && (
          <div className="list-layout">
            <PositionCard
              position={selected}
              trucks={allTrucks}
              update={update}
              remove={remove}
              duplicate={duplicate}
              onPin={goPin}
              onClose={() => setSelectedId(null)}
              editMode={editMode}
              setPage={setPage}
            />
            <PositionsTable
              positions={positions}
              update={update}
              add={add}
              remove={remove}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setPage={setPage}
              setPinningId={setPinningId}
              editMode={editMode}
            />
          </div>
        )}
        {page === 'map' && (
          <MapPage
            positions={positions}
            update={update}
            remove={remove}
            duplicate={duplicate}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            pinningId={pinningId}
            setPinningId={setPinningId}
            trucks={allTrucks}
            editMode={editMode}
            setPage={setPage}
          />
        )}
        {page === 'trucks' && <TrucksPage trucks={trucks} update={updateTruck} positions={allPositions} editMode={editMode} />}
        {page === 'reports' && <ReportsPage positions={positions} />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
