'use client';

import { Button } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo Mark */}
      <div className="w-[76px] h-[76px] rounded-[22px] bg-gradient-to-br from-[#1a140a] to-surface-0 border border-[#2a1f0a] flex items-center justify-center mb-6 relative card-shimmer-strong shadow-gold-subtle">
        <span className="text-[32px] font-light text-gold">T</span>
      </div>

      {/* Headline */}
      <h1 className="text-[28px] font-light tracking-tighter-03 text-center mb-3 leading-tight">
        Meet <span className="text-gold italic">Tia</span>.<br />
        Your <span className="text-gold italic">executive assistant</span>.
      </h1>

      {/* Subtext */}
      <p className="text-sm text-[#3a3a3a] text-center leading-relaxed max-w-[280px] mb-8">
        Before I start working for you, let me show you what I do — then I'll ask a few questions to make this feel like yours.
      </p>

      {/* Capability Cards */}
      <div className="w-full max-w-md space-y-[9px] mb-8">
        {[
          {
            icon: '🎙',
            bg: '#1a1208',
            border: '#2a1f0a',
            title: 'Capture by voice or text',
            description: 'Tell me what happened in a meeting or call. I extract who\'s doing what, by when — instantly.',
          },
          {
            icon: '📋',
            bg: '#080f18',
            border: '#0a1428',
            title: 'Work and personal, one place',
            description: 'Your office tasks and personal ones together. I keep them separate but you never switch modes.',
          },
          {
            icon: '🧠',
            bg: '#0d0818',
            border: '#160a2a',
            title: 'I learn who you are',
            description: 'Your team, sensitivities, how you like to work. I get sharper every day.',
          },
          {
            icon: '✓',
            bg: '#080f08',
            border: '#0a1a0a',
            title: 'Close every loop',
            description: 'Swipe done, voice an update after a call, or let me sweep your inbox at end of day.',
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-surface-2 border border-border-2 rounded-2xl p-4 flex gap-4 items-start card-shimmer"
          >
            <div
              className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}
            >
              {card.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-medium text-[#bbb] tracking-tighter-01 mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-[#333] leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        onClick={() => router.push('/app/onboarding/about')}
        className="w-full max-w-md mb-3"
        size="lg"
      >
        Set me up — 2 minutes
      </Button>

      {/* Note */}
      <p className="text-[11px] text-text-invisible text-center tracking-wider-03">
        No forms. Just a few questions.
      </p>
    </div>
  );
}
