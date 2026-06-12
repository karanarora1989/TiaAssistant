import { NavProgress } from '@/components/tia/NavProgress';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavProgress />
      {children}
    </>
  );
}
