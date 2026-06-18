import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase.js';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { createPosition } from '../utils/seedPositions.js';

const COLLECTION = 'positions';

export default function usePositions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLLECTION), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.number) - Number(b.number));
      setPositions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const update = useCallback((id, changes) => {
    const ref = doc(db, COLLECTION, id);
    updateDoc(ref, changes);
  }, []);

  const add = useCallback(() => {
    const pos = createPosition({ number: String(positions.length + 1) });
    const ref = doc(db, COLLECTION, pos.id);
    setDoc(ref, pos);
    return pos.id;
  }, [positions.length]);

  const remove = useCallback((id) => {
    deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const duplicate = useCallback((id) => {
    const src = positions.find(p => p.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: crypto.randomUUID(),
      number: String(positions.length + 1),
      positionName: src.positionName + ' (העתק)',
    };
    const ref = doc(db, COLLECTION, copy.id);
    setDoc(ref, copy);
  }, [positions]);

  return { positions, update, add, remove, duplicate, loading };
}
