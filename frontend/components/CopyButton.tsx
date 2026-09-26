'use client';

import { useState } from 'react';

type Props = {
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export default function CopyButton({ value, label = 'Copy', className = '', disabled = false }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value || disabled) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const ok = document.execCommand('copy');
        textarea.remove();
        if (!ok) throw new Error('Copy command failed');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <button type="button" onClick={copy} disabled={disabled || !value} className={"ro-copy-button " + (copied ? 'is-copied ' : '') + className}>
      <span className="ro-copy-icon" aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}
