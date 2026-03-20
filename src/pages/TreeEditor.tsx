import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  TreePine,
  Undo2,
  Redo2,
  Search,
  CalendarDays,
  LayoutGrid as LayoutGridIcon,
  MapIcon,
  Activity,
  Magnet,
  Hand,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useTreeData } from '../hooks/useTree';
import { useCollaborators } from '../hooks/useCollaborators';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useActivityLog } from '../hooks/useActivityLog';
import { getLayoutedElements } from '../lib/layout';
import { exportGedcom, gedcomToPersons } from '../lib/gedcom';
import type { Person } from '../types';

import PersonNode from '../components/PersonNode';
import RelationshipEdge from '../components/RelationshipEdge';
import PersonPanel from '../components/PersonPanel';
import TreeToolbar from '../components/TreeToolbar';
import ShareDialog from '../components/ShareDialog';
import ImportDialog from '../components/ImportDialog';
import ContextMenu from '../components/ContextMenu';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import ActivityLog from '../components/ActivityLog';
import OnboardingFlow from '../components/OnboardingFlow';
import TimelineView from '../components/TimelineView';

const nodeTypes = { person: PersonNode };
const edgeTypes = { relationship: RelationshipEdge };

function TreeEditorInner() {
  const { id: treeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();
  const {
    tree,
    people,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    updateTree,
  } = useTreeData(treeId);
  const { generateShareLink, revokeShareLink } = useCollaborators(treeId);
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();
  const { logActivity } = useActivityLog(treeId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'timeline' | 'map'>('canvas');
  const [autoLayout, setAutoLayout] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    personId: string;
    personName: string;
  } | null>(null);


  // Build nodes and edges from people data
  const buildGraph = useCallback(
    (peopleData: Person[]) => {
      const newNodes: Node[] = peopleData.map((person) => ({
        id: person.id,
        type: 'person',
        position: person.position || { x: 0, y: 0 },
        data: { ...person },
      }));

      const newEdges: Edge[] = [];
      const edgeSet = new Set<string>();

      for (const person of peopleData) {
        for (const childId of person.childIds) {
          const edgeId = `pc-${person.id}-${childId}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            newEdges.push({
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
            newEdges.push({
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
      return { nodes: newNodes, edges: newEdges };
    },
    []
  );

  // Sync people data to graph
  useEffect(() => {
    if (people.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { nodes: newNodes, edges: newEdges } = buildGraph(people);
    if (autoLayout) {
      // Auto mode: dagre computes positions (never writes to Firestore)
      const { nodes: ln, edges: le } = getLayoutedElements(newNodes, newEdges);
      setNodes(ln);
      setEdges(le);
    } else {
      // Manual mode: use saved positions from Firestore
      // Nodes without saved positions get a dagre pass so they're not all at 0,0
      const unpositioned = newNodes.filter((n) => {
        const p = people.find((pp) => pp.id === n.id);
        return !p?.position;
      });
      if (unpositioned.length > 0) {
        const { nodes: ln, edges: le } = getLayoutedElements(newNodes, newEdges);
        setNodes(ln);
        setEdges(le);
      } else {
        setNodes(newNodes);
        setEdges(newEdges);
      }
    }
  }, [people, buildGraph, setNodes, setEdges, autoLayout]);

  // Update selected person when people data changes
  useEffect(() => {
    if (selectedPerson) {
      const updated = people.find((p) => p.id === selectedPerson.id);
      if (updated) setSelectedPerson(updated);
      else setSelectedPerson(null);
    }
  }, [people, selectedPerson]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return;

      // Escape: close panel/search/context menu
      if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false);
        else if (contextMenu) setContextMenu(null);
        else if (selectedPerson) setSelectedPerson(null);
      }

      // Delete/Backspace: delete selected person
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPerson) {
        e.preventDefault();
        handleDeletePerson(selectedPerson.id);
      }

      // Ctrl/Cmd+Z: undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Ctrl/Cmd+F: search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPerson, showSearch, contextMenu, undo, redo]);

  // --- Handlers ---
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const person = people.find((p) => p.id === node.id);
      if (person) setSelectedPerson(person);
      setContextMenu(null);
    },
    [people]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedPerson(null);
    setContextMenu(null);
  }, []);

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      const person = people.find((p) => p.id === node.id);
      if (person) {
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          personId: person.id,
          personName: `${person.firstName} ${person.lastName}`,
        });
      }
    },
    [people]
  );

  const handleAddPerson = useCallback(async () => {
    try {
      const id = await addPerson({
        firstName: 'New',
        lastName: 'Person',
        spouseIds: [],
        parentIds: [],
        childIds: [],
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      });
      pushAction({
        type: 'add-person',
        description: 'Add person',
        undo: async () => { await deletePerson(id); },
        redo: async () => {
          await addPerson({ firstName: 'New', lastName: 'Person', spouseIds: [], parentIds: [], childIds: [] });
        },
      });
      logActivity('add_person', 'New Person');
      toast.success('Person added');
    } catch {
      toast.error('Failed to add person');
    }
  }, [addPerson, deletePerson, pushAction, logActivity]);

  const handleAddChild = useCallback(
    async (parentId: string) => {
      try {
        const parent = people.find((p) => p.id === parentId);
        if (!parent) return;
        const childId = await addPerson({
          firstName: 'New',
          lastName: parent.lastName,
          spouseIds: [],
          parentIds: [parentId],
          childIds: [],
          position: parent.position
            ? { x: parent.position.x, y: parent.position.y + 180 }
            : undefined,
        });
        await updatePerson(parentId, {
          childIds: [...new Set([...parent.childIds, childId])],
        });
        logActivity('add_person', `child of ${parent.firstName} ${parent.lastName}`);
        toast.success('Child added');
      } catch {
        toast.error('Failed to add child');
      }
      setContextMenu(null);
    },
    [people, addPerson, updatePerson, logActivity]
  );

  const handleAddSpouse = useCallback(
    async (personId: string) => {
      try {
        const person = people.find((p) => p.id === personId);
        if (!person) return;
        const spouseId = await addPerson({
          firstName: 'New',
          lastName: 'Person',
          spouseIds: [personId],
          parentIds: [],
          childIds: [],
          position: person.position
            ? { x: person.position.x + 260, y: person.position.y }
            : undefined,
        });
        await updatePerson(personId, {
          spouseIds: [...new Set([...person.spouseIds, spouseId])],
        });
        logActivity('add_person', `spouse of ${person.firstName} ${person.lastName}`);
        toast.success('Spouse added');
      } catch {
        toast.error('Failed to add spouse');
      }
      setContextMenu(null);
    },
    [people, addPerson, updatePerson, logActivity]
  );

  const handleAddParent = useCallback(
    async (childId: string) => {
      try {
        const child = people.find((p) => p.id === childId);
        if (!child) return;
        const parentId = await addPerson({
          firstName: 'New',
          lastName: child.lastName,
          spouseIds: [],
          parentIds: [],
          childIds: [childId],
          position: child.position
            ? { x: child.position.x, y: child.position.y - 180 }
            : undefined,
        });
        await updatePerson(childId, {
          parentIds: [...new Set([...child.parentIds, parentId])],
        });
        logActivity('add_person', `parent of ${child.firstName} ${child.lastName}`);
        toast.success('Parent added');
      } catch {
        toast.error('Failed to add parent');
      }
      setContextMenu(null);
    },
    [people, addPerson, updatePerson, logActivity]
  );

  const handleDeletePerson = useCallback(
    async (personId: string) => {
      try {
        const person = people.find((p) => p.id === personId);
        await deletePerson(personId);
        if (selectedPerson?.id === personId) setSelectedPerson(null);
        logActivity('delete_person', person ? `${person.firstName} ${person.lastName}` : 'a person');
        toast.success('Person deleted');
      } catch {
        toast.error('Failed to delete person');
      }
      setContextMenu(null);
    },
    [deletePerson, selectedPerson, people, logActivity]
  );

  const handleEditFromContext = useCallback(
    (personId: string) => {
      const person = people.find((p) => p.id === personId);
      if (person) setSelectedPerson(person);
      setContextMenu(null);
    },
    [people]
  );

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
    setNodes(ln);
    setEdges(le);
    // Only save positions to Firestore in manual mode
    if (!autoLayout) {
      for (const node of ln) {
        updatePerson(node.id, { position: node.position }).catch(() => {});
      }
    }
    toast.success('Layout applied');
  }, [nodes, edges, setNodes, setEdges, updatePerson, autoLayout]);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Only persist positions in manual mode
      if (!autoLayout) {
        updatePerson(node.id, { position: node.position }).catch(() => {});
      }
    },
    [updatePerson, autoLayout]
  );

  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const isSpouse = connection.sourceHandle === 'spouse' || connection.targetHandle === 'spouse-target';
      const sourceId = connection.source;
      const targetId = connection.target;
      const src = people.find((p) => p.id === sourceId);
      const tgt = people.find((p) => p.id === targetId);
      if (!src || !tgt) return;

      try {
        if (isSpouse) {
          await updatePerson(sourceId, { spouseIds: [...new Set([...src.spouseIds, targetId])] });
          await updatePerson(targetId, { spouseIds: [...new Set([...tgt.spouseIds, sourceId])] });
          logActivity('add_relationship', `${src.firstName} ${src.lastName} and ${tgt.firstName} ${tgt.lastName}`);
          toast.success('Spouse relationship added');
        } else {
          await updatePerson(sourceId, { childIds: [...new Set([...src.childIds, targetId])] });
          await updatePerson(targetId, { parentIds: [...new Set([...tgt.parentIds, sourceId])] });
          logActivity('add_relationship', `${src.firstName} ${src.lastName} and ${tgt.firstName} ${tgt.lastName}`);
          toast.success('Parent-child relationship added');
        }
        setEdges((eds) => addEdge(connection, eds));
      } catch {
        toast.error('Failed to create relationship');
      }
    },
    [people, updatePerson, setEdges]
  );

  const handleExport = useCallback(() => {
    if (people.length === 0) { toast.error('No people to export'); return; }
    const gedcomStr = exportGedcom(people, tree?.name || 'Family Tree');
    const blob = new Blob([gedcomStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tree?.name || 'family-tree').replace(/\s+/g, '-').toLowerCase()}.ged`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GEDCOM exported');
  }, [people, tree]);

  const handleImport = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10MB)');
      const buffer = await file.arrayBuffer();
      const parsedPersons = gedcomToPersons(buffer);
      if (parsedPersons.length === 0) throw new Error('No people found in GEDCOM file');
      if (parsedPersons.length > 5000) throw new Error(`Too many people (${parsedPersons.length}). Maximum is 5,000.`);

      const indexToId = new Map<number, string>();
      for (let i = 0; i < parsedPersons.length; i++) {
        const id = await addPerson({ ...parsedPersons[i], spouseIds: [], parentIds: [], childIds: [] });
        indexToId.set(i, id);
      }
      for (let i = 0; i < parsedPersons.length; i++) {
        const p = parsedPersons[i];
        const realId = indexToId.get(i)!;
        const updates: Partial<Person> = {};
        if (p.spouseIds.length > 0) updates.spouseIds = p.spouseIds.map((idx) => indexToId.get(Number(idx))).filter(Boolean) as string[];
        if (p.parentIds.length > 0) updates.parentIds = p.parentIds.map((idx) => indexToId.get(Number(idx))).filter(Boolean) as string[];
        if (p.childIds.length > 0) updates.childIds = p.childIds.map((idx) => indexToId.get(Number(idx))).filter(Boolean) as string[];
        if (Object.keys(updates).length > 0) await updatePerson(realId, updates);
      }
      toast.success(`Imported ${parsedPersons.length} people`);
    },
    [addPerson, updatePerson]
  );

  const handleOnboardingAdd = useCallback(
    async (person: { firstName: string; lastName: string; gender?: string; birthDate?: string }) => {
      try {
        await addPerson({
          firstName: person.firstName,
          lastName: person.lastName,
          gender: (person.gender as Person['gender']) || undefined,
          birthDate: person.birthDate || undefined,
          spouseIds: [],
          parentIds: [],
          childIds: [],
          position: { x: 300, y: 200 },
        });
        logActivity('add_person', `${person.firstName} ${person.lastName}`);
        toast.success(`${person.firstName} added to the tree!`);
      } catch {
        toast.error('Failed to add person');
      }
    },
    [addPerson, logActivity]
  );

  const handleSearchSelect = useCallback(
    (personId: string) => {
      const person = people.find((p) => p.id === personId);
      if (person) {
        setSelectedPerson(person);
        // Pan to the node
        const node = nodes.find((n) => n.id === personId);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 60, { zoom: 1.2, duration: 500 });
        }
      }
      setShowSearch(false);
    },
    [people, nodes, reactFlowInstance]
  );

  const handleTimelineSelect = useCallback(
    (personId: string) => {
      setViewMode('canvas');
      const person = people.find((p) => p.id === personId);
      if (person) {
        setSelectedPerson(person);
        const node = nodes.find((n) => n.id === personId);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 60, { zoom: 1.2, duration: 500 });
        }
      }
    },
    [people, nodes, reactFlowInstance]
  );

  const nodesWithSelection = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data as Record<string, unknown>),
          selected: selectedPerson?.id === node.id,
          onAddChild: handleAddChild,
          onAddSpouse: handleAddSpouse,
          onAddParent: handleAddParent,
        },
      })),
    [nodes, selectedPerson, handleAddChild, handleAddSpouse, handleAddParent]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-3">
          <TreePine className="h-8 w-8 animate-pulse text-sage-500" />
          <p className="text-sm text-bark-500">Loading tree...</p>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50">
        <TreePine className="h-12 w-12 text-bark-300" />
        <h2 className="mt-4 font-serif text-xl font-semibold text-bark-700">Tree not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-cream-50">
      <TreeToolbar
        treeName={tree.name}
        treeDescription={tree.description}
        onAddPerson={handleAddPerson}
        onAutoLayout={handleAutoLayout}
        onShare={() => setShowShare(true)}
        onExport={handleExport}
        onImport={() => setShowImport(true)}
        onRename={async (name, description) => {
          await updateTree({ name, description } as Partial<typeof tree>);
          logActivity('update_tree', name);
          toast.success('Tree updated');
        }}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* View toggle bar — always visible, shifts right when panel open */}
        <div className={`absolute top-3 z-30 flex gap-1 transition-all ${selectedPerson && viewMode === 'canvas' ? 'right-[316px]' : showActivity ? 'right-[296px]' : 'right-3'}`}>
          <button
            onClick={() => setViewMode('canvas')}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-all ${viewMode === 'canvas' ? 'border-sage-300 bg-sage-100 text-sage-700' : 'border-bark-100 bg-white text-bark-500 hover:bg-cream-50'}`}
          >
            <LayoutGridIcon className="inline h-3 w-3 mr-1" />Canvas
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-all ${viewMode === 'timeline' ? 'border-sage-300 bg-sage-100 text-sage-700' : 'border-bark-100 bg-white text-bark-500 hover:bg-cream-50'}`}
          >
            <CalendarDays className="inline h-3 w-3 mr-1" />Timeline
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-all ${viewMode === 'map' ? 'border-sage-300 bg-sage-100 text-sage-700' : 'border-bark-100 bg-white text-bark-500 hover:bg-cream-50'}`}
          >
            <MapIcon className="inline h-3 w-3 mr-1" />Map
          </button>
          <div className="mx-0.5 w-px bg-bark-200" />
          <button
            onClick={() => setAutoLayout(!autoLayout)}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-all ${autoLayout ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}
            title={autoLayout ? 'Auto layout: computer organizes the tree. Click for manual mode.' : 'Manual layout: you position nodes. Click for auto mode.'}
          >
            {autoLayout
              ? <><Magnet className="inline h-3 w-3 mr-1" />Auto</>
              : <><Hand className="inline h-3 w-3 mr-1" />Manual</>
            }
          </button>
          <div className="mx-0.5 w-px bg-bark-200" />
          <button
            onClick={() => setShowActivity(!showActivity)}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-all ${showActivity ? 'border-sage-300 bg-sage-100 text-sage-700' : 'border-bark-100 bg-white text-bark-500 hover:bg-cream-50'}`}
          >
            <Activity className="inline h-3 w-3 mr-1" />Activity
          </button>
        </div>

        {/* Alt views */}
        {viewMode === 'timeline' ? (
          <div className="flex-1 overflow-y-auto bg-cream-50">
            <TimelineView people={people} onSelectPerson={handleTimelineSelect} />
          </div>
        ) : viewMode === 'map' ? (
          <div className="flex-1">
            <MapView people={people} onSelectPerson={handleTimelineSelect} />
          </div>
        ) : (
          /* Canvas */
          <div className="flex-1">
            <ReactFlow
              nodes={nodesWithSelection}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              onNodeContextMenu={handleNodeContextMenu}
              onPaneClick={handlePaneClick}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{ type: 'relationship' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E0CDBA" />
              <Controls />
              <MiniMap
                nodeStrokeColor="#A3BFA3"
                nodeColor="#E6EDE6"
                maskColor="rgba(254, 253, 251, 0.7)"
                className="hidden sm:block"
              />

              {/* Top-left controls */}
              <Panel position="top-left">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-ghost bg-white shadow-sm border border-bark-100 !text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="btn-ghost bg-white shadow-sm border border-bark-100 !p-1.5 disabled:opacity-30"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="btn-ghost bg-white shadow-sm border border-bark-100 !p-1.5 disabled:opacity-30"
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Panel>

              {/* Search button only inside canvas */}
              <Panel position="top-right">
                <button
                  onClick={() => setShowSearch(true)}
                  className="btn-ghost bg-white shadow-sm border border-bark-100 !p-1.5"
                  title="Search (Ctrl+F)"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </Panel>

              {/* Onboarding for empty tree */}
              {people.length === 0 && (
                <Panel position="top-center">
                  <div className="mt-12">
                    <OnboardingFlow
                      onAddPerson={handleOnboardingAdd}
                      onSkip={handleAddPerson}
                    />
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
        )}

        {/* Edit panel */}
        {selectedPerson && viewMode === 'canvas' && (
          <div className="absolute right-0 top-0 z-20 h-full sm:relative">
            <PersonPanel
              person={selectedPerson}
              onUpdate={async (id, updates) => {
                await updatePerson(id, updates);
                const p = people.find((pp) => pp.id === id);
                if (!p) return;
                // Describe what changed
                const fieldLabels: Record<string, string> = {
                  firstName: 'first name', lastName: 'last name', maidenName: 'maiden name',
                  gender: 'gender', birthDate: 'birth date', deathDate: 'death date',
                  birthPlace: 'birth place', deathPlace: 'death place', notes: 'notes', photoUrl: 'photo',
                };
                const changes: string[] = [];
                for (const [key, val] of Object.entries(updates)) {
                  const label = fieldLabels[key];
                  if (!label) continue;
                  const oldVal = (p as unknown as Record<string, unknown>)[key] || '';
                  if (val !== oldVal && typeof val === 'string' && val) {
                    changes.push(`set ${label} to "${val}"`);
                  } else if (val !== oldVal && typeof val === 'object') {
                    // deleteField sentinel or photo upload
                    if (key === 'photoUrl') changes.push('uploaded photo');
                    else changes.push(`cleared ${label}`);
                  }
                }
                const desc = changes.length > 0
                  ? `${p.firstName} ${p.lastName}: ${changes.join(', ')}`
                  : `${p.firstName} ${p.lastName}`;
                logActivity('update_person', desc);
              }}
              onDelete={deletePerson}
              onClose={() => setSelectedPerson(null)}
              people={people}
              onRemoveRelationship={async (personId, relatedId, type) => {
                const p = people.find((pp) => pp.id === personId);
                const r = people.find((pp) => pp.id === relatedId);
                if (!p || !r) return;
                if (type === 'spouse') {
                  await updatePerson(personId, { spouseIds: p.spouseIds.filter((id) => id !== relatedId) });
                  await updatePerson(relatedId, { spouseIds: r.spouseIds.filter((id) => id !== personId) });
                } else if (type === 'parent') {
                  await updatePerson(personId, { parentIds: p.parentIds.filter((id) => id !== relatedId) });
                  await updatePerson(relatedId, { childIds: r.childIds.filter((id) => id !== personId) });
                } else if (type === 'child') {
                  await updatePerson(personId, { childIds: p.childIds.filter((id) => id !== relatedId) });
                  await updatePerson(relatedId, { parentIds: r.parentIds.filter((id) => id !== personId) });
                }
                logActivity('update_person', `removed ${type} relationship between ${p.firstName} and ${r.firstName}`);
                toast.success('Relationship removed');
              }}
            />
          </div>
        )}

        {/* Activity panel */}
        {showActivity && treeId && (
          <div className="w-72 border-l border-bark-100 bg-white">
            <div className="flex items-center justify-between border-b border-bark-100 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-bark-500">Activity</span>
              <button onClick={() => setShowActivity(false)} className="rounded p-1 text-bark-400 hover:bg-cream-100">
                <ArrowLeft className="h-3 w-3" />
              </button>
            </div>
            <ActivityLog treeId={treeId} />
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          personId={contextMenu.personId}
          personName={contextMenu.personName}
          onAddChild={handleAddChild}
          onAddSpouse={handleAddSpouse}
          onAddParent={handleAddParent}
          onEdit={handleEditFromContext}
          onDelete={handleDeletePerson}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Search overlay */}
      {showSearch && (
        <div className="absolute inset-0 z-30">
          <SearchBar
            people={people}
            onSelect={handleSearchSelect}
            onClose={() => setShowSearch(false)}
          />
        </div>
      )}

      {/* Dialogs */}
      {showShare && (
        <ShareDialog
          shareId={tree.shareId}
          onGenerateLink={generateShareLink}
          onRevokeLink={revokeShareLink}
          onClose={() => setShowShare(false)}
        />
      )}
      {showImport && (
        <ImportDialog
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

export default function TreeEditor() {
  return (
    <ReactFlowProvider>
      <TreeEditorInner />
    </ReactFlowProvider>
  );
}
