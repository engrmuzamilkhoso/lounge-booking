/**
 * Google Sign-In configuration, readable from Server and Client Components alike.
 * (Values exported from a 'use client' file reach Server Components as references, not values.)
 */
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const isGoogleSignInEnabled = googleClientId !== '';
