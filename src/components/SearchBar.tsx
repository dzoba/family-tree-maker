import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  people: Array<{ id: string; firstName: string; lastName: string; maidenName?: string }>;
  onSelect: (personId: string) => void;
  onClose: () => void;
}

export default function SearchBar({ people, onSelect, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? people.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          (p.maidenName || '').toLowerCase().includes(q) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
        );
      })
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      onSelect(results[activeIndex].id);
    }
  };

  return (
    <div className="flex h-full items-start justify-center pt-20" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-bark-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-bark-100 px-4 py-3">
          <Search className="h-4 w-4 text-bark-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search people..."
            className="flex-1 bg-transparent text-sm text-bark-900 placeholder:text-bark-400 focus:outline-none"
          />
          {query && (
            <span className="text-[10px] text-bark-400">{results.length} found</span>
          )}
          <button onClick={onClose} className="rounded-md p-1 text-bark-400 hover:bg-cream-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto py-1">
            {results.map((person, i) => (
              <button
                key={person.id}
                onClick={() => onSelect(person.id)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                  i === activeIndex ? 'bg-sage-50 text-sage-800' : 'text-bark-700 hover:bg-cream-50'
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-[10px] font-semibold text-bark-500">
                  {person.firstName[0]}{person.lastName[0]}
                </div>
                <span className="font-medium">{person.firstName} {person.lastName}</span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-bark-400">No matches found</div>
        )}

        <div className="border-t border-bark-50 px-4 py-2">
          <div className="flex gap-3 text-[10px] text-bark-400">
            <span><kbd className="rounded bg-cream-200 px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-cream-200 px-1">↵</kbd> select</span>
            <span><kbd className="rounded bg-cream-200 px-1">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
