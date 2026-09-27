'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, CapabilityBadge, Empty, Skeleton, Spinner } from '@/components/ui';
import { api, type Capability, type Company, type CompanyInput } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { relativeTime } from '@/lib/format';
import { openDiditVerification } from '@/lib/didit';

// ISO 3166-1 alpha-2. Names come from the browser (Intl.DisplayNames), sorted alphabetically.
const ISO = 'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');
const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const ENTITY_TYPES: Array<[string, string]> = [['llc', 'Limited liability company (LLC)'], ['corporation', 'Corporation'], ['limited_company', 'Private limited company (Ltd)'], ['public_company', 'Public company'], ['partnership', 'Partnership'], ['sole_proprietorship', 'Sole proprietorship'], ['nonprofit', 'Nonprofit'], ['foundation', 'Foundation'], ['trust', 'Trust'], ['other', 'Other']];
const INDUSTRIES = ['Software & technology', 'Financial services', 'E-commerce & retail', 'Marketing & media', 'Professional services', 'Manufacturing', 'Logistics & transport', 'Real estate', 'Healthcare', 'Education', 'Hospitality & travel', 'Energy', 'Crypto & web3', 'Other'];

const STATUS: Record<string, { tone: 'ok' | 'pending' | 'bad' | 'off'; label: string }> = {
  not_started: { tone: 'off', label: 'Not verified' }, pending: { tone: 'pending', label: 'Verification started' }, in_review: { tone: 'pending', label: 'In review' }, approved: { tone: 'ok', label: 'Verified' }, declined: { tone: 'bad', label: 'Declined' }
};

const EMPTY: CompanyInput & { usState: string } = { legalName: '', registrationNumber: '', countryCode: '', usState: 'DE', entityType: 'llc', incorporationDate: '', taxId: '', website: '', industry: '', addressLine: '', city: '', postalCode: '', contactEmail: '' };

/** Country names are built in the browser after mount, so server and client markup always match. */
function useCountries() {
  const [list, setList] = useState<Array<[string, string]>>([]);
  useEffect(() => {
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch {}
    setList(ISO.map((code) => [code, names?.of(code) || code] as [string, string]).sort((a, b) => a[1].localeCompare(b[1])));
  }, []);
  return list;
}

