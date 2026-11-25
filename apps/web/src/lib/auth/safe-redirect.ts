/**
 * Only same-site paths may be used as "return to" targets after sign-in; anything else
 * (absolute URLs, protocol-relative "//evil.com") would turn the sign-in page into an
 * open redirect.
 */
export function safeReturnPath(candidate: string | null | undefined, fallback: string): string {
  if (candidate === null || candidate === undefined) {
    return fallback;
  }
  const isSameSitePath =
    candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.startsWith('/\\');
  if (!isSameSitePath) {
    return fallback;
  }
  return candidate;
}
