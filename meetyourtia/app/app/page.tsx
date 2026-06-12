'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav, FAB, EmptyState, Card } from '@/components/tia/shared';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-0 pb-24">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-border-1">
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">
          Home
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Welcome Card */}
        <Card shimmer className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-deep flex items-center justify-center flex-shrink-0">
              <span className="text-xl">👋</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-light text-text-primary mb-1">
                Welcome to Tia
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your executive assistant is ready. Start by capturing your first task.
              </p>
            </div>
          </div>
        </Card>

        {/* Empty State */}
        <EmptyState
          icon="📋"
          title="No tasks yet"
          description="Tap the mic button below to capture your first task by voice, or type it in."
          action={{
            label: 'Capture a task',
            onClick: () => router.push('/app/voice'),
          }}
        />
      </div>

      {/* FAB - Voice Capture */}
      <FAB onClick={() => router.push('/app/voice')} icon="🎙" />

      {/* Bottom Navigation */}
      <BottomNav
        pathname={pathname}
        onNavigate={(tab) => {
          if (tab === 'tasks') router.push('/app/tasks');
          if (tab === 'people') router.push('/app/people');
        }}
      />
    </div>
  );
}
