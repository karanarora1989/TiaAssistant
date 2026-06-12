'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavProgress() {
  const pathname = usePathname();
  const isFirst = useRef(true);
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // Skip animation on initial page load
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    setComplete(false);
    setVisible(true);

    const t1 = setTimeout(() => setComplete(true), 50);
    const t2 = setTimeout(() => setVisible(false), 420);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gold"
      style={{
        width: complete ? '100%' : '30%',
        transition: complete ? 'width 200ms ease-out' : 'none',
      }}
    />
  );
}
