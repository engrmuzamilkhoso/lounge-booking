import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies the `x-sfpy-signature` header of a Safepay webhook: a hex HMAC-SHA512 made with the
 * endpoint's shared secret.
 *
 * Safepay's official Node SDK signs `JSON.stringify(body.data)`, while the docs describe signing
 * the payload; both inputs are checked against the same secret. Either way the webhook is only a
 * trigger: the payment is re-fetched from Safepay's API before anything changes.
 */
export function isValidSafepayWebhookSignature(params: {
  rawBody: Buffer;
  parsedBody: unknown;
  signatureHeader: string | undefined;
  webhookSecret: string;
}): boolean {
  const { rawBody, parsedBody, signatureHeader, webhookSecret } = params;
  if (signatureHeader === undefined || signatureHeader === '' || webhookSecret === '') {
    return false;
  }

  const candidates: Buffer[] = [rawBody];
  if (typeof parsedBody === 'object' && parsedBody !== null && 'data' in parsedBody) {
    candidates.push(Buffer.from(JSON.stringify(parsedBody.data)));
  }

  return candidates.some((signedContent) =>
    signaturesMatch(hmacSha512Hex(webhookSecret, signedContent), signatureHeader),
  );
}

function hmacSha512Hex(secret: string, content: Buffer): string {
  return createHmac('sha512', secret).update(content).digest('hex');
}

/** Constant-time comparison so the signature cannot be guessed byte by byte from timings. */
function signaturesMatch(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected, 'utf8');
  const receivedBytes = Buffer.from(received.trim().toLowerCase(), 'utf8');
  if (expectedBytes.length !== receivedBytes.length) {
    return false;
  }
  return timingSafeEqual(expectedBytes, receivedBytes);
}
