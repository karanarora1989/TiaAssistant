'use client';

import { Button } from '@/components/tia/shared';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#0a0a0a]">
      {/* Navigation */}
      <nav className="sticky top-0 bg-[#fafaf8]/80 backdrop-blur-sm border-b border-[#e0e0e0] z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a96e] to-[#906030] flex items-center justify-center">
              <span className="text-white font-light text-lg">T</span>
            </div>
            <span className="font-medium text-lg">Tia</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#444] hover:text-[#0a0a0a]">Features</a>
            <a href="#pricing" className="text-sm text-[#444] hover:text-[#0a0a0a]">Pricing</a>
          </div>
          
          <button
            onClick={() => router.push('/sign-up')}
            className="px-6 py-2 bg-[#0a0a0a] text-white rounded-full text-sm font-medium hover:bg-[#1a1a1a] transition-smooth"
          >
            Start for free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-light tracking-tighter-03 mb-6 leading-tight">
          Your tasks.<br />
          Finally handled.
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-full text-sm flex items-center gap-2">
            <span>🎙</span> Capture by voice
          </div>
          <div className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-full text-sm flex items-center gap-2">
            <span>📋</span> Track everything
          </div>
          <div className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-full text-sm flex items-center gap-2">
            <span>✓</span> Close every loop
          </div>
          <div className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-full text-sm flex items-center gap-2">
            <span>🧠</span> Learns who you are
          </div>
        </div>
        
        <button
          onClick={() => router.push('/sign-up')}
          className="px-8 py-4 bg-gradient-to-r from-[#c9a96e] to-[#906030] text-white rounded-2xl text-lg font-medium shadow-lg hover:shadow-xl transition-smooth mb-2"
        >
          Start for free
        </button>
        
        <p className="text-sm text-[#888]">Free up to 5 tasks. No card needed.</p>
      </section>

      {/* Pain Points */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-light text-center mb-12">Tasks fall through the cracks.</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: '⟳', text: 'Too many conversations' },
            { icon: '↓', text: 'Promises forgotten' },
            { icon: '#', text: 'Tools too heavy' },
            { icon: '○', text: 'Loops never close' },
            { icon: '🔕', text: 'No one follows up' },
            { icon: '📅', text: 'Deadlines missed' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-[#e0e0e0] rounded-2xl text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="text-sm text-[#444]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-light text-center mb-12">Why Tia is the best assistant you could have</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: 'Capture in seconds',
              description: 'Voice or text. Tell Tia what happened in a meeting. She extracts who\'s doing what, by when.',
              icon: '🎙',
            },
            {
              title: 'Nothing goes stale',
              description: 'Carry-over tracking shows what\'s aging. Visual cues help you prioritize without guilt.',
              icon: '📊',
            },
            {
              title: 'She learns who you are',
              description: 'Your team, sensitivities, how you work. Tia builds a model of you and gets sharper every day.',
              icon: '🧠',
            },
            {
              title: 'Work + personal together',
              description: 'One place for everything. Tia keeps them separate but you never switch contexts.',
              icon: '📋',
            },
            {
              title: 'Close loops in one breath',
              description: 'Voice an update after a call. Tia updates multiple tasks at once. Swipe done when finished.',
              icon: '✓',
            },
            {
              title: 'Always on, never annoying',
              description: 'Morning brief at 7am. EOD nudge at 6pm. In-app only. No spam.',
              icon: '🔔',
            },
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-white border border-[#e0e0e0] rounded-3xl">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
              <p className="text-[#666] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-light text-center mb-12">Simple pricing.</h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-8 bg-white border border-[#e0e0e0] rounded-3xl">
            <h3 className="text-2xl font-medium mb-2">Free</h3>
            <p className="text-4xl font-light mb-6">₹0</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-[#666]">Up to 5 open tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-[#666]">Voice capture (Web Speech API)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-[#666]">Text capture</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-[#666]">Basic features</span>
              </li>
            </ul>
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full py-3 border-2 border-[#0a0a0a] text-[#0a0a0a] rounded-2xl font-medium hover:bg-[#0a0a0a] hover:text-white transition-smooth"
            >
              Get started
            </button>
          </div>
          
          <div className="p-8 bg-gradient-to-br from-[#c9a96e] to-[#906030] text-white rounded-3xl relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
              Popular
            </div>
            <h3 className="text-2xl font-medium mb-2">Pro</h3>
            <p className="text-4xl font-light mb-1">₹499<span className="text-lg">/month</span></p>
            <p className="text-sm opacity-80 mb-6">or ₹3,999/year (save 33%)</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span className="text-sm">Unlimited tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span className="text-sm">Premium voice (Deepgram + ElevenLabs)</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <span>✓</span>
                <span className="text-sm">7-day free trial</span>
              </li>
            </ul>
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full py-3 bg-white text-[#906030] rounded-2xl font-medium hover:bg-white/90 transition-smooth"
            >
              Start free trial
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-light mb-8">Stop letting tasks disappear.</h2>
        <button
          onClick={() => router.push('/sign-up')}
          className="px-8 py-4 bg-gradient-to-r from-[#c9a96e] to-[#906030] text-white rounded-2xl text-lg font-medium shadow-lg hover:shadow-xl transition-smooth"
        >
          Start for free
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e0e0e0] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-[#888]">
            <span>Tia</span>
            <a href="#" className="hover:text-[#0a0a0a]">Privacy</a>
            <a href="#" className="hover:text-[#0a0a0a]">Terms</a>
            <a href="#" className="hover:text-[#0a0a0a]">Contact</a>
          </div>
          <p className="text-sm text-[#888]">© 2026 Tia</p>
        </div>
      </footer>
    </div>
  );
}
