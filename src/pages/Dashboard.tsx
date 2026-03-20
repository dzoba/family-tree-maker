import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Trash2, Clock, ChevronRight, Users } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useUserTrees } from '../hooks/useTree';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

function usePeopleCounts(treeIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (treeIds.length === 0) return;

    const unsubscribes = treeIds.map((treeId) =>
      onSnapshot(collection(db, 'trees', treeId, 'people'), (snap) => {
        setCounts((prev) => ({ ...prev, [treeId]: snap.size }));
      })
    );

    return () => unsubscribes.forEach((u) => u());
  }, [treeIds.join(',')]);

  return counts;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { trees, loading, createTree, deleteTree } = useUserTrees(user?.uid);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const peopleCounts = usePeopleCounts(trees.map((t) => t.id));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);
    try {
      const id = await createTree(newTreeName.trim());
      setNewTreeName('');
      setShowCreate(false);
      toast.success('Tree created!');
      navigate(`/tree/${id}`);
    } catch {
      toast.error('Failed to create tree');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (treeId: string, treeName: string) => {
    if (!confirm(`Delete "${treeName}"? This cannot be undone.`)) return;
    setDeletingId(treeId);
    try {
      await deleteTree(treeId);
      toast.success('Tree deleted');
    } catch {
      toast.error('Failed to delete tree');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-bark-900">
              My Trees
            </h1>
            <p className="mt-1 text-sm text-bark-600">
              {trees.length} {trees.length === 1 ? 'tree' : 'trees'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Tree
          </button>
        </div>

        {/* Create dialog */}
        {showCreate && (
          <div className="mb-6 card">
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-bark-700">
                  Tree Name
                </label>
                <input
                  autoFocus
                  className="input-field"
                  value={newTreeName}
                  onChange={(e) => setNewTreeName(e.target.value)}
                  placeholder="e.g., The Smith Family Tree"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newTreeName.trim()}
                className="btn-primary"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewTreeName('');
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Tree list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TreePine className="h-8 w-8 animate-pulse text-sage-400" />
            <p className="mt-3 text-sm text-bark-500">Loading your trees...</p>
          </div>
        ) : trees.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-bark-200 py-20">
            <TreePine className="h-12 w-12 text-bark-300" />
            <h3 className="mt-4 font-serif text-xl font-semibold text-bark-700">
              No trees yet
            </h3>
            <p className="mt-2 text-sm text-bark-500">
              Create your first family tree to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary mt-6"
            >
              <Plus className="h-4 w-4" />
              Create Your First Tree
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => {
              const count = peopleCounts[tree.id];
              return (
                <div
                  key={tree.id}
                  className="card group cursor-pointer transition-all hover:border-sage-200 hover:shadow-md"
                  onClick={() => navigate(`/tree/${tree.id}`)}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-600 transition-colors group-hover:bg-sage-200">
                      <TreePine className="h-5 w-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tree.id, tree.name);
                      }}
                      disabled={deletingId === tree.id}
                      className="btn-ghost !p-1.5 text-bark-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-bark-800 group-hover:text-sage-700">
                    {tree.name}
                  </h3>
                  {tree.description && (
                    <p className="mt-1 text-sm text-bark-500 line-clamp-2">
                      {tree.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {count !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-sage-600">
                          <Users className="h-3 w-3" />
                          {count} {count === 1 ? 'person' : 'people'}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-bark-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(tree.updatedAt)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-bark-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
