import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from './components/TopBar.jsx';
import StatsRail from './components/StatsRail.jsx';
import PositionsTable from './components/PositionsTable.jsx';
import PositionCard, { CARD_TABS } from './components/PositionCard.jsx';
import MapPage from './components/MapPage.jsx';
import ActionReportPage from './components/ActionReportPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import LinksViewer from './components/LinksViewer.jsx';
import ExamplesPage from './components/ExamplesPage.jsx';
import PolicyViewer from './components/PolicyViewer.jsx';
import HomePage from './components/HomePage.jsx';
import usePositions from './hooks/usePositions.js';
import useRecords from './hooks/useRecords.js';
import { checkEditor, getEditorKey } from './supabase.js';

const PAGES = ['home', 'list', 'map', 'report', 'examples', 'links', 'policy', 'settings'];
const TAB_IDS = CARD_TABS.map(t => t[0]);

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const page = PAGES.includes(q.get('p')) ? q.get('p') : 'home';
  const tab = TAB_IDS.includes(q.get('tab')) ? q.get('tab') : 'details';
  return { page, pos: q.get('pos') || null, tab, filter: q.get('f') || null };
}

function buildUrl({ page, pos, tab, filter }) {
  const q = new URLSearchParams();
  if (page && page !== 'home') q.set('p', page);
  if (filter) q.set('f', filter);
  if (pos) {
    q.set('pos', pos);
    if (tab && tab !== 'details') q.set('tab', tab);
  }
  const s = q.toString();
  return window.location.pathname + (s ? `?${s}` : '');
}

function readTheme() {
  try { return localStorage.getItem('foode3-theme') || 'dark'; } catch { return 'dark'; }
}

