'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';

type Update = {
  id: string;
  title?: string | null;
  body: string;
  xUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string;
  published_at?: string;
};

const STORAGE_KEY = 'robank.owner.updates';
const OWNER_WALLET = (process.env.NEXT_PUBLIC_ROBANK_OWNER_WALLET || '').trim().toLowerCase();
const BACKEND_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_URL);

function loadLocal(): Update[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocal(items: Update[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function UpdatesPage() {
  const { address } = useAccount();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isOwner = Boolean(
    address && OWNER_WALLET && address.toLowerCase() === OWNER_WALLET
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      if (BACKEND_CONFIGURED) {
        const data = await api.updates();
        setUpdates(data.updates || []);
      } else {
        setUpdates(loadLocal());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load updates.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const sorted = useMemo(
    () =>
      [...updates].sort((a, b) => {
        const da = new Date(a.publishedAt || a.published_at || 0).getTime();
        const db = new Date(b.publishedAt || b.published_at || 0).getTime();
        return db - da;
      }),
    [updates]
  );

  async function publish() {
    if (!isOwner || !body.trim()) return;
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        walletAddress: address!,
        title: title.trim() || undefined,
        body: body.trim(),
        xUrl: xUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      };

      if (BACKEND_CONFIGURED) {
        const result = await api.createUpdate(payload);
        setUpdates((current) => [result.update, ...current]);
      } else {
        const update: Update = {
          id: crypto.randomUUID(),
          title: payload.title || null,
          body: payload.body,
          xUrl: payload.xUrl || null,
          imageUrl: payload.imageUrl || null,
          publishedAt: new Date().toISOString(),
        };
        const next = [update, ...loadLocal()];
        saveLocal(next);
        setUpdates(next);
      }

      setTitle('');
      setBody('');
      setXUrl('');
      setImageUrl('');
      setMessage(
        BACKEND_CONFIGURED
          ? 'Update published.'
          : 'Update saved in this browser.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish update.');
    } finally {
      setPublishing(false);
    }
  }

  async function remove(id: string) {
    if (!isOwner) return;
    try {
      if (BACKEND_CONFIGURED) {
        await api.deleteUpdate(id, address!);
      } else {
        saveLocal(loadLocal().filter((item) => item.id !== id));
      }
      setUpdates((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove update.');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-white/40">
              ROBANK / UPDATES
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              ROBANK updates.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Official product notes, launches and thoughts from ROBANK — written
              here and optionally linked back to the original post on X.
            </p>
          </div>
          <Link
            href="https://x.com/robankdev"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5"
          >
            Follow on X →
          </Link>
        </div>

        {isOwner && (
          <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/35">
                  OWNER / ADMIN
                </div>
                <h2 className="mt-2 text-xl font-medium">Publish an update.</h2>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-mono text-white/45">
                {BACKEND_CONFIGURED ? 'LIVE PUBLISH' : 'LOCAL PREVIEW'}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline (optional)"
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the update / words you want to publish…"
                rows={7}
                className="resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input value={xUrl} onChange={(e) => setXUrl(e.target.value)} placeholder="X post URL (optional)" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-white/30">
                {BACKEND_CONFIGURED
                  ? 'Published updates are stored by the ROBANK backend.'
                  : 'Backend is not connected; this preview is stored only in this browser.'}
              </span>
              <button
                onClick={publish}
                disabled={publishing || !body.trim()}
                className="rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-35"
              >
                {publishing ? 'Publishing…' : 'Publish update'}
              </button>
            </div>
            {message && <div className="mt-3 text-xs text-white/50">{message}</div>}
          </section>
        )}

        {!OWNER_WALLET && (
          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/35">
            Owner publishing is locked until <span className="font-mono text-white/55">NEXT_PUBLIC_ROBANK_OWNER_WALLET</span> is configured.
          </div>
        )}

        {error && <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/45">{error}</div>}

        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-ro-line p-6 text-sm text-white/35">Loading updates…</div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-ro-line bg-ro-panel p-8">
              <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">NO UPDATES YET</div>
              <h2 className="mt-3 text-xl font-medium">This is the official ROBANK update feed.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">
                New product releases, build notes and announcements can be posted here
                alongside the original X post.
              </p>
            </div>
          ) : (
            sorted.map((update) => (
              <article key={update.id} className="rounded-2xl border border-ro-line bg-ro-panel p-5">
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono uppercase tracking-[.12em] text-white/30">
                  <span>ROBANK UPDATE</span><span>·</span>
                  <span>{new Date(update.publishedAt || update.published_at || Date.now()).toLocaleString()}</span>
                </div>
                {update.title && <h2 className="mt-3 text-xl font-medium">{update.title}</h2>}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/55">{update.body}</p>
                {update.imageUrl && (
                  <img
                    src={update.imageUrl}
                    alt=""
                    className="mt-5 max-h-[520px] w-full rounded-xl border border-white/8 object-cover"
                  />
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {update.xUrl && (
                    <a href={update.xUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-mono text-white/45 hover:bg-white/5">
                      VIEW ON X →
                    </a>
                  )}
                  {isOwner && (
                    <button onClick={() => remove(update.id)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-mono text-white/30 hover:bg-white/5">
                      DELETE
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
