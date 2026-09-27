'use client';

import type { AccountStatus } from '@/lib/hooks/useAccountStatus';

/** Two-step progress: 1 identity verified, 2 card created. Shown on the Card page and the Overview. */
export default function AccountSteps({ status }: { status: AccountStatus | null }) {
  const level = status?.level;
  const verified = level === 'verified' || level === 'review' || level === 'ready' || level === 'card';
  const identity = verified ? 'Verified' : level === 'verifying' ? 'In progress' : level === 'rejected' ? 'Not approved' : 'Not verified';
  const card = level === 'card' ? (status?.frozen ? 'Frozen' : 'Active') : level === 'review' ? 'In review' : level === 'ready' ? 'Approved · ready' : 'Not created';
  return (
    <div className="acct-steps">
      <div className={`acct-step${verified ? ' done' : level === 'verifying' ? ' active' : level === 'rejected' ? ' bad' : ''}`}><i>{verified ? '✓' : '1'}</i><div><b>Identity</b><span>{identity}</span></div></div>
      <span className={`acct-line${verified ? ' done' : ''}`} />
      <div className={`acct-step${level === 'card' ? ' done' : verified ? ' active' : ''}`} data-level={level}><i>{level === 'card' ? '✓' : '2'}</i><div><b>Card</b><span>{card}</span></div></div>
    </div>
  );
}
