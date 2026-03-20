import { useState, useRef, useEffect } from 'react';
import {
  UserPlus,
  Share2,
  Download,
  Upload,
  LayoutGrid,
  Pencil,
  Check,
} from 'lucide-react';

interface TreeToolbarProps {
  onAddPerson: () => void;
  onAutoLayout: () => void;
  onShare: () => void;
  onExport: () => void;
  onImport: () => void;
  treeName: string;
  treeDescription?: string;
  onRename: (name: string, description: string) => void;
}

export default function TreeToolbar({
  onAddPerson,
  onAutoLayout,
  onShare,
  onExport,
  onImport,
  treeName,
  treeDescription,
  onRename,
}: TreeToolbarProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(treeName);
  const [desc, setDesc] = useState(treeDescription || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(treeName);
    setDesc(treeDescription || '');
  }, [treeName, treeDescription]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    if (name.trim()) {
      onRename(name.trim(), desc.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between border-b border-bark-100 bg-white px-4 py-2.5">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="rounded-md border border-sage-300 bg-cream-50 px-2 py-1 text-sm font-semibold text-bark-800 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
            placeholder="Tree name"
          />
          <input
            className="hidden rounded-md border border-bark-200 bg-cream-50 px-2 py-1 text-xs text-bark-600 sm:block focus:outline-none focus:ring-1 focus:ring-sage-400/30"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Description (optional)"
          />
          <button onClick={handleSave} className="btn-ghost !p-1.5 text-sage-600">
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none"
          title="Click to rename"
        >
          <h2 className="font-serif text-lg font-semibold text-bark-800 truncate">
            {treeName}
          </h2>
          <Pencil className="h-3 w-3 text-bark-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}

      <div className="flex items-center gap-1.5">
        <button onClick={onAddPerson} className="btn-primary !py-2 !px-3 !text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Person</span>
        </button>

        <button onClick={onAutoLayout} className="btn-ghost !py-2 !px-3 !text-xs" title="Auto-layout">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Layout</span>
        </button>

        <div className="mx-1 h-5 w-px bg-bark-200" />

        <button onClick={onImport} className="btn-ghost !py-2 !px-3 !text-xs" title="Import GEDCOM">
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Import</span>
        </button>

        <button onClick={onExport} className="btn-ghost !py-2 !px-3 !text-xs" title="Export GEDCOM">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>

        <div className="mx-1 h-5 w-px bg-bark-200" />

        <button onClick={onShare} className="btn-secondary !py-2 !px-3 !text-xs">
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}