function Companies() {
  const countries = useCountries();
  const countryName = (code: string) => countries.find(([c]) => c === code)?.[1] || code;
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [kyb, setKyb] = useState<Capability | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [verifying, setVerifying] = useState('');

  const load = useCallback(() => {
    setError('');
    api.companies().then((r) => setCompanies(r.companies)).catch((e) => setError(friendlyError(e, 'Your companies could not be loaded.')));
  }, []);
  useEffect(() => { load(); api.status().then((r) => setKyb(r.capabilities.find((c) => c.id === 'kyb') || null)).catch(() => undefined); }, [load]);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  async function create() {
    if (saving) return;
    if (form.legalName.trim().length < 2) { setFormError('Enter the registered legal name.'); return; }
    if (!form.countryCode) { setFormError('Choose the country of registration.'); return; }
    setSaving(true); setFormError('');
    try {
      const { usState, ...rest } = form;
      const clean = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || undefined : v])) as CompanyInput;
      const { company } = await api.createCompany({ ...clean, jurisdictionCode: form.countryCode === 'US' ? `US_${usState}` : undefined });
      setCompanies((list) => [company, ...(list || [])]);
      setForm(EMPTY);
    } catch (e) {
      setFormError(friendlyError(e, 'The company could not be saved.'));
    } finally { setSaving(false); }
  }

  async function verify(id: string) {
    setVerifying(id);
    try {
      const { company, url } = await api.verifyCompany(id);
      setCompanies((list) => (list || []).map((c) => (c.id === id ? company : c)));
      await openDiditVerification(url, () => load());
    } catch (e) {
      setError(friendlyError(e, 'Verification could not be started.'));
    } finally { setVerifying(''); }
  }

  const verified = (companies || []).filter((c) => c.verificationStatus === 'approved').length;

  return (
    <div className="co-layout">
      <section className="ui-panel">
        <div className="ui-panel-head">
          <div><span className="ui-kicker">Your companies · KYB</span><h2>Business profiles</h2>{companies && <p className="ui-muted" style={{ margin: '4px 0 0' }}>{companies.length} registered · {verified} verified</p>}</div>
          {kyb && <CapabilityBadge state={kyb.state} />}
        </div>
        {error && <div style={{ marginBottom: 12 }}><Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert></div>}
        {!companies && !error ? <Skeleton h={80} /> : !companies?.length ? <Empty title="No companies yet">Add each legal entity you operate. Every company is verified separately.</Empty> : (
          <div className="ui-rows">
            {companies.map((c) => {
              const s = STATUS[c.verificationStatus] || STATUS.not_started;
              return (
                <div className="ui-row" key={c.id}>
                  <div className="ui-row-main">
                    <b>{c.legalName}</b>
                    <span>{countryName(c.countryCode)}{c.jurisdictionCode?.startsWith('US_') ? ` · ${c.jurisdictionCode.slice(3)}` : ''}{c.registrationNumber ? ` · ${c.registrationNumber}` : ''} · added {relativeTime(c.createdAt)}</span>
                    <div className="co-row-meta">{c.entityType && <Badge plain>{ENTITY_TYPES.find(([k]) => k === c.entityType)?.[1] || c.entityType}</Badge>}{c.industry && <Badge plain>{c.industry}</Badge>}{c.verifiedAt && <Badge plain>Verified {relativeTime(c.verifiedAt)}</Badge>}</div>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {c.verificationStatus !== 'approved' && kyb?.state === 'live' && <button type="button" className="ui-btn secondary sm" disabled={verifying === c.id} onClick={() => void verify(c.id)}>{verifying === c.id ? <Spinner /> : ['pending', 'in_review'].includes(c.verificationStatus) ? 'Continue' : c.verificationStatus === 'declined' ? 'Retry' : 'Verify'}</button>}
                </div>
              );
            })}
          </div>
        )}
        {companies && companies.some((c) => ['pending', 'in_review'].includes(c.verificationStatus)) && <button type="button" className="ui-btn ghost sm" style={{ marginTop: 12 }} onClick={load}>Refresh statuses</button>}
        {kyb && kyb.state !== 'live' && <p className="ui-muted" style={{ marginTop: 12 }}>Business verification (Didit KYB) is being activated. Your profiles are saved and can be verified as soon as it is live.</p>}
        <div className="ui-alert" style={{ marginTop: 14 }}><span>KYB checks the company registry, company documents (certificate of incorporation, proof of address) and every director and beneficial owner above 25%, who each complete their own ID check.</span></div>
      </section>

      <section className="ui-panel">
        <span className="ui-kicker">Add a company</span>
        <div className="co-form" style={{ marginTop: 12 }}>
          <label className="ui-field span"><span className="ui-label">Registered legal name</span><input className="ui-input" value={form.legalName} maxLength={160} onChange={set('legalName')} placeholder="Acme Holdings Ltd." /></label>
          <label className="ui-field"><span className="ui-label">Country of registration</span><select className="ui-select" value={form.countryCode} onChange={set('countryCode')}><option value="">Select a country…</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          {form.countryCode === 'US'
            ? <label className="ui-field"><span className="ui-label">State of incorporation</span><select className="ui-select" value={form.usState} onChange={set('usState')}>{US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            : <label className="ui-field"><span className="ui-label">Entity type</span><select className="ui-select" value={form.entityType || ''} onChange={set('entityType')}>{ENTITY_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
          {form.countryCode === 'US' && <label className="ui-field"><span className="ui-label">Entity type</span><select className="ui-select" value={form.entityType || ''} onChange={set('entityType')}>{ENTITY_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
          <label className="ui-field"><span className="ui-label">Registration number</span><input className="ui-input" value={form.registrationNumber || ''} maxLength={64} onChange={set('registrationNumber')} placeholder="Company number" /></label>
          <label className="ui-field"><span className="ui-label">Date of incorporation</span><input className="ui-input" type="date" value={form.incorporationDate || ''} onChange={set('incorporationDate')} /></label>
          <label className="ui-field"><span className="ui-label">Tax ID <em>optional</em></span><input className="ui-input" value={form.taxId || ''} maxLength={40} onChange={set('taxId')} placeholder="EIN, VAT or local tax number" /></label>
          <label className="ui-field"><span className="ui-label">Industry</span><select className="ui-select" value={form.industry || ''} onChange={set('industry')}><option value="">Select…</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></label>
          <label className="ui-field span"><span className="ui-label">Registered address</span><input className="ui-input" value={form.addressLine || ''} maxLength={200} onChange={set('addressLine')} placeholder="Street and number" /></label>
          <label className="ui-field"><span className="ui-label">City</span><input className="ui-input" value={form.city || ''} maxLength={80} onChange={set('city')} /></label>
          <label className="ui-field"><span className="ui-label">Postal code</span><input className="ui-input" value={form.postalCode || ''} maxLength={20} onChange={set('postalCode')} /></label>
          <label className="ui-field"><span className="ui-label">Website <em>optional</em></span><input className="ui-input" value={form.website || ''} maxLength={200} onChange={set('website')} placeholder="https://" /></label>
          <label className="ui-field"><span className="ui-label">Contact email <em>optional</em></span><input className="ui-input" type="email" value={form.contactEmail || ''} maxLength={160} onChange={set('contactEmail')} placeholder="finance@company.com" /></label>
          {formError && <p className="ui-hint bad span">{formError}</p>}
          <button type="button" className="ui-btn primary span" disabled={saving} onClick={() => void create()}>{saving ? <><Spinner /> Saving…</> : 'Save company'}</button>
          <p className="ui-muted span" style={{ fontSize: 12 }}>Only you can see your company profiles. Verification documents are handled by Didit and are not stored by ROBANK. You can register up to 25 companies.</p>
        </div>
      </section>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Company</span><h1>Companies</h1><p>Register and verify every legal entity you operate — each business gets its own KYB check. Your personal identity is verified once on the Card page.</p></div></header>
        <Companies />
      </div>
    </AppShell>
  );
}
