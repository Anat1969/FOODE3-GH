import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

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

export default function useTrucks() {
  const [trucks, setTrucks] = useState([]);

  useEffect(() => {
    const load = () =>
      supabase.from('foode_trucks').select('*').is('deleted_at', null).then(({ data }) => {
        if (data) setTrucks(data.map(fromRow).sort((a, b) => Number(a.number) - Number(b.number)));
      });
    load();
    const channel = supabase
      .channel('trucks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foode_trucks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const update = useCallback((id, changes) => {
    const db = { updated_at: new Date().toISOString() };
    for (const k of Object.keys(changes)) if (toDb[k]) db[toDb[k]] = changes[k] === '' && k.endsWith('Date') ? null : changes[k];
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    supabase.from('foode_trucks').update(db).eq('id', id).then();
  }, []);

  return { trucks, update };
}
