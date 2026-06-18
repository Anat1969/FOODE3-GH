import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

function toRow(p) {
  return {
    id: p.id,
    number: p.number,
    position_name: p.positionName ?? p.position_name,
    complex_name: p.complexName ?? p.complex_name,
    business_name: p.businessName ?? p.business_name,
    water: p.water,
    electricity: p.electricity,
    sewage: p.sewage,
    business_license: p.businessLicense ?? p.business_license,
    traffic: p.traffic,
    waste: p.waste,
    accessibility: p.accessibility,
    lighting: p.lighting,
    building_quality: p.buildingQuality ?? p.building_quality,
    environment_quality: p.environmentQuality ?? p.environment_quality,
    approval: p.approval,
    status: p.status,
    notes: p.notes ?? '',
    map_pin_x: p.mapPin?.x ?? p.map_pin_x ?? 50,
    map_pin_y: p.mapPin?.y ?? p.map_pin_y ?? 50,
    food_truck_image_url: p.foodTruckImageUrl ?? p.food_truck_image_url ?? '',
    food_truck_image_alt: p.foodTruckImageAlt ?? p.food_truck_image_alt ?? '',
  };
}

function fromRow(r) {
  return {
    id: r.id,
    number: r.number,
    positionName: r.position_name,
    complexName: r.complex_name,
    businessName: r.business_name,
    water: r.water,
    electricity: r.electricity,
    sewage: r.sewage,
    businessLicense: r.business_license,
    traffic: r.traffic,
    waste: r.waste,
    accessibility: r.accessibility,
    lighting: r.lighting,
    buildingQuality: r.building_quality,
    environmentQuality: r.environment_quality,
    approval: r.approval,
    status: r.status,
    notes: r.notes,
    mapPin: { x: r.map_pin_x, y: r.map_pin_y },
    foodTruckImageUrl: r.food_truck_image_url,
    foodTruckImageAlt: r.food_truck_image_alt,
  };
}

export default function usePositions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('positions')
      .select('*')
      .order('number')
      .then(({ data }) => {
        if (data) setPositions(data.map(fromRow));
        setLoading(false);
      });

    const channel = supabase
      .channel('positions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPositions(prev => {
            if (prev.find(p => p.id === payload.new.id)) return prev;
            return [...prev, fromRow(payload.new)].sort((a, b) => Number(a.number) - Number(b.number));
          });
        } else if (payload.eventType === 'UPDATE') {
          setPositions(prev => prev.map(p => p.id === payload.new.id ? fromRow(payload.new) : p));
        } else if (payload.eventType === 'DELETE') {
          setPositions(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const update = useCallback((id, changes) => {
    const row = toRow({ ...changes, id });
    const { id: _id, ...rest } = row;
    Object.keys(rest).forEach(k => { if (rest[k] === undefined) delete rest[k]; });
    supabase.from('positions').update(rest).eq('id', id).then();
  }, []);

  const add = useCallback(() => {
    const id = crypto.randomUUID();
    const row = toRow({
      id,
      number: String(positions.length + 1),
      positionName: 'עמדה חדשה',
      complexName: '',
      businessName: '',
      water: 'טוב',
      electricity: 'טוב',
      sewage: 'טוב',
      businessLicense: 'יש',
      traffic: 'טוב',
      waste: 'טוב',
      accessibility: 'טוב',
      lighting: 'טוב',
      buildingQuality: 'טוב',
      environmentQuality: 'טוב',
      approval: 'בבדיקה',
      status: 'בבדיקה',
      notes: '',
      mapPin: { x: 50, y: 50 },
      foodTruckImageUrl: '',
      foodTruckImageAlt: '',
    });
    supabase.from('positions').insert(row).then();
    return id;
  }, [positions.length]);

  const remove = useCallback((id) => {
    supabase.from('positions').delete().eq('id', id).then();
  }, []);

  const duplicate = useCallback((id) => {
    const src = positions.find(p => p.id === id);
    if (!src) return;
    const newId = crypto.randomUUID();
    const row = toRow({
      ...src,
      id: newId,
      number: String(positions.length + 1),
      positionName: src.positionName + ' (העתק)',
    });
    supabase.from('positions').insert(row).then();
  }, [positions]);

  return { positions, update, add, remove, duplicate, loading };
}
