'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        const firstRest = data.user?.organizations?.[0]?.restaurants?.[0];
        if (firstRest) {
          router.push(`/dashboard/${firstRest.id}`);
        } else {
          router.push('/signup');
        }
      } catch {
        router.push('/login');
      }
    }

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC]">
      <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

