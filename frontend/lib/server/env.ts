import { getCloudflareContext } from '@opennextjs/cloudflare';

type D1Result<T> = { results: T[] };
export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<{ meta: { changes: number } }>;
};
export type D1 = { prepare(query: string): D1Statement; batch(statements: D1Statement[]): Promise<unknown[]> };

/** Server-only configuration. Secrets are read from Worker bindings / process env and never sent to the browser. */
export function env(name: string): string {
  let value: unknown;
  try { value = (getCloudflareContext().env as Record<string, unknown>)[name]; } catch { value = undefined; }
  if (typeof value !== 'string' || !value) value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function db(): D1 | null {
  try {
    const binding = (getCloudflareContext().env as Record<string, unknown>).DB as D1 | undefined;
    return binding || null;
  } catch {
    return null;
  }
}
