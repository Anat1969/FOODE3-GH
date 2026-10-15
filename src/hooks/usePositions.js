import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, write } from '../supabase.js';

export const ASHDOD_CENTER = { x: 34.6415, y: 31.8014 };

// camelCase field -> db column
const FIELD_MAP = {
  number: 'number',
  positionName: 'position_name',
  complexName: 'complex_name',
  businessName: 'business_name',
  ownerName: 'owner_name',
  water: 'water',
  electricity: 'electricity',
  sewage: 'sewage',
  buildingQuality: 'building_quality',
  environmentQuality: 'environment_quality',
  approval: 'approval',
  status: 'status',
  notes: 'notes',
  foodTruckImageUrl: 'food_truck_image_url',
  foodTruckImageAlt: 'food_truck_image_alt',
  developerName: 'developer_name',
  developerEmail: 'developer_email',
  developerPhone: 'developer_phone',
  harmonicaStatus: 'harmonica_status',
  harmonicaApprovedAt: 'harmonica_approved_at',
  harmonicaApprovedBy: 'harmonica_approved_by',
};

function toDb(changes) {
  const out = {};
  for (const [k, v] of Object.entries(changes)) {
    if (k === 'mapPin') {
      out.map_pin_x = v.x;
      out.map_pin_y = v.y;
    } else if (FIELD_MAP[k]) {
      out[FIELD_MAP[k]] = k === 'harmonicaApprovedAt' && !v ? null : v;
    }
  }
  return out;
}

export function fromRow(r) {
  const p = { id: r.id, mapPin: { x: r.map_pin_x, y: r.map_pin_y }, updatedAt: r.updated_at };
  for (const [k, col] of Object.entries(FIELD_MAP)) p[k] = r[col] ?? '';
  return p;
}

const byNumber = (a, b) => Number(a.number) - Number(b.number) || String(a.number).localeCompare(String(b.number));

export default function usePositions({ onError } = {}) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState({ pending: 0, at: null, error: null });
  const pendingRef = useRef({}); // id -> { changes, timer }
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('foode_positions').select('*');
    if (!error && data) setPositions(data.map(fromRow).sort(byNumber));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('foode-positions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foode_positions' }, ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE' || row?.deleted_at) {
          const id = old?.id || row?.id;
          setPositions(prev => prev.filter(p => p.id !== id));
          return;
        }
        if (pendingRef.current[row.id]) return; // local edits in flight win
        setPositions(prev => {
          const next = prev.some(p => p.id === row.id)
            ? prev.map(p => (p.id === row.id ? fromRow(row) : p))
            : [...prev, fromRow(row)];
          return next.sort(byNumber);
        });
      })
      .subscribe();
    // Removals are not pushed to other viewers, so refresh when the tab comes back.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const flush = useCallback(async (id) => {
    const entry = pendingRef.current[id];
    if (!entry) return;
    delete pendingRef.current[id];
    try {
      await write('positions', 'upsert', id, toDb(entry.changes));
      setSaveState(s => ({ pending: Math.max(0, s.pending - 1), at: new Date(), error: null }));
    } catch (err) {
      setSaveState(s => ({ pending: Math.max(0, s.pending - 1), at: s.at, error: err.message }));
      onErrorRef.current?.(err);
      load();
    }
  }, [load]);

  // Optimistic local update, debounced save per position.
  const update = useCallback((id, changes) => {
    setPositions(prev => prev.map(p => (p.id === id ? { ...p, ...changes } : p)));
    const entry = pendingRef.current[id];
    if (entry) {
      clearTimeout(entry.timer);
      entry.changes = { ...entry.changes, ...changes };
    } else {
      pendingRef.current[id] = { changes: { ...changes } };
      setSaveState(s => ({ ...s, pending: s.pending + 1 }));
    }
    pendingRef.current[id].timer = setTimeout(() => flush(id), 450);
  }, [flush]);

  const add = useCallback(() => {
    const id = crypto.randomUUID();
    const maxNum = positions.reduce((m, p) => Math.max(m, Number(p.number) || 0), 0);
    const newPos = {
      id,
      number: String(maxNum + 1),
      positionName: 'עמדה חדשה',
      complexName: '',
      businessName: '',
      ownerName: '',
      water: 'טוב',
      electricity: 'טוב',
      sewage: 'טוב',
      buildingQuality: 'אין מבנה',
      environmentQuality: 'שמורה',
      approval: 'בבדיקה',
      status: 'בבדיקה',
      notes: '',
      foodTruckImageUrl: '',
      foodTruckImageAlt: '',
      developerName: '',
      developerEmail: '',
      developerPhone: '',
      harmonicaStatus: 'לא הוגשה',
      harmonicaApprovedAt: '',
      harmonicaApprovedBy: '',
      mapPin: { ...ASHDOD_CENTER },
    };
    setPositions(prev => [...prev, newPos].sort(byNumber));
    write('positions', 'upsert', id, toDb(newPos)).catch(err => { onErrorRef.current?.(err); load(); });
    return id;
  }, [positions, load]);

  const remove = useCallback((id) => {
    setPositions(prev => prev.filter(p => p.id !== id));
    write('positions', 'remove', id).catch(err => { onErrorRef.current?.(err); load(); });
  }, [load]);

  return { positions, update, add, remove, loading, saveState };
}
