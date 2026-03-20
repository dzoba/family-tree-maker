import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { Person } from '../types';

/* ------------------------------------------------------------------ */
/*  Fix default marker icon paths for bundler environments             */
/* ------------------------------------------------------------------ */
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/* ------------------------------------------------------------------ */
/*  Custom colored marker icons via SVG data-URIs                      */
/* ------------------------------------------------------------------ */
function createColoredIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 22 12.5 41 12.5 41S25 22 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#fff" opacity="0.9"/>
    </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });
}

const birthIcon = createColoredIcon('#5C8A5C'); // sage-500
const deathIcon = createColoredIcon('#8A5E42'); // bark-600

/* ------------------------------------------------------------------ */
/*  Geocoding types & helpers                                          */
/* ------------------------------------------------------------------ */
interface LatLng {
  lat: number;
  lng: number;
}

interface GeocodedMarker {
  personId: string;
  personName: string;
  type: 'birth' | 'death';
  place: string;
  date?: string;
  coords: LatLng;
}

const CACHE_KEY = 'ftm_geocode_cache';

function loadCache(): Record<string, LatLng | null> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, LatLng | null>;
  } catch {
    /* ignore corrupt cache */
  }
  return {};
}

function saveCache(cache: Record<string, LatLng | null>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full — silently ignore */
  }
}

