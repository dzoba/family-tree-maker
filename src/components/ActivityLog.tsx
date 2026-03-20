import { UserPlus, Edit3, Trash2, Link2, Settings } from 'lucide-react';
import { useActivityLog } from '../hooks/useActivityLog';
import type { ActivityEntry } from '../hooks/useActivityLog';
import type { Timestamp } from 'firebase/firestore';

interface ActivityLogProps {
  treeId: string;
}

function formatRelativeTime(timestamp: Timestamp | null): string {
  if (!timestamp) return 'just now';

  const now = Date.now();
  const then = timestamp.toMillis();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

function getActionIcon(action: ActivityEntry['action']) {
  switch (action) {
    case 'add_person':
      return <UserPlus className="h-3 w-3 text-sage-600" />;
    case 'update_person':
      return <Edit3 className="h-3 w-3 text-bark-500" />;
    case 'delete_person':
      return <Trash2 className="h-3 w-3 text-red-500" />;
    case 'add_relationship':
      return <Link2 className="h-3 w-3 text-blue-500" />;
    case 'update_tree':
      return <Settings className="h-3 w-3 text-bark-400" />;
  }
}

function getActionDescription(action: ActivityEntry['action'], targetName: string): string {
  switch (action) {
    case 'add_person':
      return `added ${targetName}`;
    case 'update_person':
      return `updated ${targetName}`;
    case 'delete_person':
      return `deleted ${targetName}`;
    case 'add_relationship':
      return `connected ${targetName}`;
    case 'update_tree':
      return 'updated tree settings';
  }
}

export default function ActivityLog({ treeId }: ActivityLogProps) {
  const { activities } = useActivityLog(treeId);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-bark-400">
        <Settings className="mb-2 h-5 w-5" />
        <p className="text-xs">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <ul className="divide-y divide-bark-50">
        {activities.map((entry) => (
          <li key={entry.id} className="flex items-start gap-2.5 px-3 py-2.5">
            {/* Avatar */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-[10px] font-semibold uppercase text-sage-700">
              {entry.userName.charAt(0)}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {getActionIcon(entry.action)}
                <p className="truncate text-xs text-bark-800">
                  <span className="font-medium">{entry.userName}</span>{' '}
                  {getActionDescription(entry.action, entry.targetName)}
                </p>
              </div>
              <p className="mt-0.5 text-[10px] text-bark-400">
                {formatRelativeTime(entry.timestamp)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
