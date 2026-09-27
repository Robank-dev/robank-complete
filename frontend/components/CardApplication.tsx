'use client';

import { useEffect, useState } from 'react';
import { api, type CardApplication as Application, type CardState } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { Alert, Spinner } from './ui';

const ISO = 'AD AE AG AI AM AO AR AS AT AU AW AX AZ BB BD BE BG BH BJ BL BM BN BO BQ BR BS BT BW BZ CA CH CI CK CL CM CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ES FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GY HK HN HU ID IE IL IM IN IS IT JE JM JP KE KG KH KI KM KN KR KW KY KZ LA LC LI LK LS LT LU LV MA MC MD MF MG MH MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PT PW PY QA RE RO RW SA SB SC SE SG SH SK SL SM SN SR ST SV SX SY SZ TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UG UY UZ VA VC VG VU WF WS YT ZA ZM'.split(' ');
const label = (v: string) => v.toLowerCase().replace(/_/g, ' ').replace(/\bsoe\b/g, 'state-owned').replace(/\bnone government\b/g, 'non-government').replace(/^./, (c) => c.toUpperCase()).replace(/^Id card$/, 'ID card');

/** Step 2: the card application. Identity data comes from the Didit check; the user adds contact and profile details. */
export default function CardApplication({ state, onSubmitted }: { state: CardState; onSubmitted: () => void }) {
  const p = state.prefill;
  const [names, setNames] = useState<Array<[string, string]>>([]);
  const [form, setForm] = useState<Application>({
    mobilePrefix: '', mobile: '', occupation: '', sourceOfFund: '', livingCountry: p?.country || '',
    country: p?.country || '', state: p?.state || '', city: p?.city || '', street: p?.street || '', postalCode: p?.postalCode || '',
    gender: p?.gender || '', idExpiryDate: p?.idExpiryDate || ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let dn: Intl.DisplayNames | null = null;
    try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch {}
    setNames(ISO.map((c) => [c, dn?.of(c) || c] as [string, string]).sort((a, b) => a[1].localeCompare(b[1])));
  }, []);
  const set = (k: keyof Application) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const country = (k: 'country' | 'livingCountry') => (
    <select className="ui-select" value={form[k]} onChange={set(k)}><option value="">Select…</option>{names.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
  );

  async function submit() {
    setBusy(true); setError('');
    try {
      await api.cardAction({ action: 'apply', profile: form });
      onSubmitted();
    } catch (e) { setError(friendlyError(e, 'Your application could not be submitted.')); }
    finally { setBusy(false); }
  }

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <div><span className="ui-kicker">Step 2 of 3 · Identity verified</span><h2>Apply for your card</h2><p className="ui-muted">Your verified details are filled in. Add your contact and profile so the card issuer can review your application.</p></div>
      {state.applicationRejected && <Alert tone="warn">Your last card application was not approved. Check your details and submit again ({state.kycAttemptsLeft} attempt{state.kycAttemptsLeft === 1 ? '' : 's'} left).</Alert>}
      {p && (
        <div className="ui-kv">
          <div><span>Name</span><b>{p.name}</b></div>
          <div><span>Date of birth</span><b>{p.birthDate || '—'}</b></div>
          <div><span>Document</span><b>{label(p.idType)}{p.nationality ? ` · ${p.nationality}` : ''}</b></div>
        </div>
      )}
      <div className="ui-grid two">
        <label className="ui-field"><span className="ui-label">Mobile number</span>
          <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 8 }}>
            <input className="ui-input" inputMode="numeric" placeholder="+1" value={form.mobilePrefix} maxLength={5} onChange={(e) => setForm((f) => ({ ...f, mobilePrefix: e.target.value.replace(/\D/g, '') }))} />
            <input className="ui-input" inputMode="numeric" placeholder="2025550123" value={form.mobile} maxLength={20} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))} />
          </div></label>
        <label className="ui-field"><span className="ui-label">Country of residence</span>{country('livingCountry')}</label>
        <label className="ui-field"><span className="ui-label">Occupation</span>
          <select className="ui-select" value={form.occupation} onChange={set('occupation')}><option value="">Select…</option>{state.options?.occupations.map((o) => <option key={o} value={o}>{label(o)}</option>)}</select></label>
        <label className="ui-field"><span className="ui-label">Source of funds</span>
          <select className="ui-select" value={form.sourceOfFund} onChange={set('sourceOfFund')}><option value="">Select…</option>{state.options?.sources.map((o) => <option key={o} value={o}>{label(o)}</option>)}</select></label>
      </div>
      <span className="ui-kicker">Residential address</span>
      <div className="ui-grid two">
        <label className="ui-field"><span className="ui-label">Street and number</span><input className="ui-input" value={form.street} maxLength={256} onChange={set('street')} /></label>
        <label className="ui-field"><span className="ui-label">City</span><input className="ui-input" value={form.city} maxLength={128} onChange={set('city')} /></label>
        <label className="ui-field"><span className="ui-label">State / province</span><input className="ui-input" value={form.state} maxLength={128} onChange={set('state')} /></label>
        <label className="ui-field"><span className="ui-label">Postal code</span><input className="ui-input" value={form.postalCode} maxLength={32} onChange={set('postalCode')} /></label>
        <label className="ui-field"><span className="ui-label">Country</span>{country('country')}</label>
        {!p?.gender && <label className="ui-field"><span className="ui-label">Gender (as on your document)</span><select className="ui-select" value={form.gender} onChange={set('gender')}><option value="">Select…</option><option value="FEMALE">Female</option><option value="MALE">Male</option></select></label>}
        {!p?.idExpiryDate && <label className="ui-field"><span className="ui-label">Document expiry date</span><input className="ui-input" type="date" value={form.idExpiryDate} onChange={set('idExpiryDate')} /></label>}
      </div>
      {error && <Alert tone="bad">{error}</Alert>}
      <button type="button" className="ui-btn primary block" disabled={busy} onClick={() => void submit()}>{busy ? <><Spinner /> Submitting your application…</> : 'Submit card application'}</button>
      <p className="ui-muted" style={{ fontSize: 12 }}>Your verified document and report are shared with the card issuer only for this application. No payment yet — you pay {`$${state.fees.applicationUsd.toFixed(2)}`} once the card is approved.</p>
    </div>
  );
}