async function geocodePlace(place: string): Promise<LatLng | null> {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: place,
    format: 'json',
    limit: '1',
  })}`;

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'FamilyTreeMaker/1.0' },
  });
  if (!resp.ok) return null;

  const data: Array<{ lat: string; lon: string }> = await resp.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */
interface MapViewProps {
  people: Person[];
  onSelectPerson: (personId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  MapView component                                                  */
/* ------------------------------------------------------------------ */
export default function MapView({ people, onSelectPerson }: MapViewProps) {
  const [geocodeCache, setGeocodeCache] = useState<Record<string, LatLng | null>>(loadCache);
  const [geocodeStatus, setGeocodeStatus] = useState<{ active: boolean; done: number; total: number }>({
    active: false,
    done: 0,
    total: 0,
  });
  const abortRef = useRef(false);

  // Collect all unique places that need geocoding
  const allPlaces = useMemo(() => {
    const places = new Set<string>();
    for (const p of people) {
      if (p.birthPlace) places.add(p.birthPlace);
      if (p.deathPlace) places.add(p.deathPlace);
    }
    return places;
  }, [people]);

  // Derive which places still need geocoding
  const uncachedPlaces = useMemo(
    () => [...allPlaces].filter((pl) => !(pl in geocodeCache)),
    [allPlaces, geocodeCache],
  );

  // Geocode places we haven't seen yet
  useEffect(() => {
    if (uncachedPlaces.length === 0) return;

    abortRef.current = false;
    let cancelled = false;

    async function run() {
      const total = uncachedPlaces.length;
      setGeocodeStatus({ active: true, done: 0, total });

      const updatedCache: Record<string, LatLng | null> = {};
      let done = 0;

      for (const place of uncachedPlaces) {
        if (cancelled || abortRef.current) break;

        const result = await geocodePlace(place);
        updatedCache[place] = result;
        done++;
        setGeocodeStatus({ active: true, done, total });

        // Respect Nominatim rate limit: max 1 req/sec
        if (done < total) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      }

      if (!cancelled) {
        setGeocodeCache((prev) => {
          const merged = { ...prev, ...updatedCache };
          saveCache(merged);
          return merged;
        });
        setGeocodeStatus((prev) => ({ ...prev, active: false }));
      }
    }

    run();

    return () => {
      cancelled = true;
      abortRef.current = true;
    };
  }, [uncachedPlaces]);

  // Build marker data
  const { markers, unlocated } = useMemo(() => {
    const located: GeocodedMarker[] = [];
    const notFound: Array<{ personId: string; personName: string; type: 'birth' | 'death'; place: string }> = [];

    for (const person of people) {
      const name = `${person.firstName} ${person.lastName}`;

      if (person.birthPlace) {
        const coords = geocodeCache[person.birthPlace];
        if (coords) {
          located.push({
            personId: person.id,
            personName: name,
            type: 'birth',
            place: person.birthPlace,
            date: person.birthDate,
            coords,
          });
        } else if (geocodeCache[person.birthPlace] === null) {
          notFound.push({ personId: person.id, personName: name, type: 'birth', place: person.birthPlace });
        }
      }

      if (person.deathPlace) {
        const coords = geocodeCache[person.deathPlace];
        if (coords) {
          located.push({
            personId: person.id,
            personName: name,
            type: 'death',
            place: person.deathPlace,
            date: person.deathDate,
            coords,
          });
        } else if (geocodeCache[person.deathPlace] === null) {
          notFound.push({ personId: person.id, personName: name, type: 'death', place: person.deathPlace });
        }
      }
    }

    return { markers: located, unlocated: notFound };
  }, [people, geocodeCache]);

  // Compute map center & bounds
  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [30, 0];
    const avgLat = markers.reduce((s, m) => s + m.coords.lat, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.coords.lng, 0) / markers.length;
    return [avgLat, avgLng];
  }, [markers]);

  const bounds = useMemo(() => {
    if (markers.length < 2) return undefined;
    return L.latLngBounds(markers.map((m) => [m.coords.lat, m.coords.lng]));
  }, [markers]);

  const handleViewInTree = useCallback(
    (personId: string) => {
      onSelectPerson(personId);
    },
    [onSelectPerson],
  );

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

  // No places at all
  const hasAnyPlaces = allPlaces.size > 0;

  if (people.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-bark-400">
        No people in the tree yet.
      </div>
    );
  }

  if (!hasAnyPlaces) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-bark-400">
        <MapPin className="h-8 w-8" />
        <p className="text-sm">No places recorded yet.</p>
        <p className="text-xs">Add birth or death places to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Geocoding progress bar */}
      {geocodeStatus.active && (
        <div className="absolute left-0 right-0 top-0 z-[1000] bg-cream-100/95 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-bark-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-600" />
            <span>
              Locating places... {geocodeStatus.done}/{geocodeStatus.total}
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-bark-100">
            <div
              className="h-full rounded-full bg-sage-500 transition-all duration-300"
              style={{
                width: `${geocodeStatus.total > 0 ? (geocodeStatus.done / geocodeStatus.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative flex-1">
        <MapContainer
          center={center}
          zoom={markers.length === 0 ? 2 : markers.length === 1 ? 10 : 4}
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
          className="h-full w-full"
          style={{ background: '#FEFDFB' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, idx) => (
            <Marker
              key={`${marker.personId}-${marker.type}-${idx}`}
              position={[marker.coords.lat, marker.coords.lng]}
              icon={marker.type === 'birth' ? birthIcon : deathIcon}
            >
              <Popup>
                <div className="min-w-[180px] font-sans">
                  <p className="text-sm font-semibold text-bark-800">{marker.personName}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        marker.type === 'birth' ? 'bg-sage-500' : 'bg-bark-500'
                      }`}
                    />
                    <span className="text-bark-600">
                      {marker.type === 'birth' ? 'Born' : 'Died'}
                    </span>
                  </div>
                  {marker.date && (
                    <p className="mt-0.5 text-xs text-bark-500">{formatDate(marker.date)}</p>
                  )}
                  <p className="mt-0.5 text-xs text-bark-400">{marker.place}</p>
                  <button
                    className="mt-2 rounded bg-sage-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-sage-700"
                    onClick={() => handleViewInTree(marker.personId)}
                  >
                    View in tree
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-bark-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs text-bark-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sage-500" />
            Birth
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-bark-500" />
            Death
          </span>
        </div>
      </div>

      {/* Unlocated places sidebar */}
      {unlocated.length > 0 && !geocodeStatus.active && (
        <div className="absolute right-4 top-4 z-[1000] max-h-[60%] w-56 overflow-y-auto rounded-lg border border-bark-100 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="sticky top-0 flex items-center gap-1.5 border-b border-bark-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
            <AlertCircle className="h-3.5 w-3.5 text-bark-400" />
            <span className="text-xs font-semibold text-bark-600">Unlocated places</span>
          </div>
          <div className="p-2">
            {unlocated.map((item, idx) => (
              <button
                key={`${item.personId}-${item.type}-${idx}`}
                onClick={() => handleViewInTree(item.personId)}
                className="flex w-full flex-col rounded px-2 py-1.5 text-left transition-colors hover:bg-cream-100"
              >
                <span className="text-xs font-medium text-bark-700">{item.personName}</span>
                <span className="text-[10px] text-bark-400">
                  {item.type === 'birth' ? 'Born' : 'Died'} — {item.place}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
