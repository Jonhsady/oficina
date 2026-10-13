'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccess } from '@/lib/session';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getAccess() ? '/ordens' : '/login');
  }, [router]);
  return null;
}
