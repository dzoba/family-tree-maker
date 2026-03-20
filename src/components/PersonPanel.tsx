import { useState, useEffect, useRef } from 'react';
import { X, Trash2, User, Calendar, MapPin, FileText, Heart, Camera, Check } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';
import { deleteField } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { uploadPersonPhoto } from '../lib/storage';
import type { Person } from '../types';
import toast from 'react-hot-toast';

interface PersonPanelProps {
  person: Person;
  people?: Person[];
  onUpdate: (personId: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete: (personId: string) => Promise<void>;
  onRemoveRelationship?: (personId: string, relatedId: string, type: 'spouse' | 'parent' | 'child') => Promise<void>;
  onClose: () => void;
}

export default function PersonPanel({
  person,
  people = [],
  onUpdate,
  onDelete,
  onRemoveRelationship,
  onClose,
}: PersonPanelProps) {
  const [form, setForm] = useState({
    firstName: person.firstName,
    lastName: person.lastName,
    maidenName: person.maidenName || '',
    gender: person.gender || '',
    birthDate: person.birthDate || '',
    deathDate: person.deathDate || '',
    birthPlace: person.birthPlace || '',
    deathPlace: person.deathPlace || '',
    notes: person.notes || '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formRef = useRef(form);
  formRef.current = form;

  // Sync form when switching to a different person
  useEffect(() => {
    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      maidenName: person.maidenName || '',
      gender: person.gender || '',
      birthDate: person.birthDate || '',
      deathDate: person.deathDate || '',
      birthPlace: person.birthPlace || '',
      deathPlace: person.deathPlace || '',
      notes: person.notes || '',
    });
    setShowDeleteConfirm(false);
    setSaveStatus('idle');
  }, [person.id]); // Only reset on person ID change, not every person data update

  // Auto-save with debounce
  const scheduleAutoSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(async () => {
      const f = formRef.current;
      if (!f.firstName) return; // Don't save with empty first name
      setSaveStatus('saving');
      try {
        const updates: Record<string, unknown> = {
          firstName: f.firstName,
          lastName: f.lastName,
          maidenName: f.maidenName || deleteField(),
          gender: f.gender || deleteField(),
          birthDate: f.birthDate || deleteField(),
          deathDate: f.deathDate || deleteField(),
          birthPlace: f.birthPlace || deleteField(),
          deathPlace: f.deathPlace || deleteField(),
          notes: f.notes || deleteField(),
        };
        await onUpdate(person.id, updates);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
  };

  // Cleanup debounce on unmount — flush pending save
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    scheduleAutoSave();
  };

  const handleDelete = async () => {
    await onDelete(person.id);
    onClose();
  };

  const { id: treeId } = useParams<{ id: string }>();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !treeId) return;
    setUploading(true);
    try {
      const url = await uploadPersonPhoto(treeId, person.id, file);
      await onUpdate(person.id, { photoUrl: url });
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const genderColor =
    person.gender === 'male'
      ? 'from-blue-400 to-blue-500'
      : person.gender === 'female'
        ? 'from-pink-400 to-pink-500'
        : 'from-bark-300 to-bark-400';

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-bark-100 bg-white shadow-lg">
      {/* Header with color accent */}
      <div className={`relative bg-gradient-to-r ${genderColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-white/80">
              Edit Person
            </span>
            {/* Auto-save status */}
            {saveStatus === 'saving' && (
              <span className="text-[10px] text-white/60">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/80">
                <Check className="h-2.5 w-2.5" /> Saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-0.5 truncate text-sm font-semibold text-white">
          {form.firstName} {form.lastName}
        </p>
      </div>

      {/* Form — compact */}
      <div className="flex-1 overflow-y-auto">
        {/* Photo section */}
        <div className="border-b border-bark-50 px-3 py-3">
          <div className="flex items-center gap-3">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full bg-cream-200 ring-2 ring-white"
            >
              {person.photoUrl ? (
                <img src={person.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-6 w-6 text-bark-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-bark-800">
                {form.firstName} {form.lastName}
              </p>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="text-[10px] font-medium text-sage-600 hover:text-sage-700"
              >
                {person.photoUrl ? 'Change photo' : 'Add photo'}
              </button>
            </div>
          </div>
        </div>

        {/* Identity section */}
        <div className="border-b border-bark-50 px-3 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
            <User className="h-3 w-3" />
            Identity
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">First Name</label>
              <input
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="First"
                autoComplete="off"
                data-1p-ignore
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Last Name</label>
              <input
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="Last"
                autoComplete="off"
                data-1p-ignore
              />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Maiden Name</label>
              <input
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.maidenName}
                onChange={(e) => update('maidenName', e.target.value)}
                placeholder="Optional"
                autoComplete="off"
                data-1p-ignore
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Gender</label>
              <select
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
              >
                <option value="">--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates section */}
        <div className="border-b border-bark-50 px-3 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
            <Calendar className="h-3 w-3" />
            Dates
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Born</label>
              <input
                type="date"
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.birthDate}
                onChange={(e) => update('birthDate', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Died</label>
              <input
                type="date"
                className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
                value={form.deathDate}
                onChange={(e) => update('deathDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Places section */}
        <div className="border-b border-bark-50 px-3 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
            <MapPin className="h-3 w-3" />
            Places
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Birth Place</label>
              <LocationAutocomplete
                value={form.birthPlace}
                onChange={(v) => update('birthPlace', v)}
                placeholder="Search city, country..."
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Death Place</label>
              <LocationAutocomplete
                value={form.deathPlace}
                onChange={(v) => update('deathPlace', v)}
                placeholder="Search city, country..."
              />
            </div>
          </div>
        </div>

        {/* Relationships — editable */}
        {(person.spouseIds.length > 0 || person.parentIds.length > 0 || person.childIds.length > 0) && (
          <div className="border-b border-bark-50 px-3 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
              <Heart className="h-3 w-3" />
              Relationships
            </div>
            <div className="space-y-1.5">
              {person.spouseIds.map((sid) => {
                const spouse = people.find((p) => p.id === sid);
                return (
                  <div key={sid} className="flex items-center justify-between rounded-md bg-red-50 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium text-red-600">Spouse</span>
                      <p className="truncate text-xs text-bark-700">{spouse ? `${spouse.firstName} ${spouse.lastName}` : 'Unknown'}</p>
                    </div>
                    {onRemoveRelationship && (
                      <button
                        onClick={() => onRemoveRelationship(person.id, sid, 'spouse')}
                        className="ml-1 rounded p-0.5 text-bark-400 hover:bg-red-100 hover:text-red-500"
                        title="Remove relationship"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {person.parentIds.map((pid) => {
                const parent = people.find((p) => p.id === pid);
                return (
                  <div key={pid} className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium text-blue-600">Parent</span>
                      <p className="truncate text-xs text-bark-700">{parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown'}</p>
                    </div>
                    {onRemoveRelationship && (
                      <button
                        onClick={() => onRemoveRelationship(person.id, pid, 'parent')}
                        className="ml-1 rounded p-0.5 text-bark-400 hover:bg-blue-100 hover:text-blue-500"
                        title="Remove relationship"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {person.childIds.map((cid) => {
                const child = people.find((p) => p.id === cid);
                return (
                  <div key={cid} className="flex items-center justify-between rounded-md bg-sage-50 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium text-sage-700">Child</span>
                      <p className="truncate text-xs text-bark-700">{child ? `${child.firstName} ${child.lastName}` : 'Unknown'}</p>
                    </div>
                    {onRemoveRelationship && (
                      <button
                        onClick={() => onRemoveRelationship(person.id, cid, 'child')}
                        className="ml-1 rounded p-0.5 text-bark-400 hover:bg-sage-100 hover:text-sage-700"
                        title="Remove relationship"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes section */}
        <div className="px-3 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-bark-400">
            <FileText className="h-3 w-3" />
            Notes
          </div>
          <textarea
            className="w-full rounded-md border border-bark-200 bg-cream-50 px-2 py-1.5 text-xs text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30 min-h-[60px] resize-y"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Notes..."
            data-1p-ignore
          />
        </div>
      </div>

      {/* Delete — compact */}
      <div className="border-t border-bark-100 px-3 py-2.5">
        {showDeleteConfirm ? (
          <div className="flex gap-1.5">
            <button
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-lg border border-bark-200 px-2 py-1.5 text-xs font-medium text-bark-600 hover:bg-cream-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
