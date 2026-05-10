'use client';

import { useState } from 'react';
import { Button, Input, Chip, ProgressBar } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

export default function OnboardingAbout() {
  const router = useRouter();
  const [assistantName, setAssistantName] = useState('Tia');
  const [customName, setCustomName] = useState('');
  const [role, setRole] = useState('');

  const nameOptions = ['Tia', 'Aria', 'Maya', 'Nova', 'Lea'];
  const roleOptions = [
    { id: 'pm', icon: '📱', title: 'Product Manager', sub: 'Teams, sprints, stakeholders, roadmaps' },
    { id: 'doctor', icon: '🩺', title: 'Doctor / Clinician', sub: 'Patient follow-ups, referrals, clinical tasks' },
    { id: 'founder', icon: '🚀', title: 'Founder / Executive', sub: 'Running a business across every function' },
    { id: 'other', icon: '⚡', title: 'Something else', sub: 'I\'ll figure it out from how you work' },
  ];

  const selectedName = customName || assistantName;
  const canContinue = role !== '';

  const handleContinue = () => {
    // Store in session storage for now
    sessionStorage.setItem('onboarding_assistant_name', selectedName);
    sessionStorage.setItem('onboarding_role', role);
    router.push('/app/onboarding/world');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <ProgressBar progress={20} label="STEP 1 OF 4 — ABOUT YOU" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {/* Section 1: Name */}
        <div className="mb-10">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            What should I call myself?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            This is the name I'll use when I reach out to people on your behalf.
          </p>

          {/* Name Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {nameOptions.map((name) => (
              <Chip
                key={name}
                selected={assistantName === name && !customName}
                onClick={() => {
                  setAssistantName(name);
                  setCustomName('');
                }}
              >
                {name}
              </Chip>
            ))}
          </div>

          {/* Custom Input */}
          <Input
            placeholder="Or type a custom name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>

        {/* Section 2: Role */}
        <div className="mb-8">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            What do you do?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            I'll tailor how I work — tasks, people, priorities — to match your world.
          </p>

          {/* Role Options */}
          <div className="space-y-2">
            {roleOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setRole(option.id)}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-smooth card-shimmer ${
                  role === option.id
                    ? 'bg-[#151008] border-gold/30'
                    : 'bg-surface-2 border-border-2 hover:border-border-1'
                }`}
              >
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-normal tracking-tighter-01 ${
                    role === option.id ? 'text-text-primary' : 'text-[#bbb]'
                  }`}>
                    {option.title}
                  </div>
                  <div className="text-xs text-[#333] leading-snug mt-0.5">
                    {option.sub}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full border-2 ${
                  role === option.id
                    ? 'bg-gold border-gold shadow-dot-gold'
                    : 'border-text-ghost bg-transparent'
                }`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-6 space-y-2">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
        >
          Continue →
        </Button>
        <button
          onClick={() => router.push('/app/onboarding/world')}
          className="w-full text-xs text-[#222] hover:text-text-muted text-center py-2 transition-smooth"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
