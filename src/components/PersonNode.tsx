import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User, Heart, Calendar, Plus } from 'lucide-react';
import type { Person } from '../types';

type PersonNodeData = Person & {
  selected?: boolean;
  onAddChild?: (id: string) => void;
  onAddSpouse?: (id: string) => void;
  onAddParent?: (id: string) => void;
};

function PersonNodeComponent({ data }: NodeProps) {
  const person = data as unknown as PersonNodeData;
  const genderColor =
    person.gender === 'male'
      ? 'border-blue-300 bg-blue-50'
      : person.gender === 'female'
        ? 'border-pink-300 bg-pink-50'
        : 'border-bark-200 bg-cream-50';

  const genderAccent =
    person.gender === 'male'
      ? 'bg-blue-400'
      : person.gender === 'female'
        ? 'bg-pink-400'
        : 'bg-bark-300';

  const formatDate = (date?: string) => {
    if (!date) return null;
    try {
      return new Date(date).getFullYear().toString();
    } catch {
      return date;
    }
  };

  const birthYear = formatDate(person.birthDate);
  const deathYear = formatDate(person.deathDate);
  const lifespan =
    birthYear && deathYear
      ? `${birthYear} - ${deathYear}`
      : birthYear
        ? `b. ${birthYear}`
        : deathYear
          ? `d. ${deathYear}`
          : null;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-sage-400 !border-sage-500 !w-2.5 !h-2.5" />

      <div
        className={`group/node relative w-[200px] rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md ${
          person.selected ? 'ring-2 ring-sage-500 ring-offset-2' : ''
        } ${genderColor}`}
      >
        {/* Gender indicator strip */}
        <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${genderAccent}`} />

        <div className="flex items-start gap-3 p-3 pl-4">
          {/* Avatar */}
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-200">
              <User className="h-5 w-5 text-bark-400" />
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-bark-800">
              {person.firstName} {person.lastName}
            </p>
            {person.maidenName && (
              <p className="truncate text-xs text-bark-400">
                (nee {person.maidenName})
              </p>
            )}
            {lifespan && (
              <div className="mt-1 flex items-center gap-1 text-xs text-bark-500">
                <Calendar className="h-3 w-3" />
                <span>{lifespan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Spouse indicator */}
        {person.spouseIds.length > 0 && (
          <div className="absolute -right-1 -top-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 ring-2 ring-white">
              <Heart className="h-3 w-3 text-red-400" />
            </div>
          </div>
        )}

        {/* Quick-add buttons — appear on hover */}
        {person.onAddParent && (
          <button
            onClick={(e) => { e.stopPropagation(); person.onAddParent!(person.id); }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-md opacity-0 transition-all hover:scale-110 group-hover/node:opacity-100"
            title="Add parent"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        {person.onAddChild && (
          <button
            onClick={(e) => { e.stopPropagation(); person.onAddChild!(person.id); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-sage-600 text-white shadow-md opacity-0 transition-all hover:scale-110 group-hover/node:opacity-100"
            title="Add child"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        {person.onAddSpouse && (
          <button
            onClick={(e) => { e.stopPropagation(); person.onAddSpouse!(person.id); }}
            className="absolute top-1/2 -right-3 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-white shadow-md opacity-0 transition-all hover:scale-110 group-hover/node:opacity-100"
            title="Add spouse"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-sage-400 !border-sage-500 !w-2.5 !h-2.5" />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse"
        className="!bg-red-300 !border-red-400 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-target"
        className="!bg-red-300 !border-red-400 !w-2 !h-2"
      />
    </>
  );
}

export default memo(PersonNodeComponent);
