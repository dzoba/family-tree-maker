import { useMemo } from 'react';
import { Baby, Heart, MapPin } from 'lucide-react';
import type { Person } from '../types';

interface TimelineViewProps {
  people: Person[];
  onSelectPerson: (personId: string) => void;
}

interface TimelineEvent {
  id: string;
  personId: string;
  personName: string;
  type: 'birth' | 'death';
  date: string;
  sortDate: number;
  place?: string;
}

export default function TimelineView({ people, onSelectPerson }: TimelineViewProps) {
  const { events, undated } = useMemo(() => {
    const evts: TimelineEvent[] = [];
    const undatedPeople: Person[] = [];

    for (const person of people) {
      const name = `${person.firstName} ${person.lastName}`;
      let hasDates = false;

      if (person.birthDate) {
        hasDates = true;
        evts.push({
          id: `${person.id}-birth`,
          personId: person.id,
          personName: name,
          type: 'birth',
          date: person.birthDate,
          sortDate: new Date(person.birthDate).getTime(),
          place: person.birthPlace,
        });
      }
      if (person.deathDate) {
        hasDates = true;
        evts.push({
          id: `${person.id}-death`,
          personId: person.id,
          personName: name,
          type: 'death',
          date: person.deathDate,
          sortDate: new Date(person.deathDate).getTime(),
          place: person.deathPlace,
        });
      }
      if (!hasDates) undatedPeople.push(person);
    }

    evts.sort((a, b) => a.sortDate - b.sortDate);
    return { events: evts, undated: undatedPeople };
  }, [people]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getYear = (dateStr: string) => {
    try { return new Date(dateStr).getFullYear(); } catch { return 0; }
  };

  let lastYear = 0;

  if (people.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-bark-400">
        No people in the tree yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h2 className="mb-6 font-serif text-2xl font-bold text-bark-800">Timeline</h2>

      {events.length === 0 ? (
        <p className="text-sm text-bark-500">No dates recorded yet. Add birth or death dates to see the timeline.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-bark-200" />

          <div className="space-y-1">
            {events.map((event) => {
              const year = getYear(event.date);
              const showYear = year !== lastYear;
              if (showYear) lastYear = year;

              return (
                <div key={event.id}>
                  {showYear && (
                    <div className="relative mb-2 mt-4 first:mt-0">
                      <div className="absolute left-2.5 h-3 w-3 rounded-full border-2 border-bark-300 bg-white" />
                      <span className="ml-10 text-xs font-bold text-bark-500">{year}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onSelectPerson(event.personId)}
                    className="group relative flex w-full items-start gap-3 rounded-lg py-2 pl-10 pr-3 text-left transition-colors hover:bg-cream-100"
                  >
                    <div
                      className={`absolute left-[15px] top-3.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        event.type === 'birth' ? 'bg-sage-500' : 'bg-bark-400'
                      }`}
                    />

                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        event.type === 'birth'
                          ? 'bg-sage-50 text-sage-600'
                          : 'bg-bark-100 text-bark-500'
                      }`}
                    >
                      {event.type === 'birth' ? <Baby className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-bark-800 group-hover:text-sage-700">
                          {event.personName}
                        </span>
                        <span className="text-bark-500">
                          {event.type === 'birth' ? ' was born' : ' passed away'}
                        </span>
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-bark-400">
                        <span>{formatDate(event.date)}</span>
                        {event.place && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {event.place}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-bark-400">
            No dates recorded
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPerson(p.id)}
                className="rounded-full bg-cream-200 px-2.5 py-1 text-xs text-bark-600 transition-colors hover:bg-sage-100"
              >
                {p.firstName} {p.lastName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
