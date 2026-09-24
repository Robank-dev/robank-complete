'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useWallets } from '@privy-io/react-auth';
import { api } from '@/lib/api';

const COUNTRY_CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });
const US_JURISDICTIONS = [['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],['DC','District of Columbia']];

function countryName(code: string) {
  return COUNTRY_NAMES.of(code) || code;
}

export default function CompanyPage() {
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');

  const [companies, setCompanies] = useState<any[]>([]);
  const [country, setCountry] = useState('ID');
  const [legalName, setLegalName] = useState('');
  const [registration, setRegistration] = useState('');
  const [taxId, setTaxId] = useState('');
  const [entityType, setEntityType] = useState('Company');
  const [usState, setUsState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState('');

  async function load() {
    if (!wallet?.address) return;
    try {
      const result = await api.companies(wallet.address);
      setCompanies(result.companies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load companies.');
    }
  }

  useEffect(() => { load(); }, [wallet?.address]);

  async function add() {
    if (!wallet?.address) return;
    if ([legalName, registration].some((value) => !value.trim())) {
      setError('Enter the exact legal company name and official registration number.');
      return;
    }
    if (country === 'US' && !usState) {
      setError('Select the U.S. state or jurisdiction where the company is registered.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.createCompany({
        walletAddress: wallet.address,
        legalName: legalName.trim(),
        registrationNumber: registration.trim(),
        countryCode: country,
        metadata: {
          taxId: taxId.trim() || null,
          entityType,
          jurisdictionCode: country === 'US' ? `US_${usState}` : country,
        },
      } as any);
      setLegalName(''); setRegistration(''); setTaxId(''); setUsState('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add company.');
    } finally {
      setLoading(false);
    }
  }

  async function verify(id: string) {
    if (!wallet?.address) return;
    setVerifyingId(id);
    setError('');
    try {
      const result = await api.verifyCompany(id, wallet.address);
      if (result?.verification?.url) window.open(result.verification.url, '_blank', 'noopener,noreferrer');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start KYB verification.');
    } finally {
      setVerifyingId('');
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/35">ROBANK / COMPANY</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Company verification.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Enter the legal entity exactly as registered. Didit then checks the official registry for the selected jurisdiction and collects any additional KYB details, people or documents required by that registry/workflow.
          </p>
        </div>

        {!wallet?.address && <div className="rounded-xl border border-white/10 bg-white/[.02] p-4 text-sm text-white/40">Connect your ROBANK account to continue.</div>}

        <div className="grid gap-3 sm:grid-cols-3">
          {[['01','Jurisdiction','Choose where the entity is incorporated.'],['02','Registry match','Use the exact legal name and registration number.'],['03','KYB','Didit collects ownership, officers and documents as needed.']].map(([n,t,d]) => <div key={n} className="rounded-xl border border-white/8 bg-ro-panel p-4"><span className="text-[9px] font-mono text-white/25">{n}</span><div className="mt-2 text-sm font-medium">{t}</div><div className="mt-1 text-xs leading-5 text-white/30">{d}</div></div>)}
        </div>

        <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div><div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">LEGAL ENTITY</div><h2 className="mt-2 text-xl font-medium">Start with the registry record.</h2></div>
            <span className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-mono text-white/40">{countryName(country)}</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-[10px] text-white/35">Country / jurisdiction *<select value={country} onChange={(e) => { setCountry(e.target.value); setUsState(''); }} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">{COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryName(code)} ({code})</option>)}</select></label>
            {country === 'US' && <label className="grid gap-2 text-[10px] text-white/35">State / jurisdiction *<select value={usState} onChange={(e) => setUsState(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"><option value="">Select state</option>{US_JURISDICTIONS.map(([code,name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>}
            <label className="grid gap-2 text-[10px] text-white/35">Legal company name *<input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Exact name on the official registry" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" /></label>
            <label className="grid gap-2 text-[10px] text-white/35">Registration number *<input value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="Official registration number" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" /></label>
            <label className="grid gap-2 text-[10px] text-white/35">Entity type<select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"><option>Company</option><option>Corporation</option><option>LLC</option><option>LLP</option><option>Partnership</option><option>Sole proprietorship</option><option>Other</option></select></label>
            <label className="grid gap-2 text-[10px] text-white/35">Tax ID (optional)<input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Only if applicable" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" /></label>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/35">
            <span className="font-medium text-white/55">Important.</span> Do not guess or substitute a trading name, tax number or personal address for the company's registry data. Didit says KYB coverage is jurisdiction-specific, and U.S. companies use a state-specific registry code rather than plain <span className="font-mono">US</span>.
          </div>

          {error && <div className="mt-4 rounded-xl border border-white/10 p-4 text-xs text-white/45">{error}</div>}
          <div className="mt-5 flex justify-end"><button onClick={add} disabled={loading || !wallet?.address} className="rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-35">{loading ? 'Saving…' : 'Save company'}</button></div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/10 p-4 text-xs leading-5 text-white/30">
          <div className="font-mono text-[9px] uppercase tracking-[.16em] text-white/25">WHY THIS FLOW</div>
          <p className="mt-2">Didit can look up the company in the official registry and pre-fill available legal name, registration number, status and registered address. Ownership, officers and supporting documents vary by jurisdiction and may be collected inside the hosted KYB flow.</p>
        </section>

        <section className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">COMPANIES</div>
            <h2 className="mt-2 text-xl font-medium">Verification status.</h2>
          </div>

          {companies.length === 0 ? (
            <div className="rounded-2xl border border-ro-line p-6 text-sm text-white/35">
              No company profiles yet.
            </div>
          ) : (
            companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-ro-line bg-ro-panel p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium">{company.legal_name || company.legalName}</div>
                    <div className="mt-1 text-xs text-white/35">
                      {countryName(company.country_code || company.countryCode || 'XX')}
                      {' · '}
                      {company.registration_number || company.registrationNumber || 'Registration pending'}
                    </div>
                    <div className="mt-2 text-[9px] font-mono uppercase tracking-[.12em] text-white/25">
                      {String(company.verification_status || company.verificationStatus || 'not_started').replace(/_/g, ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => verify(company.id)}
                    disabled={verifyingId === company.id}
                    className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/65 hover:bg-white/5 disabled:opacity-35"
                  >
                    {verifyingId === company.id ? 'Opening KYB…' : 'Verify with Didit →'}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/30">
          <span className="font-medium text-white/55">Important:</span> company KYB and cardholder KYC are separate. A KYB-approved company does not automatically make a person cardholder-approved; if the selected Buvei BIN requires KYC, the individual cardholder must still reach APPROVED status before a card can be issued.
        </div>
      </div>
    </AppShell>
  );
}
