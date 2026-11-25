'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-checks the payment a few times while Safepay is still finishing it. */
export function AutoRefresh({
  intervalMs,
  maxAttempts,
  attempt,
}: {
  intervalMs: number;
  maxAttempts: number;
  attempt: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (attempt >= maxAttempts) {
      return;
    }
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('attempt', String(attempt + 1));
      router.replace(`${url.pathname}${url.search}`);
    }, intervalMs);
    return () => {
      clearTimeout(timer);
    };
  }, [router, intervalMs, maxAttempts, attempt]);

  return null;
}
