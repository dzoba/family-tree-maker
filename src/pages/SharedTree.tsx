import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TreePine, Home } from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLayoutedElements } from '../lib/layout';
import type { FamilyTree, Person } from '../types';

import PersonNode from '../components/PersonNode';
import RelationshipEdge from '../components/RelationshipEdge';

const nodeTypes = { person: PersonNode };
const edgeTypes = { relationship: RelationshipEdge };

export default function SharedTree() {
  const { shareId } = useParams<{ shareId: string }>();
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedTree() {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // Query for tree with matching shareId
        const treesQuery = query(
          collection(db, 'trees'),
          where('shareId', '==', shareId)
        );
        const treeSnap = await getDocs(treesQuery);

        if (treeSnap.empty) {
          setError('This share link is no longer valid');
          setLoading(false);
          return;
        }

        const treeDoc = treeSnap.docs[0];
        const treeData = { id: treeDoc.id, ...treeDoc.data() } as FamilyTree;
        setTree(treeData);

        // Fetch people
        const peopleSnap = await getDocs(
          collection(db, 'trees', treeDoc.id, 'people')
        );
        const peopleData = peopleSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Person
        );
        setPeople(peopleData);
      } catch {
        setError('Failed to load the shared tree');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedTree();
  }, [shareId]);

  const { nodes, edges } = useMemo(() => {
    if (people.length === 0) return { nodes: [], edges: [] };

    const rawNodes: Node[] = people.map((person) => ({
      id: person.id,
      type: 'person',
      position: person.position || { x: 0, y: 0 },
      data: { ...person },
      draggable: false,
    }));

    const rawEdges: Edge[] = [];
    const edgeSet = new Set<string>();

    for (const person of people) {
      for (const childId of person.childIds) {
        const edgeId = `pc-${person.id}-${childId}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          rawEdges.push({
            id: edgeId,
            source: person.id,
            target: childId,
            type: 'relationship',
            data: { type: 'parent-child' },
          });
        }
      }
      for (const spouseId of person.spouseIds) {
        const key = [person.id, spouseId].sort().join('-');
        const edgeId = `sp-${key}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          rawEdges.push({
            id: edgeId,
            source: person.id,
            sourceHandle: 'spouse',
            target: spouseId,
            targetHandle: 'spouse-target',
            type: 'relationship',
            data: { type: 'spouse' },
          });
        }
      }
    }

    const needsLayout = people.some((p) => !p.position);
    if (needsLayout) {
      return getLayoutedElements(rawNodes, rawEdges);
    }

    return { nodes: rawNodes, edges: rawEdges };
  }, [people]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <TreePine className="h-8 w-8 animate-pulse text-sage-500" />
          <p className="text-sm text-bark-500">Loading shared tree...</p>
        </div>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4">
        <TreePine className="h-12 w-12 text-bark-300" />
        <h2 className="mt-4 font-serif text-xl font-semibold text-bark-700">
          {error || 'Tree not found'}
        </h2>
        <p className="mt-2 text-sm text-bark-500">
          The share link may have been revoked or the tree deleted.
        </p>
        <Link to="/" className="btn-primary mt-6">
          <Home className="h-4 w-4" />
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-cream-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-bark-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <TreePine className="h-5 w-5 text-sage-600" />
          <h1 className="font-serif text-lg font-semibold text-bark-800">
            {tree.name}
          </h1>
          <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-bark-600">
            Shared view
          </span>
        </div>
        <Link to="/" className="btn-ghost text-sm">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E0CDBA" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor="#A3BFA3"
            nodeColor="#E6EDE6"
            maskColor="rgba(254, 253, 251, 0.7)"
          />

          {people.length === 0 && (
            <Panel position="top-center">
              <div className="mt-20 rounded-xl border border-bark-100 bg-white px-8 py-6 text-center shadow-sm">
                <TreePine className="mx-auto h-8 w-8 text-bark-300" />
                <p className="mt-3 font-serif text-lg font-semibold text-bark-700">
                  This tree is empty
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
