import { readGedcom } from 'read-gedcom';
import type { Person } from '../types';

interface GedcomPerson {
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
}

interface GedcomFamily {
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
}

export function parseGedcom(
  fileContent: ArrayBuffer
): { people: Map<string, GedcomPerson>; families: GedcomFamily[] } {
  const gedcom = readGedcom(fileContent);
  const people = new Map<string, GedcomPerson>();
  const families: GedcomFamily[] = [];

  // Parse individuals
  const individuals = gedcom.getIndividualRecord();
  for (const indi of individuals.arraySelect()) {
    const pointer = indi.pointer()[0] || '';

    const nameRecord = indi.getName();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nameValue = (nameRecord as any).value()[0] || '';
    const nameParts = nameValue.split('/');
    const firstName = (nameParts[0] || '').trim();
    const lastName = (nameParts[1] || '').trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sexValue = (indi.getSex() as any).value()[0] || '';
    let gender: 'male' | 'female' | 'other' | undefined;
    if (sexValue === 'M') gender = 'male';
    else if (sexValue === 'F') gender = 'female';
    else if (sexValue) gender = 'other';

    const birthEvent = indi.getEventBirth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const birthDate = (birthEvent.getDate() as any).value()[0] || undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const birthPlace = (birthEvent.getPlace() as any).value()[0] || undefined;

    const deathEvent = indi.getEventDeath();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deathDate = (deathEvent.getDate() as any).value()[0] || undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deathPlace = (deathEvent.getPlace() as any).value()[0] || undefined;

    people.set(pointer, {
      firstName,
      lastName,
      gender,
      birthDate,
      deathDate,
      birthPlace,
      deathPlace,
    });
  }

  // Parse families
  const familyRecords = gedcom.getFamilyRecord();
  for (const fam of familyRecords.arraySelect()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const husbandRef = (fam.getHusband() as any).value()[0] || undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wifeRef = (fam.getWife() as any).value()[0] || undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childRefs = (fam.getChild() as any).value() as string[];

    families.push({
      husbandId: husbandRef,
      wifeId: wifeRef,
      childIds: childRefs || [],
    });
  }

  return { people, families };
}

export function gedcomToPersons(
  fileContent: ArrayBuffer
): Omit<Person, 'id'>[] {
  const { people, families } = parseGedcom(fileContent);
  const gedcomIdToIndex = new Map<string, number>();
  const persons: Omit<Person, 'id'>[] = [];

  // Create person entries
  let idx = 0;
  for (const [gedcomId, data] of people) {
    gedcomIdToIndex.set(gedcomId, idx);
    persons.push({
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      birthPlace: data.birthPlace,
      deathPlace: data.deathPlace,
      spouseIds: [],
      parentIds: [],
      childIds: [],
    });
    idx++;
  }

  // Build relationship mappings using index references
  for (const family of families) {
    const parentGedcomIds: string[] = [];
    if (family.husbandId) parentGedcomIds.push(family.husbandId);
    if (family.wifeId) parentGedcomIds.push(family.wifeId);

    // Spouse relationships
    if (family.husbandId && family.wifeId) {
      const hi = gedcomIdToIndex.get(family.husbandId);
      const wi = gedcomIdToIndex.get(family.wifeId);
      if (hi !== undefined && wi !== undefined) {
        persons[hi].spouseIds.push(String(wi));
        persons[wi].spouseIds.push(String(hi));
      }
    }

    // Parent-child relationships
    for (const childId of family.childIds) {
      const ci = gedcomIdToIndex.get(childId);
      if (ci === undefined) continue;
      for (const parentId of parentGedcomIds) {
        const pi = gedcomIdToIndex.get(parentId);
        if (pi === undefined) continue;
        persons[ci].parentIds.push(String(pi));
        persons[pi].childIds.push(String(ci));
      }
    }
  }

  // Deduplicate relationship arrays
  for (const p of persons) {
    p.spouseIds = [...new Set(p.spouseIds)];
    p.parentIds = [...new Set(p.parentIds)];
    p.childIds = [...new Set(p.childIds)];
  }

  return persons;
}

export function exportGedcom(people: Person[], _treeName: string): string {
  const lines: string[] = [];
  const personIdToGedcom = new Map<string, string>();

  // Header
  lines.push('0 HEAD');
  lines.push('1 SOUR FamilyTreeMaker');
  lines.push('2 NAME Family Tree Maker');
  lines.push('2 VERS 1.0');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');

  // Map person IDs to GEDCOM IDs
  people.forEach((person, index) => {
    personIdToGedcom.set(person.id, `@I${index + 1}@`);
  });

  // Individual records
  for (const person of people) {
    const gedcomId = personIdToGedcom.get(person.id)!;
    lines.push(`0 ${gedcomId} INDI`);
    lines.push(
      `1 NAME ${person.firstName} /${person.lastName}/`
    );
    if (person.firstName) lines.push(`2 GIVN ${person.firstName}`);
    if (person.lastName) lines.push(`2 SURN ${person.lastName}`);
    if (person.gender) {
      const sex =
        person.gender === 'male' ? 'M' : person.gender === 'female' ? 'F' : 'U';
      lines.push(`1 SEX ${sex}`);
    }
    if (person.birthDate || person.birthPlace) {
      lines.push('1 BIRT');
      if (person.birthDate) lines.push(`2 DATE ${person.birthDate}`);
      if (person.birthPlace) lines.push(`2 PLAC ${person.birthPlace}`);
    }
    if (person.deathDate || person.deathPlace) {
      lines.push('1 DEAT');
      if (person.deathDate) lines.push(`2 DATE ${person.deathDate}`);
      if (person.deathPlace) lines.push(`2 PLAC ${person.deathPlace}`);
    }
    if (person.notes) {
      lines.push(`1 NOTE ${person.notes}`);
    }
  }

  // Derive family records from relationships
  const familySet = new Set<string>();
  let famIndex = 1;

  for (const person of people) {
    for (const spouseId of person.spouseIds) {
      const key = [person.id, spouseId].sort().join('-');
      if (familySet.has(key)) continue;
      familySet.add(key);

      const spouse = people.find((p) => p.id === spouseId);
      if (!spouse) continue;

      const famId = `@F${famIndex}@`;
      famIndex++;

      lines.push(`0 ${famId} FAM`);

      // Determine husband/wife
      const husband =
        person.gender === 'male'
          ? person
          : spouse.gender === 'male'
            ? spouse
            : person;
      const wife = husband === person ? spouse : person;

      lines.push(`1 HUSB ${personIdToGedcom.get(husband.id)}`);
      lines.push(`1 WIFE ${personIdToGedcom.get(wife.id)}`);

      // Find common children
      const commonChildren = person.childIds.filter((cid) =>
        spouse.childIds.includes(cid)
      );
      for (const childId of commonChildren) {
        lines.push(`1 CHIL ${personIdToGedcom.get(childId)}`);
      }
    }
  }

  lines.push('0 TRLR');
  return lines.join('\n');
}
