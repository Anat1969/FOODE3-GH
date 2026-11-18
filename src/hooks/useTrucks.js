import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, write } from '../supabase.js';

const fromRow = (r) => ({
  id: r.id,
  number: r.number,
  ownerName: r.owner_name,
  businessLabel: r.business_label,
  location: r.location,
  ownerType: r.owner_type,
  phone: r.phone,
  startDate: r.start_date,
  endDate: r.end_date,
  optionUntil: r.option_until,
  status: r.status,
  positionId: r.position_id,
});

const toDb = {
  ownerName: 'owner_name', businessLabel: 'business_label', location: 'location',
  ownerType: 'owner_type', phone: 'phone', startDate: 'start_date', endDate: 'end_date',
  optionUntil: 'option_until', status: 'status', number: 'number', positionId: 'position_id',
};

export default function useTrucks({ onError } = {}) {
  const [trucks, setTrucks] = useState([]);
  const pending = useRef(new Map());
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const reload = useRef(() => {});

  useEffect(() => {
    const load = () =>
      supabase.from('foode_trucks').select('*').is('deleted_at', null).then(({ data }) => {
        if (data) setTrucks(data.map(fromRow).sort((a, b) => Number(a.number) - Number(b.number)));
      });
    reload.current = load;
    load();
    const channel = supabase
      .channel('trucks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foode_trucks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Every write goes through foode_write (editor key), like positions: the table has public read only,
  // so a direct update from the browser is silently refused. Changes to one row are merged and sent after a short pause.
  const update = useCallback((id, changes) => {
    const db = {};
    for (const k of Object.keys(changes)) if (toDb[k]) db[toDb[k]] = changes[k] === '' && k.endsWith('Date') ? null : changes[k];
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    const entry = pending.current.get(id) || { data: {}, timer: null };
    entry.data = { ...entry.data, ...db };
    clearTimeout(entry.timer);
    entry.timer = setTimeout(async () => {
      pending.current.delete(id);
      try { await write('trucks', 'upsert', id, entry.data); }
      catch (err) { onErrorRef.current?.(err); reload.current(); }
    }, 450);
    pending.current.set(id, entry);
  }, []);

  return { trucks, update };
}
