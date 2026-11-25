import Image from 'next/image';
import { Logo } from '@/components/layout/logo';

/** Sign-in, sign-up and password pages: brand panel on large screens, focused form everywhere. */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-espresso-900 lg:block">
        <Image
          src="/images/reception.png"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso-950 via-espresso-900/60 to-espresso-900/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo inverted />
          <div>
            <p className="text-sm font-semibold tracking-wider text-gold-300 uppercase">
              Majestic Lounge
            </p>
            <p className="mt-3 max-w-md text-3xl leading-snug font-semibold text-white">
              Every journey deserves a touch of luxury.
            </p>
            <p className="mt-4 max-w-md text-stone-300">
              Book meet &amp; assist, lounge access and premier services at Jinnah International
              Airport.
            </p>
          </div>
        </div>
      </aside>

      <main id="main-content" className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
