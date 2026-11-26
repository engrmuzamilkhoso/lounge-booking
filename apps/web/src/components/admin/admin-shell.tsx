'use client';

import {
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FolderTree,
  HelpCircle,
  IdCard,
  KeyRound,
  LayoutDashboard,
  List,
  LogOut,
  type LucideIcon,
  Menu,
  Package,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { signOutAction } from '@/lib/actions/auth-actions';
import type { AdminIconName, AdminNavGroup } from '@/lib/admin/navigation';
import { cn } from '@/lib/cn';

const icons: Record<AdminIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  bookings: CalendarCheck,
  scan: ScanLine,
  memberships: IdCard,
  users: UsersRound,
  roles: ShieldCheck,
  permissions: KeyRound,
  services: Sparkles,
  products: Package,
  categories: FolderTree,
  cards: CreditCard,
  membershipTypes: BadgeCheck,
  lookups: List,
  faq: HelpCircle,
  audit: ClipboardList,
};

interface AdminShellProps {
  navigation: AdminNavGroup[];
  user: { name: string; email: string; avatarUrl: string | null };
  children: ReactNode;
}

/** Admin layout: sidebar navigation (a drawer on small screens) and the page content. */
export function AdminShell({ navigation, user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  // The drawer closes on navigation because it is tied to the path it was opened on.
  const isDrawerOpen = openedAt === pathname;

  const sidebar = (
    <nav aria-label="Admin" className="flex flex-col gap-6 px-3 py-5">
      {navigation.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-semibold tracking-wider text-gold-300/80 uppercase">
            {group.label}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {group.links.map((link) => {
              const Icon = icons[link.icon];
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-gold-500 font-medium text-white'
                        : 'text-stone-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-espresso-900 lg:flex">
        <SidebarBrand />
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setOpenedAt(null);
            }}
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col overflow-y-auto bg-espresso-900">
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand />
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-2 text-stone-200 hover:bg-white/10"
                onClick={() => {
                  setOpenedAt(null);
                }}
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-espresso-900 hover:bg-stone-100 lg:hidden"
            onClick={() => {
              setOpenedAt(pathname);
            }}
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <Link
            href="/"
            className="hidden text-sm text-stone-500 hover:text-espresso-900 sm:inline lg:ml-0"
          >
            View website
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {user.avatarUrl !== null && (
              <Image
                src={user.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
              />
            )}
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-medium text-espresso-900">{user.name}</p>
              <p className="max-w-48 truncate text-xs text-stone-500">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-espresso-900"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-6 py-5">
      <Image
        src="/images/logo.png"
        alt="Majestic"
        width={120}
        height={32}
        className="h-8 w-auto brightness-0 invert"
      />
      <span className="rounded bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
        Admin
      </span>
    </Link>
  );
}
