'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, CapabilityBadge, Empty, Skeleton, Spinner } from '@/components/ui';
import { api, type Capability, type Company } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { relativeTime } from '@/lib/format';

const COUNTRIES: Array<[string, string]> = [['ID', 'Indonesia'], ['SG', 'Singapore'], ['MY', 'Malaysia'], ['PH', 'Philippines'], ['TH', 'Thailand'], ['VN', 'Vietnam'], ['IN', 'India'], ['AE', 'United Arab Emirates'], ['HK', 'Hong Kong'], ['JP', 'Japan'], ['KR', 'South Korea'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['GB', 'United Kingdom'], ['IE', 'Ireland'], ['DE', 'Germany'], ['FR', 'France'], ['NL', 'Netherlands'], ['ES', 'Spain'], ['IT', 'Italy'], ['CH', 'Switzerland'], ['EE', 'Estonia'], ['PT', 'Portugal'], ['CA', 'Canada'], ['US', 'United States'], ['MX', 'Mexico'], ['BR', 'Brazil'], ['AR', 'Argentina'], ['NG', 'Nigeria'], ['KE', 'Kenya'], ['ZA', 'South Africa']];
const US_STATES = ['DE', 'WY', 'NV', 'CA', 'NY', 'TX', 'FL', 'WA', 'MA', 'IL', 'CO', 'NJ', 'GA'];

const STATUS: Record<string, { tone: 'ok' | 'pending' | 'bad' | 'off'; label: string }> = {
  not_started: { tone: 'off', label: 'Not verified' }, pending: { tone: 'pending', label: 'Verification started' }, approved: { tone: 'ok', label: 'Verified' }, declined: { tone: 'bad', label: 'Declined' }
};

function Companies() {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [kyb, setKyb] = useState<Capability | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ legalName: '', registrationNumber: '', countryCode: 'ID', usState: 'DE' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [verifying, setVerifying] = useState('');

  const load = useCallback(() => {
    setError('');
    api.companies().then((r) => setCompanies(r.companies)).catch((e) => setError(friendlyError(e, 'Your companies could not be loaded.')));
  }, []);
  useEffect(() => { load(); api.status().then((r) => setKyb(r.capabilities.find((c) => c.id === 'kyb') || null)).catch(() => undefined); }, [load]);

  async function create() {
    if (saving) return;
    if (form.legalName.trim().length < 2) { setFormError('Enter the registered legal name.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const { company } = await api.createCompany({ legalName: form.legalName.trim(), registrationNumber: form.registrationNumber.trim() || undefined, countryCode: form.countryCode, jurisdictionCode: form.countryCode === 'US' ? `US_${form.usState}` : undefined });
      setCompanies((list) => [company, ...(list || [])]);
      setForm({ ...form, legalName: '', registrationNumber: '' });
    } catch (e) {
      setFormError(friendlyError(e, 'The company could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  async function verify(id: string) {
    setVerifying(id);
    const tab = window.open('about:blank', '_blank');
    try {
      const { company, url } = await api.verifyCompany(id);
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
      setCompanies((list) => (list || []).map((c) => (c.id === id ? company : c)));
    } catch (e) {
      tab?.close();
      setError(friendlyError(e, 'Verification could not be started.'));
    } finally {
      setVerifying('');
    }
  }

  return (
    <div className="ui-grid aside">
      <section className="ui-panel">
        <div className="ui-panel-head"><div><span className="ui-kicker">Your companies</span><h2>Business profiles</h2></div>{kyb && <CapabilityBadge state={kyb.state} />}</div>
        {error && <div style={{ marginBottom: 12 }}><Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert></div>}
        {!companies && !error ? <Skeleton h={80} /> : !companies?.length ? <Empty title="No companies yet">Add your registered legal entity to prepare it for business verification.</Empty> : (
          <div className="ui-rows">
            {companies.map((c) => {
              const s = STATUS[c.verificationStatus] || STATUS.not_started;
              return (
                <div className="ui-row" key={c.id}>
                  <div className="ui-row-main"><b>{c.legalName}</b><span>{COUNTRIES.find(([code]) => code === c.countryCode)?.[1] || c.countryCode}{c.jurisdictionCode?.startsWith('US_') ? ` · ${c.jurisdictionCode.slice(3)}` : ''}{c.registrationNumber ? ` · ${c.registrationNumber}` : ''} · added {relativeTime(c.createdAt)}</span></div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {c.verificationStatus !== 'approved' && kyb?.state === 'live' && <button type="button" className="ui-btn secondary sm" disabled={verifying === c.id} onClick={() => void verify(c.id)}>{verifying === c.id ? <Spinner /> : c.verificationStatus === 'pending' ? 'Continue' : 'Verify'}</button>}
                </div>
              );
            })}
          </div>
        )}
        {kyb && kyb.state !== 'live' && <p className="ui-muted" style={{ marginTop: 12 }}>Business verification (Didit KYB) is not enabled yet. Your profile is saved and can be verified once it is.</p>}
      </section>

      <section className="ui-panel" style={{ alignSelf: 'start' }}>
        <span className="ui-kicker">Add a company</span>
        <div className="ui-grid" style={{ gap: 12, marginTop: 12 }}>
          <label className="ui-field"><span className="ui-label">Legal name</span><input className="ui-input" value={form.legalName} maxLength={160} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="PT Contoh Teknologi" /></label>
          <label className="ui-field"><span className="ui-label">Registration number <em>optional</em></span><input className="ui-input" value={form.registrationNumber} maxLength={64} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="NIB / company number" /></label>
          <label className="ui-field"><span className="ui-label">Country of registration</span><select className="ui-select" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })}>{COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          {form.countryCode === 'US' && <label className="ui-field"><span className="ui-label">State</span><select className="ui-select" value={form.usState} onChange={(e) => setForm({ ...form, usState: e.target.value })}>{US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>}
          {formError && <p className="ui-hint bad">{formError}</p>}
          <button type="button" className="ui-btn primary" disabled={saving} onClick={() => void create()}>{saving ? <><Spinner /> Saving…</> : 'Save company'}</button>
          <p className="ui-muted">Only you can see your company profiles. Verification documents are handled by Didit, not stored by ROBANK.</p>
        </div>
      </section>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Company</span><h1>Company profiles</h1><p>Register the legal entities you operate so they can be verified for business features.</p></div></header>
        <Companies />
      </div>
    </AppShell>
  );
}
