import type { Environment } from '../../config/environment.js';

export type SafepayEnvironment = 'sandbox' | 'production';

export interface SafepayConfig {
  environment: SafepayEnvironment;
  apiBaseUrl: string;
  checkoutBaseUrl: string;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
}

/**
 * Hosts, as used by Safepay's official Node SDK (@sfpy/node-core 0.3.7):
 * API requests go to `*.api.getsafepay.com`; the hosted checkout lives under `/embedded/`.
 */
const HOSTS: Record<SafepayEnvironment, { api: string; checkout: string }> = {
  sandbox: {
    api: 'https://sandbox.api.getsafepay.com',
    checkout: 'https://sandbox.api.getsafepay.com/embedded/',
  },
  production: {
    api: 'https://api.getsafepay.com',
    checkout: 'https://getsafepay.com/embedded/',
  },
};

export function buildSafepayConfig(
  environment: Pick<
    Environment,
    'SAFEPAY_ENVIRONMENT' | 'SAFEPAY_API_KEY' | 'SAFEPAY_SECRET_KEY' | 'SAFEPAY_WEBHOOK_SECRET'
  >,
): SafepayConfig {
  const hosts = HOSTS[environment.SAFEPAY_ENVIRONMENT];
  return {
    environment: environment.SAFEPAY_ENVIRONMENT,
    apiBaseUrl: hosts.api,
    checkoutBaseUrl: hosts.checkout,
    apiKey: environment.SAFEPAY_API_KEY,
    secretKey: environment.SAFEPAY_SECRET_KEY,
    webhookSecret: environment.SAFEPAY_WEBHOOK_SECRET,
  };
}

export function isSafepayConfigured(config: SafepayConfig): boolean {
  return config.apiKey !== '' && config.secretKey !== '';
}
