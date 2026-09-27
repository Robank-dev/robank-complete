import { ROBINHOOD } from '@/lib/chains';
import { env } from './env';

/** Alchemy's Robinhood Chain endpoint, when ALCHEMY_API_KEY is set. */
export function alchemyUrl() {
  const key = env('ALCHEMY_API_KEY');
  return key ? `https://robinhood-mainnet.g.alchemy.com/v2/${key}` : '';
}

/**
 * RPCs the server reads Robinhood Chain from, in order. The public endpoint rate-limits shared
 * Cloudflare egress quickly, so Alchemy goes first when it is configured.
 */
export function serverRpcs() {
  const alchemy = alchemyUrl();
  return alchemy ? [alchemy, ...ROBINHOOD.rpcs] : ROBINHOOD.rpcs;
}
