import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  /** White version for dark backgrounds. */
  inverted?: boolean;
}

export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn('inline-flex shrink-0 items-center', className)}
      aria-label="Majestic Lounge home"
    >
      <Image
        src="/images/logo.png"
        alt="Majestic"
        width={136}
        height={36}
        priority
        className={cn('h-9 w-auto', inverted && 'brightness-0 invert')}
      />
    </Link>
  );
}
