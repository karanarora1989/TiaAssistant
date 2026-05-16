'use client';

import { useState } from 'react';
import { Button, ProgressBar } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

export default function OnboardingStyle() {
  const router = useRouter();
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [nudgeFrequency, setNudgeFrequency] = useState('');

  const styleOptions = [
    { id: 'brief', title: 'Brief and direct', sub: 'Get to the point. No fluff.' },
    { id: 'warm', title: 'Warm and conversational', sub: 'Friendly, like talking to a colleague.' },
    { id: 'formal', title: 'Professional and formal', sub: 'Structured, respectful tone.' },
  ];

  const nudgeOptions = [
    { id: 'daily', title: 'Daily', sub: 'Morning brief + EOD nudge every day' },
    { id: 'urgent', title: 'Only when urgent', sub: 'Just critical items and carry-overs' },
    { id: 'none', title: 'Leave me alone', sub: "I'll check in when I want to" },
  ];

  const canContinue = communicationStyle !== '' && nudgeFrequency !== '';

  const handleContinue = () => {
    // Store in session storage
    sessionStorage.setItem('onboarding_communication_style', communicationStyle);
    sessionStorage.setItem('onboarding_nudge_frequency', nudgeFrequency);
    router.push('/app/onboarding/people');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <ProgressBar progress={75} label="STEP 3 OF 4 — YOUR STYLE" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {/* Section 1: Communication Style */}
        <div className="mb-10">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            How do you like to be talked to?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            I'll match your preferred tone in all our interactions.
          </p>

          <div className="space-y-2">
            {styleOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setCommunicationStyle(option.id)}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-smooth card-shimmer ${
                  communicationStyle === option.id
                    ? 'bg-[#151008] border-gold/30'
                    : 'bg-surface-2 border-border-2 hover:border-border-1'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className={`text-sm font-normal tracking-tighter-01 ${
                    communicationStyle === option.id ? 'text-text-primary' : 'text-[#bbb]'
                  }`}>
                    {option.title}
                  </div>
                  <div className="text-xs text-[#333] leading-snug mt-0.5">
                    {option.sub}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full border-2 ${
                  communicationStyle === option.id
                    ? 'bg-gold border-gold shadow-dot-gold'
                    : 'border-text-ghost bg-transparent'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Nudge Frequency */}
        <div className="mb-8">
          <h2 className="text-[22px] font-light tracking-tighter-02 text-text-primary mb-2">
            When should I nudge you?
          </h2>
          <p className="text-[13px] text-[#333] leading-relaxed mb-5">
            I can send you reminders and updates based on your preference.
          </p>

          <div className="space-y-2">
            {nudgeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setNudgeFrequency(option.id)}
                className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-smooth card-shimmer ${
                  nudgeFrequency === option.id
                    ? 'bg-[#151008] border-gold/30'
                    : 'bg-surface-2 border-border-2 hover:border-border-1'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className={`text-sm font-normal tracking-tighter-01 ${
                    nudgeFrequency === option.id ? 'text-text-primary' : 'text-[#bbb]'
                  }`}>
                    {option.title}
                  </div>
                  <div className="text-xs text-[#333] leading-snug mt-0.5">
                    {option.sub}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full border-2 ${
                  nudgeFrequency === option.id
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
          onClick={() => router.push('/app/onboarding/done')}
          className="w-full text-xs text-[#222] hover:text-text-muted text-center py-2 transition-smooth"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
