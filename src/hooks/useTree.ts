import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FamilyTree, Person } from '../types';

export function useUserTrees(userId: string | undefined) {
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTrees([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'trees'),
      where('ownerId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const treesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyTree[];
        setTrees(treesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user trees:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const createTree = useCallback(
    async (name: string, description?: string) => {
      if (!userId) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'trees'), {
        name,
        description: description || '',
        ownerId: userId,
        collaboratorIds: [],
        shareId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [userId]
  );

  const deleteTree = useCallback(async (treeId: string) => {
    // Delete all people and activity in the tree first
    const batch = writeBatch(db);

    const peopleDocs = await getDocs(collection(db, 'trees', treeId, 'people'));
    peopleDocs.docs.forEach((d) => batch.delete(d.ref));

    const activityDocs = await getDocs(collection(db, 'trees', treeId, 'activity'));
    activityDocs.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit().catch(() => {});
    await deleteDoc(doc(db, 'trees', treeId));
  }, []);

  return { trees, loading, createTree, deleteTree };
}

export function useTreeData(treeId: string | undefined) {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!treeId) {
      setLoading(false);
      return;
    }

    const treeUnsubscribe = onSnapshot(
      doc(db, 'trees', treeId),
      (snapshot) => {
        if (snapshot.exists()) {
          setTree({ id: snapshot.id, ...snapshot.data() } as FamilyTree);
        } else {
          setTree(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to tree:', error);
        setLoading(false);
      }
    );

    const peopleUnsubscribe = onSnapshot(
      collection(db, 'trees', treeId, 'people'),
      (snapshot) => {
        const peopleData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Person[];
        setPeople(peopleData);
      },
      (error) => {
        console.error('Error listening to people:', error);
      }
    );

    return () => {
      treeUnsubscribe();
      peopleUnsubscribe();
    };
  }, [treeId]);

  const addPerson = useCallback(
    async (person: Omit<Person, 'id'>) => {
      if (!treeId) throw new Error('No tree selected');
      const docRef = await addDoc(
        collection(db, 'trees', treeId, 'people'),
        person
      );
      await updateDoc(doc(db, 'trees', treeId), {
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [treeId]
  );

  const updatePerson = useCallback(
    async (personId: string, updates: Partial<Person>) => {
      if (!treeId) throw new Error('No tree selected');
      await updateDoc(
        doc(db, 'trees', treeId, 'people', personId),
        updates
      );
      await updateDoc(doc(db, 'trees', treeId), {
        updatedAt: serverTimestamp(),
      });
    },
    [treeId]
  );

  const deletePerson = useCallback(
    async (personId: string) => {
      if (!treeId) throw new Error('No tree selected');

      // Remove references from other people
      const batch = writeBatch(db);
      for (const p of people) {
        const updates: Partial<Person> = {};
        if (p.spouseIds.includes(personId)) {
          updates.spouseIds = p.spouseIds.filter((id) => id !== personId);
        }
        if (p.parentIds.includes(personId)) {
          updates.parentIds = p.parentIds.filter((id) => id !== personId);
        }
        if (p.childIds.includes(personId)) {
          updates.childIds = p.childIds.filter((id) => id !== personId);
        }
        if (Object.keys(updates).length > 0) {
          batch.update(
            doc(db, 'trees', treeId, 'people', p.id),
            updates
          );
        }
      }
      batch.delete(doc(db, 'trees', treeId, 'people', personId));
      await batch.commit();

      await updateDoc(doc(db, 'trees', treeId), {
        updatedAt: serverTimestamp(),
      });
    },
    [treeId, people]
  );

  const updateTree = useCallback(
    async (updates: Partial<FamilyTree>) => {
      if (!treeId) throw new Error('No tree selected');
      await updateDoc(doc(db, 'trees', treeId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    [treeId]
  );

  return {
    tree,
    people,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    updateTree,
  };
}