export default function App() {
  const initial = useMemo(readUrl, []);
  const [page, setPage] = useState(initial.page);
  const [cardId, setCardId] = useState(initial.pos);
  const [cardTab, setCardTab] = useState(initial.tab);
  const [statsFilter, setStatsFilter] = useState(initial.filter);
  const [pinningId, setPinningId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [theme, setTheme] = useState(readTheme);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [toasts, setToasts] = useState([]);
  const skipPush = useRef(true);

  const notify = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, text, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  const onError = useCallback((err) => {
    notify(err?.message === 'not_authorized' ? 'אין הרשאת עריכה. יש להיכנס דרך קישור העריכה.' : `השמירה נכשלה: ${err?.message || ''}`, 'error');
  }, [notify]);

  const { positions, update, add, remove, loading, saveState } = usePositions({ onError });
  const docs = useRecords('documents', { onError });
  const events = useRecords('position_events', { onError });

  useEffect(() => { checkEditor().then(setEditor); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('foode3-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  // Keep the address bar in sync, so "copy link" and the back button reflect what is on screen.
  useEffect(() => {
    const url = buildUrl({ page, pos: cardId, tab: cardTab, filter: page === 'list' ? statsFilter : null });
    if (url === window.location.pathname + window.location.search) return;
    if (skipPush.current) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    skipPush.current = false;
  }, [page, cardId, cardTab, statsFilter]);

  useEffect(() => {
    const onPop = () => {
      const s = readUrl();
      skipPush.current = true;
      setPage(s.page); setCardId(s.pos); setCardTab(s.tab); setStatsFilter(s.filter);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((p) => {
    setPage(p);
    setCardId(null);
    setPinningId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openCard = useCallback((id, tab = 'details') => {
    setCardId(id);
    setCardTab(tab);
  }, []);

  const filterTo = useCallback((f) => {
    setStatsFilter(f === 'all' ? null : f);
    setCardId(null);
    setPage('list');
  }, []);

  const changeApproval = useCallback((id, value) => {
    const prev = positions.find(p => p.id === id)?.approval;
    if (prev === value) return;
    update(id, { approval: value, status: value });
    if (getEditorKey()) {
      events.save(crypto.randomUUID(), { position_id: id, kind: 'status', body: `סטטוס מיקום שונה מ"${prev || "ללא"}" ל"${value}"`, author: editor || '' }).catch(() => {});
    }
  }, [positions, update, events, editor]);

  const startPin = useCallback((id) => {
    setPinningId(id);
    setCardId(null);
    setPage('map');
  }, []);

  const showOnMap = useCallback((id) => {
    setFocusId(id);
    setCardId(null);
    setPage('map');
  }, []);

  const onPinned = useCallback((id) => {
    setFocusId(id);
    openCard(id, 'details');
  }, [openCard]);


  const filteredPositions = useMemo(() => {
    if (!statsFilter) return positions;
    if (statsFilter.startsWith('complex:')) {
      const name = statsFilter.slice(8);
      return positions.filter(p => (p.complexName || 'ללא מתחם') === name);
    }
    return positions.filter(p => {
      if (statsFilter === 'approved') return p.approval === 'מיקום מקובל';
      if (statsFilter === 'pending') return p.approval === 'בבדיקה';
      if (statsFilter === 'rejected') return p.approval === 'מיקום לא מקובל';
      if (statsFilter === 'harmonica') return p.harmonicaStatus === 'הוגשה';
      return true;
    });
  }, [positions, statsFilter]);

  const openCorrectionsById = useMemo(() => events.rows.reduce((m, e) => {
    if (e.kind === 'correction' && !e.resolved) m[e.position_id] = (m[e.position_id] || 0) + 1;
    return m;
  }, {}), [events.rows]);

  const cardPosition = cardId ? positions.find(p => p.id === cardId) : null;
  const cardLink = useCallback((tab) => {
    const url = new URL(window.location.origin + buildUrl({ page: page === 'home' ? 'list' : page, pos: cardId, tab }));
    return url.toString();
  }, [page, cardId]);


  return (
    <div className="app-shell">
      <TopBar
        page={page}
        go={go}
        editor={editor}
        saveState={saveState}
        onEditorChange={setEditor}
      />

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>טוען נתונים…</p></div>
      ) : (
        <main className={`main-area page-${page}`}>
          {page === 'home' && <HomePage positions={positions} events={events.rows} go={go} openCard={openCard} filterTo={filterTo} />}
          {page === 'list' && (
            <>
              <StatsRail positions={positions} activeFilter={statsFilter} onFilter={(f) => setStatsFilter(prev => (prev === f ? null : f))} />
              <PositionsTable
                positions={filteredPositions}
                allPositions={positions}
                update={update}
                changeApproval={changeApproval}
                add={add}
                selectedId={cardId}
                openCard={openCard}
                canEdit={Boolean(editor)}
                statsFilter={statsFilter}
                onClearFilter={() => setStatsFilter(null)}
                openCorrectionsById={openCorrectionsById}
              />
            </>
          )}
          {page === 'map' && (
            <MapPage
              positions={positions}
              update={update}
              selectedId={cardId}
              openCard={openCard}
              pinningId={pinningId}
              setPinningId={setPinningId}
              onPinned={onPinned}
              focusId={focusId}
              canEdit={Boolean(editor)}
            />
          )}
          {page === 'report' && <ActionReportPage positions={positions} openCard={openCard} />}
          {page === 'examples' && <ExamplesPage editMode={Boolean(editor)} onError={onError} />}
          {page === 'links' && <LinksViewer iframeUrl={iframeUrl} setIframeUrl={setIframeUrl} canEdit={Boolean(editor)} onError={onError} />}
          {page === 'policy' && <PolicyViewer />}
          {page === 'settings' && <SettingsPage theme={theme} setTheme={setTheme} editor={editor} />}
        </main>
      )}

      <AnimatePresence>
        {cardPosition && (
            <motion.div
              key="scrim"
              className="card-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardId(null)}
            />
        )}
        {cardPosition && (
            <PositionCard
              key={cardPosition.id}
              position={cardPosition}
              editor={editor}
              docs={docs.rows.filter(d => d.position_id === cardPosition.id)}
              events={events.rows.filter(e => e.position_id === cardPosition.id)}
              tab={cardTab}
              setTab={setCardTab}
              onClose={() => setCardId(null)}
              update={update}
              changeApproval={changeApproval}
              remove={remove}
              saveDoc={docs.save}
              removeDoc={docs.remove}
              saveEvent={events.save}
              removeEvent={events.remove}
              onPin={startPin}
              onShowOnMap={showOnMap}
              notify={notify}
              cardLink={cardLink}
            />
        )}
      </AnimatePresence>

      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} className={`toast ${t.kind}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
