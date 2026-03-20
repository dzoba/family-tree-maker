import { useEffect, useRef } from 'react';
import { UserPlus, Heart, Users, Edit3, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  personId: string;
  personName: string;
  onAddChild: (parentId: string) => void;
  onAddSpouse: (personId: string) => void;
  onAddParent: (childId: string) => void;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  personId,
  personName,
  onAddChild,
  onAddSpouse,
  onAddParent,
  onEdit,
  onDelete,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 280),
    zIndex: 100,
  };

  const items = [
    { icon: UserPlus, label: 'Add Child', onClick: () => onAddChild(personId), color: 'text-sage-600' },
    { icon: Heart, label: 'Add Spouse', onClick: () => onAddSpouse(personId), color: 'text-red-400' },
    { icon: Users, label: 'Add Parent', onClick: () => onAddParent(personId), color: 'text-blue-500' },
    null,
    { icon: Edit3, label: 'Edit', onClick: () => onEdit(personId), color: 'text-bark-500' },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete(personId), color: 'text-red-500' },
  ];

  return (
    <div ref={menuRef} style={style} className="w-48 rounded-xl border border-bark-100 bg-white py-1 shadow-xl">
      <div className="truncate border-b border-bark-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
        {personName}
      </div>
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="my-1 border-t border-bark-50" />
        ) : (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-bark-700 transition-colors hover:bg-cream-100"
          >
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
