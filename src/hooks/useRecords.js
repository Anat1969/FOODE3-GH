import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, write } from '../supabase.js';

// All rows of a small foode_ table, kept live. table: 'documents' | 'position_events' | 'links' | 'examples'
export default function useRecords(table, { onError, order = 'created_at' } = {}) {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const dbTable = `foode_${table}`;

  const sort = useCallback(list => [...list].sort((a, b) => String(a[order]).localeCompare(String(b[order]))), [order]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(dbTable).select('*');
    if (!error && data) setRows(sort(data));
    setLoaded(true);
  }, [dbTable, sort]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`${dbTable}-live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: dbTable }, ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE' || row?.deleted_at) {
          const id = old?.id || row?.id;
          setRows(prev => prev.filter(r => r.id !== id));
          return;
        }
        setRows(prev => sort(prev.some(r => r.id === row.id) ? prev.map(r => (r.id === row.id ? row : r)) : [...prev, row]));
      })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dbTable, load, sort]);

  const save = useCallback(async (id, data) => {
    const optimistic = { ...data, id, created_at: data.created_at || new Date().toISOString() };
    setRows(prev => sort(prev.some(r => r.id === id) ? prev.map(r => (r.id === id ? { ...r, ...data } : r)) : [...prev, optimistic]));
    try {
      const row = await write(table, 'upsert', id, data);
      if (row) setRows(prev => sort(prev.map(r => (r.id === id ? row : r))));
      return row;
    } catch (err) {
      onErrorRef.current?.(err);
      load();
      throw err;
    }
  }, [table, load, sort]);

  const remove = useCallback(async (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
    try {
      await write(table, 'remove', id);
    } catch (err) {
      onErrorRef.current?.(err);
      load();
    }
  }, [table, load]);

  return { rows, loaded, save, remove };
}
