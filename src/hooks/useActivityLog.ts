import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'add_person' | 'update_person' | 'delete_person' | 'add_relationship' | 'update_tree';
  targetName: string;
  timestamp: Timestamp;
}

export function useActivityLog(treeId: string | undefined) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!treeId) {
      setActivities([]);
      return;
    }

    const q = query(
      collection(db, 'trees', treeId, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityEntry[];
      setActivities(entries);
    });

    return unsubscribe;
  }, [treeId]);

  const logActivity = useCallback(
    async (action: ActivityEntry['action'], targetName: string) => {
      if (!treeId) return;

      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, 'trees', treeId, 'activity'), {
        userId: user.uid,
        userName: user.displayName || user.email || 'Unknown',
        action,
        targetName,
        timestamp: serverTimestamp(),
      });
    },
    [treeId]
  );

  return { activities, logActivity };
}
