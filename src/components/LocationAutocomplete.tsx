import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'City, Country',
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'FamilyTreeMaker/1.0' } }
      );
      if (res.ok) {
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch {
      // Silently fail - user can still type manually
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 1000);
  };

  const handleSelect = (result: NominatimResult) => {
    // Shorten the display name (Nominatim returns very long strings)
    const parts = result.display_name.split(', ');
    const short = parts.length > 3
      ? `${parts[0]}, ${parts[parts.length - 3]}, ${parts[parts.length - 1]}`
      : result.display_name;
    onChange(short);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 pr-7 text-xs text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
        />
        <MapPin className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-bark-300" />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-bark-100 bg-white py-1 shadow-lg">
          {suggestions.map((result, i) => {
            // Shorten for display
            const parts = result.display_name.split(', ');
            const primary = parts[0];
            const secondary = parts.slice(1, 3).join(', ');
            return (
              <button
                key={`${result.lat}-${result.lon}`}
                onClick={() => handleSelect(result)}
                className={`flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-sage-50' : 'hover:bg-cream-50'
                }`}
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-sage-500" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-bark-800">{primary}</p>
                  <p className="truncate text-[10px] text-bark-400">{secondary}</p>
                </div>
              </button>
            );
          })}
          <div className="border-t border-bark-50 px-2.5 py-1 text-[9px] text-bark-300">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
