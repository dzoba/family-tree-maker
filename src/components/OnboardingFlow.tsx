import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingFlowProps {
  onAddPerson: (person: { firstName: string; lastName: string; gender?: string; birthDate?: string }) => void;
  onSkip: () => void;
}

export default function OnboardingFlow({ onAddPerson, onSkip }: OnboardingFlowProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    onAddPerson({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender || undefined,
      birthDate: birthDate || undefined,
    });
  };

  return (
    <div className="w-[360px] rounded-2xl border border-bark-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-2 text-sage-600">
        <Sparkles className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Getting Started</span>
      </div>

      <h3 className="font-serif text-xl font-bold text-bark-800">
        Let's start with you
      </h3>
      <p className="mt-1 text-sm text-bark-500">
        Add yourself as the first person in your tree.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-bark-500">First Name</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-bark-200 bg-cream-50 px-3 py-2 text-sm text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Last Name</label>
            <input
              className="w-full rounded-lg border border-bark-200 bg-cream-50 px-3 py-2 text-sm text-bark-900 placeholder:text-bark-300 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Gender</label>
            <select
              className="w-full rounded-lg border border-bark-200 bg-cream-50 px-3 py-2 text-sm text-bark-900 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-bark-500">Birth Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-bark-200 bg-cream-50 px-3 py-2 text-sm text-bark-900 focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400/30"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!firstName.trim()}
          className="btn-primary w-full !py-2.5"
        >
          Add Me to the Tree
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <button
        onClick={onSkip}
        className="mt-3 w-full text-center text-xs text-bark-400 hover:text-bark-600"
      >
        or add someone else
      </button>
    </div>
  );
}
