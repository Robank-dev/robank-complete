'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type PickerOption = {
  id: string;
  label: string;
  name?: string;
  image?: string | null;
  meta?: string;
  value?: number;
};

export function Picker({
  label,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
}: {
  label: string;
  value?: PickerOption;
  options: PickerOption[];
  onChange: (option: PickerOption) => void;
  placeholder: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? options.filter((option) =>
          [option.label, option.name, option.meta]
            .filter(Boolean)
            .some((item) => String(item).toLowerCase().includes(q))
        )
      : options;
    return list.slice(0, q ? 200 : 80);
  }, [options, search]);

  return (
    <div className="ro-picker" ref={ref}>
      <span className="ro-picker-label">{label}</span>
      <button type="button" className={open ? 'ro-picker-trigger open' : 'ro-picker-trigger'} onClick={() => setOpen((current) => !current)}>
        {value?.image ? <img src={value.image} alt="" /> : <span className="ro-picker-placeholder" />}
        <span className="ro-picker-copy">
          <b>{value?.label || placeholder}</b>
          {value?.meta && <small>{value.meta}</small>}
        </span>
        <span className="ro-picker-chevron">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div className="ro-picker-menu">
          <div className="ro-picker-search">
            <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
          </div>
          <div className="ro-picker-list">
            {filtered.map((option) => (
              <button
                type="button"
                key={option.id}
                className={value?.id === option.id ? 'selected' : ''}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span className="ro-picker-option-icon">
                  {option.image ? <img src={option.image} alt="" /> : <span>{option.label.slice(0, 2).toUpperCase()}</span>}
                </span>
                <span className="ro-picker-copy">
                  <b>{option.label}</b>
                  {option.name && option.name !== option.label && <small>{option.name}</small>}
                  {option.meta && <small>{option.meta}</small>}
                </span>
                {typeof option.value === 'number' && (
                  <span className="ro-picker-option-value">{option.value > 0 ? '$' + option.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '$0'}</span>
                )}
              </button>
            ))}
            {!filtered.length && <div className="ro-picker-empty">No matches.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
