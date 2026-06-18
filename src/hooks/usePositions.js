import { useState, useCallback } from 'react';
import { seedPositions, createPosition } from '../utils/seedPositions.js';

export default function usePositions() {
  const [positions, setPositions] = useState(() => seedPositions(8));

  const update = useCallback((id, changes) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }, []);

  const add = useCallback(() => {
    const pos = createPosition({ number: String(positions.length + 1) });
    setPositions(prev => [...prev, pos]);
    return pos.id;
  }, [positions.length]);

  const remove = useCallback((id) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const duplicate = useCallback((id) => {
    setPositions(prev => {
      const src = prev.find(p => p.id === id);
      if (!src) return prev;
      const copy = { ...src, id: crypto.randomUUID(), number: String(prev.length + 1), positionName: src.positionName + ' (העתק)' };
      return [...prev, copy];
    });
  }, []);

  return { positions, update, add, remove, duplicate };
}
