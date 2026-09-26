'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { chainById } from '@/lib/chains';

export function Badge({ tone = 'off', children, plain = false }: { tone?: 'live' | 'ok' | 'warn' | 'pending' | 'bad' | 'off'; children: ReactNode; plain?: boolean }) {
  return <span className={`ui-badge ${tone}${plain ? ' plain' : ''}`}>{children}</span>;
}

export function CapabilityBadge({ state }: { state: 'live' | 'needs-configuration' | 'not-available' }) {
  if (state === 'live') return <Badge tone="live">Live</Badge>;
  if (state === 'needs-configuration') return <Badge tone="warn">Not enabled</Badge>;
  return <Badge tone="off">Not available</Badge>;
}

export function Alert({ tone = 'info', title, children, action }: { tone?: 'info' | 'warn' | 'bad' | 'ok'; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const icon = tone === 'ok' ? '✓' : tone === 'bad' ? '!' : tone === 'warn' ? '!' : 'i';
  return (
    <div className={`ui-alert ${tone === 'info' ? '' : tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <span className="ui-alert-icon" aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{title && <b>{title} </b>}{children}</div>
      {action}
    </div>
  );
}

export function TokenIcon({ src, label, chainId, size }: { src?: string | null; label: string; chainId?: number; size?: number }) {
  const [failed, setFailed] = useState(false);
  const chain = chainId ? chainById(chainId) : undefined;
  return (
    <span className="ui-token" style={size ? { width: size, height: size } : undefined}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} loading="lazy" /> : label.slice(0, 2).toUpperCase()}
      {chain && <span className="ui-token-chain"><img src={chain.icon} alt="" /></span>}
    </span>
  );
}

export function Spinner() {
  return <span className="ui-spinner" aria-hidden="true" />;
}

export function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: number | string }) {
  return <span className="ui-skel" style={{ display: 'block', height: h, width: w }} />;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="ui-empty"><b>{title}</b>{children && <span>{children}</span>}{action}</div>;
}

export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ui-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-modal" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  );
}

export type PickerOption = { id: string; label: string; sub?: string; image?: string | null; chainId?: number; value?: string; disabled?: boolean };

export function Picker({ label, value, options, onChange, placeholder = 'Select', search = true, disabled = false }: {
  label: string; value?: PickerOption; options: PickerOption[]; onChange: (option: PickerOption) => void; placeholder?: string; search?: boolean; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => `${o.label} ${o.sub || ''}`.toLowerCase().includes(q)) : options;
    return list.slice(0, 150);
  }, [options, query]);

  return (
    <div className="ui-field ui-picker" ref={ref}>
      <span className="ui-label" id={id}>{label}</span>
      <button type="button" className="ui-picker-trigger" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={id} disabled={disabled || !options.length} onClick={() => setOpen((v) => !v)}>
        {value ? <TokenIcon src={value.image} label={value.label} chainId={value.chainId} /> : null}
        <span className="ui-picker-copy"><b>{value?.label || (options.length ? placeholder : 'Nothing available')}</b>{value?.sub && <small>{value.sub}</small>}</span>
        <span aria-hidden="true" style={{ color: 'var(--ui-muted)' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="ui-picker-menu">
          {search && options.length > 6 && <input className="ui-input" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label={`Search ${label}`} />}
          <div className="ui-picker-list" role="listbox" aria-labelledby={id}>
            {filtered.map((option) => (
              <button type="button" role="option" aria-selected={value?.id === option.id} key={option.id} disabled={option.disabled} className={value?.id === option.id ? 'selected' : ''}
                onClick={() => { onChange(option); setOpen(false); setQuery(''); }}>
                <TokenIcon src={option.image} label={option.label} chainId={option.chainId} />
                <span className="ui-picker-copy"><b>{option.label}</b>{option.sub && <small>{option.sub}</small>}</span>
                {option.value && <span className="ui-picker-value">{option.value}</span>}
              </button>
            ))}
            {!filtered.length && <div className="ui-empty" style={{ padding: 18 }}>No matches.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
