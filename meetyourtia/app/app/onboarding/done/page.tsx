'use client';

import { useState } from 'react';
import { Button, Card, LoadingSpinner } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

export default function OnboardingDone() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  // Get all onboarding data from session storage
  const assistantName = typeof window !== 'undefined' 
    ? sessionStorage.getItem('onboarding_assistant_name') || 'Tia'
    : 'Tia';
  const role = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboarding_role') || 'other'
    : 'other';
  const peopleStr = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboarding_people') || '[]'
    : '[]';
  const people = JSON.parse(peopleStr);
  const communicationStyle = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboarding_communication_style') || 'warm'
    : 'warm';

  const roleLabels: Record<string, string> = {
    pm: 'Product Manager',
    doctor: 'Doctor / Clinician',
    founder: 'Founder / Executive',
    other: 'Professional',
  };

  const styleLabels: Record<string, string> = {
    brief: 'Brief and direct',
    warm: 'Warm and conversational',
    formal: 'Professional and formal',
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Call onboarding completion API
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName,
          role,
          people,
          phoneNumber: sessionStorage.getItem('onboarding_phone_number') || '',
          communicationStyle,
          sensitiveHandling: sessionStorage.getItem('onboarding_sensitive_handling') || '',
          sensitivityLevel: sessionStorage.getItem('onboarding_sensitivity_level') || 'careful',
          nudgeFrequency: sessionStorage.getItem('onboarding_nudge_frequency') || 'daily',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Clear session storage
      sessionStorage.clear();

      // Redirect to app home
      router.push('/app');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Something went wrong. Please try again.');
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo Mark */}
      <div className="w-[76px] h-[76px] rounded-[22px] bg-gradient-to-br from-[#1a140a] to-surface-0 border border-[#2a1f0a] flex items-center justify-center mb-6 relative card-shimmer-strong shadow-gold-subtle">
        <span className="text-[32px] font-light text-gold">T</span>
      </div>

      {/* Headline */}
      <h1 className="text-[28px] font-light tracking-tighter-03 text-center mb-3 leading-tight">
        <span className="text-gold italic">{assistantName}</span> is ready.
      </h1>

      {/* Subtext */}
      <p className="text-sm text-[#3a3a3a] text-center leading-relaxed max-w-[280px] mb-8">
        Here's what I know about you. You can update this anytime in Settings.
      </p>

      {/* Summary Card */}
      <Card shimmer className="w-full max-w-md mb-8">
        <h3 className="text-sm font-medium text-gold mb-4 tracking-tighter-01">What I know</h3>
        
        <div className="space-y-4">
          <div>
            <div className="text-xs text-text-secondary mb-1">Assistant name</div>
            <div className="text-sm text-text-primary">{assistantName}</div>
          </div>

          <div>
            <div className="text-xs text-text-secondary mb-1">Your role</div>
            <div className="text-sm text-text-primary">{roleLabels[role]}</div>
          </div>

          {people.length > 0 && (
            <div>
              <div className="text-xs text-text-secondary mb-1">Key people</div>
              <div className="text-sm text-text-primary">
                {people.map((p: any, i: number) => (
                  <span key={i}>
                    {p.name}
                    {p.role && ` (${p.role})`}
                    {i < people.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-text-secondary mb-1">Communication style</div>
            <div className="text-sm text-text-primary">{styleLabels[communicationStyle]}</div>
          </div>
        </div>
      </Card>

      {/* CTA Button */}
      <Button
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full max-w-md flex items-center justify-center gap-2"
        size="lg"
      >
        {isCompleting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Setting up...</span>
          </>
        ) : (
          'Start capturing tasks →'
        )}
      </Button>

      {/* Note */}
      <p className="text-[11px] text-text-invisible text-center tracking-wider-03 mt-4">
        Update anytime in Settings → {assistantName}
      </p>
    </div>
  );
}
