import { ShieldCheck } from 'lucide-react';

/**
 * Safepay payment-method mark. A text wordmark is used until the official logo from Safepay's
 * media kit is added (swap it in here only).
 */
export function SafepayMark() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0b1f3a] px-2.5 py-1 text-sm font-semibold tracking-tight text-white">
      <ShieldCheck aria-hidden className="size-4 text-emerald-300" />
      safepay
    </span>
  );
}
