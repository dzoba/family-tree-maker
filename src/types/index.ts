import type { Timestamp } from 'firebase/firestore';

export interface FamilyTree {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaboratorIds: string[];
  shareId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RelationshipType = 'married' | 'divorced' | 'partner' | 'engaged';
export type ParentType = 'biological' | 'adoptive' | 'step' | 'foster';

export interface SpouseRelationship {
  personId: string;
  type: RelationshipType;
}

export interface ParentRelationship {
  personId: string;
  type: ParentType;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  photoUrl?: string;
  notes?: string;
  // Legacy simple arrays (still supported)
  spouseIds: string[];
  parentIds: string[];
  childIds: string[];
  // Rich relationship data (optional, overrides simple arrays when present)
  spouseRelationships?: SpouseRelationship[];
  parentRelationships?: ParentRelationship[];
  position?: { x: number; y: number };
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
