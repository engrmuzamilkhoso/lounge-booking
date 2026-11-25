import type { ReactNode } from 'react';
import { Container } from '@/components/ui/container';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Title band at the top of inner pages: consistent heading size, spacing and background. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="border-b border-stone-200 bg-gradient-to-b from-gold-50 to-stone-50">
      <Container className="py-12 sm:py-16">
        {eyebrow !== undefined && (
          <p className="text-sm font-semibold tracking-wider text-gold-600 uppercase">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description !== undefined && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">{description}</p>
        )}
        {children}
      </Container>
    </section>
  );
}
