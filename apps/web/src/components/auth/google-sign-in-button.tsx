'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { googleSignInAction } from '@/lib/actions/auth-actions';
import { googleClientId, isGoogleSignInEnabled } from '@/lib/auth/google-config';

/** Minimal typing of the Google Identity Services script (https://accounts.google.com/gsi/client). */
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: 'popup';
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: 'outline';
          size: 'large';
          text: 'signin_with' | 'signup_with';
          shape: 'rectangular';
          width: number;
          logo_alignment: 'center';
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

interface GoogleSignInButtonProps {
  mode: 'signin' | 'signup';
  returnTo: string | null;
}

/**
 * Google's official "Sign in with Google" button. Google returns a signed ID token, which is
 * sent to our API and verified there with Google; nothing here is trusted on its own.
 * Renders nothing when no Client ID is configured, rather than a button that cannot work.
 */
export function GoogleSignInButton({ mode, returnTo }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleCredential = useCallback(
    (response: { credential: string }) => {
      startTransition(async () => {
        const result = await googleSignInAction(response.credential, returnTo);
        if (!result.ok) {
          toast.error('Google sign-in failed', result.message);
        }
      });
    },
    [returnTo, toast],
  );

  useEffect(() => {
    const google = window.google;
    const container = containerRef.current;
    if (!isScriptLoaded || google === undefined || container === null) {
      return;
    }
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      ux_mode: 'popup',
    });
    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: mode === 'signin' ? 'signin_with' : 'signup_with',
      shape: 'rectangular',
      width: Math.min(container.offsetWidth, 400),
      logo_alignment: 'center',
    });
  }, [isScriptLoaded, handleCredential, mode]);

  if (!isGoogleSignInEnabled) {
    return null;
  }

  return (
    <div className="relative">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => {
          setIsScriptLoaded(true);
        }}
      />
      <div ref={containerRef} className="flex min-h-11 w-full justify-center" />
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/90 text-sm text-stone-600">
          <Spinner />
          Signing you in…
        </div>
      )}
    </div>
  );
}
