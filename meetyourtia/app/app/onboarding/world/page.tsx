'use client';

import { useState } from 'react';
import { Button, Input, Textarea, ProgressBar } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

interface Person {
  name: string;
  role: string;
}

export default function OnboardingWorld() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([
    { name: '', role: '' },
    { name: '', role: '' },
  ]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sensitiveHandling, setSensitiveHandling] = useState('');
  const [sensitivityLevel, setSensitivityLevel] = useState<'careful' | 'critical'>('careful');

  const addPerson = () => {
    if (people.length < 4) {
      setPeople([...people, { name: '', role: '' }]);
    }
  };

  const updatePerson = (index: number, field: 'name' | 'role', value: string) => {
    const updated = [...people];
    updated[index][field] = value;
    setPeople(updated);
  };

  const handleContinue = () => {
    // Store in session storage
    const filledPeople = people.filter(p => p.name.trim() !== '');
    sessionStorage.setItem('onboarding_people', JSON.stringify(filledPeople));
    sessionStorage.setItem('onboarding_phone_number', phoneNumber);
    sessionStorage.setItem('onboarding_sensitive_handling', sensitiveHandling);
    sessionStorage.setItem('onboarding_sensitivity_level', sensitivityLevel);
    router.push('/app/onboarding/style');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <ProgressBar progress={50} label="STEP 2 OF 4 — YOUR WORLD" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {/* Section 1: People */}
        <div className="mb-10">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            Who are the key people in your world?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            I'll remember them, track tasks with them, and handle sensitive ones with extra care.
          </p>

          {/* Person Rows */}
          <div className="space-y-3 mb-4">
            {people.map((person, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Name (e.g. Karan)"
                  value={person.name}
                  onChange={(e) => updatePerson(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Role"
                  value={person.role}
                  onChange={(e) => updatePerson(index, 'role', e.target.value)}
                  className="w-[100px]"
                />
              </div>
            ))}
          </div>

          {/* Add Person Link */}
          {people.length < 4 && (
            <button
              onClick={addPerson}
              className="flex items-center gap-2 text-xs text-text-ghost hover:text-text-muted transition-smooth"
            >
              <span className="text-base">+</span>
              <span>Add another person</span>
            </button>
          )}
        </div>

        {/* Section 1.5: Your Phone Number */}
        <div className="mb-10">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            What's your phone number?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            I'll use this to call you with reminders for your tasks.
          </p>
          <Input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Section 2: Sensitive Handling */}
        <div className="mb-8">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            Anyone who needs special handling?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            Tell me who, and I'll flag tasks involving them before surfacing anything.
          </p>

          <Textarea
            placeholder="e.g. 'My CPO is very detail-oriented' or 'Dr. Singh prefers formal communication'"
            value={sensitiveHandling}
            onChange={(e) => setSensitiveHandling(e.target.value)}
            rows={3}
            className="mb-5"
          />

          {/* Sensitivity Level */}
          <div>
            <p className="text-[13px] text-text-secondary mb-3">Sensitivity level:</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSensitivityLevel('careful')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-smooth ${
                  sensitivityLevel === 'careful'
                    ? 'bg-[#151008] border-gold/30 text-gold'
                    : 'bg-surface-2 border-border-2 text-text-muted hover:border-border-1'
                }`}
              >
                <div className="text-sm font-medium">Careful</div>
                <div className="text-xs opacity-70 mt-1">Flag before acting</div>
              </button>
              <button
                onClick={() => setSensitivityLevel('critical')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-smooth ${
                  sensitivityLevel === 'critical'
                    ? 'bg-[#151008] border-gold/30 text-gold'
                    : 'bg-surface-2 border-border-2 text-text-muted hover:border-border-1'
                }`}
              >
                <div className="text-sm font-medium">Critical</div>
                <div className="text-xs opacity-70 mt-1">Always confirm first</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-6 space-y-2">
        <Button
          onClick={handleContinue}
          className="w-full"
        >
          Continue →
        </Button>
        <button
          onClick={() => router.push('/app/onboarding/style')}
          className="w-full text-xs text-[#222] hover:text-text-muted text-center py-2 transition-smooth"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
