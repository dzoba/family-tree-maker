import { useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { nanoid } from 'nanoid';

export function useCollaborators(treeId: string | undefined) {
  const generateShareLink = useCallback(async () => {
    if (!treeId) throw new Error('No tree selected');
    const shareId = nanoid();
    await updateDoc(doc(db, 'trees', treeId), { shareId });
    return shareId;
  }, [treeId]);

  const revokeShareLink = useCallback(async () => {
    if (!treeId) throw new Error('No tree selected');
    await updateDoc(doc(db, 'trees', treeId), { shareId: null });
  }, [treeId]);

  const addCollaborator = useCallback(
    async (collaboratorUid: string) => {
      if (!treeId) throw new Error('No tree selected');
      await updateDoc(doc(db, 'trees', treeId), {
        collaboratorIds: arrayUnion(collaboratorUid),
      });
    },
    [treeId]
  );

  const removeCollaborator = useCallback(
    async (collaboratorUid: string) => {
      if (!treeId) throw new Error('No tree selected');
      await updateDoc(doc(db, 'trees', treeId), {
        collaboratorIds: arrayRemove(collaboratorUid),
      });
    },
    [treeId]
  );

  return {
    generateShareLink,
    revokeShareLink,
    addCollaborator,
    removeCollaborator,
  };
}
