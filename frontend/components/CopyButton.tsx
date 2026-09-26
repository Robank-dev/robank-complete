'use client';

import { useState } from 'react';

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('copy failed');
}

export default function CopyButton({ value, label = 'Copy', disabled = false, compact = false, className = '' }: { value: string; label?: string; disabled?: boolean; compact?: boolean; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    if (!value || disabled) return;
    try {
      await writeClipboard(value);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 1600);
  };
  const text = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label;
  return (
    <button type="button" onClick={copy} disabled={disabled || !value} className={`ui-btn ${compact ? 'ghost sm' : 'secondary'} ${className}`} aria-live="polite">
      <span aria-hidden="true">{state === 'copied' ? '✓' : '⧉'}</span>
      {!compact || state !== 'idle' ? <span>{text}</span> : null}
      {compact && state === 'idle' && <span className="sr-only">{label}</span>}
    </button>
  );
}
