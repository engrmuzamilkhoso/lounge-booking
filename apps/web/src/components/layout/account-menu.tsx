'use client';

import { CalendarCheck, ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SessionSummary } from '@/app/api/session/route';
import { ButtonLink } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { signOutAction } from '@/lib/actions/auth-actions';

type SessionState = { status: 'loading' } | { status: 'ready'; session: SessionSummary };

function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const pathname = usePathname();

  // Re-checked on navigation so the menu updates after signing in or out.
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/session', { cache: 'no-store' })
      .then((response) => response.json() as Promise<SessionSummary>)
      .then((session) => {
        if (!isCancelled) {
          setState({ status: 'ready', session });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setState({ status: 'ready', session: { user: null } });
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  return state;
}

/** "Sign in" for visitors; name with a dropdown for signed-in users. */
export function AccountMenu() {
  const state = useSession();

  if (state.status === 'loading') {
    return <Skeleton className="h-9 w-24" />;
  }
  if (state.session.user === null) {
    return (
      <ButtonLink href="/signin" variant="ghost" size="sm">
        Sign in
      </ButtonLink>
    );
  }
  return <UserDropdown user={state.session.user} />;
}

function UserDropdown({ user }: { user: NonNullable<SessionSummary['user']> }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initial = user.name.charAt(0).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current !== null && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm font-medium text-espresso-900 hover:bg-stone-100"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-espresso-900 text-xs font-semibold text-gold-100">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
        <ChevronDown aria-hidden className="size-4 text-stone-500" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-raised"
        >
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-espresso-900">{user.name}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
          </div>
          {user.isStaff && (
            <MenuLink href="/admin" icon={LayoutDashboard} label="Admin panel" onSelect={close} />
          )}
          <MenuLink href="/my-bookings" icon={CalendarCheck} label="My bookings" onSelect={close} />
          <MenuLink href="/account" icon={UserRound} label="Account settings" onSelect={close} />
          <form action={signOutAction} className="border-t border-stone-100">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              <LogOut aria-hidden className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onSelect,
}: {
  href: string;
  icon: typeof LogOut;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </Link>
  );
}
