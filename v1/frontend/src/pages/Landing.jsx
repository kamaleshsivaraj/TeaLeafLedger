import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, Leaf, Scale, Users, Truck, DollarSign, ShieldCheck,
  Printer, Check, ArrowRight, Star, Gauge, LineChart, Wallet,
  Receipt, Sparkles, Building2, Mail, Globe, BarChart3, Lock,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  { icon: Scale, title: 'Live weighment desk', desc: 'The six-step collection flow a clerk runs every day — find supplier, enter bags, auto tare, net weight, rate and tax. Ready in seconds.' },
  { icon: Printer, title: 'POS receipts', desc: 'Print a branded 80mm receipt at the counter — with or without the amount — and keep a searchable record of every weighment.' },
  { icon: DollarSign, title: 'Payments & advances', desc: 'Track advances, payments and outstanding balances in a live ledger, with automatic advance recovery at the weighbridge.' },
  { icon: Truck, title: 'Factory reconciliation', desc: 'Match dispatched leaf against the factory weighbridge and flag variance before it costs you.' },
  { icon: BarChart3, title: 'Reports on demand', desc: 'Daily collection summary, supplier passbook, factory reconciliation and weekly payment sheets — printable with your branding.' },
  { icon: ShieldCheck, title: 'Secure by design', desc: 'JWT auth, per-module role permissions, email & phone verification and Google Authenticator 2FA.' },
  { icon: Gauge, title: 'Grade-wise pricing', desc: 'Set per-grade rates with effective dates, flip them active/inactive and see today’s rate live on the scale.' },
  { icon: Users, title: 'Supplier registry', desc: 'A structured registry of every supplier with divisions, status, monthly leaf and advance balance at a glance.' },
  { icon: LineChart, title: 'Operational day status', desc: 'Open, half day, closed or week off — set the state of the centre and keep history.' },
];

const FEATURES_HIGHLIGHT = ['Find supplier by name, code, phone or division', 'Auto gross → net weight & tare maths', 'CGST / SGST / IGST tax modes', 'Advance recovery capped & automatic', 'Saved collections with edit & delete', 'Printable A4 branded reports'];

const PRICING = [
  {
    name: 'Solo',
    price: 'Free',
    period: 'for 1 centre',
    desc: 'For a single smaller collection centre getting started.',
    features: ['1 collection centre', 'Up to 50 suppliers', 'Daily collection & receipts', 'Supplier passbook', 'Email support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 'Rs. 1,999',
    period: 'per centre / month',
    desc: 'For busy buying centres that need the full operation.',
    features: ['Unlimited suppliers', 'Payments & advances ledger', 'Factory reconciliation', 'Weekly payment sheets', 'All printable reports', 'Priority support'],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'multi-centre',
    desc: 'For estates and groups running several collection points.',
    features: ['Multi-centre dashboard', 'Consolidated reporting', 'Role-based access control', '2FA & SSO readiness', 'Dedicated account manager'],
    cta: 'Contact sales',
    highlight: false,
  },
];

const MOCK_ROWS = [
  ['09:42', 'TF-1045', 'S. Perera', 'Premium', '8.0 kg'],
  ['09:47', 'TF-1042', 'K. Suresh', 'Standard', '12.5 kg'],
  ['10:03', 'TF-1044', 'R. Arul', 'Standard', '7.2 kg'],
  ['10:11', 'TF-1043', 'P. Nadeesha', 'Rejected', '4.8 kg'],
];

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
      <p className="text-sm font-semibold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ======= NAVBAR ======= */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-200/70 dark:border-gray-800 backdrop-blur-xl bg-white/70 dark:bg-gray-950/70">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Leaf size={18} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">TeaLeafLedger</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-brand-700 dark:text-gray-400 dark:hover:text-brand-300 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-colors">
              Get started free
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200/70 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login" className="text-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700">
                Sign in
              </Link>
              <Link to="/signup" className="text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ======= HERO ======= */}
      <section id="home" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-900/20 dark:via-gray-950 dark:to-gray-950" />
        <div className="absolute -top-32 -right-32 -z-10 w-[500px] h-[500px] rounded-full bg-brand-200/40 dark:bg-brand-700/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 -z-10 w-[450px] h-[450px] rounded-full bg-amber-200/40 dark:bg-amber-700/20 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Sparkles size={13} /> Collection Centre Management, reimagined
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-gray-900 dark:text-gray-50">
              Run your tea leaf weighbridge on <span className="text-brand-600 dark:text-brand-400">auto-pilot</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
              TeaLeafLedger digitises the whole collection-centre desk — weigh, tax, pay and print receipts in seconds, while suppliers, rates, advances and reports stay in perfect order.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5">
                Start free <ArrowRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Explore the product
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['KS', 'SP', 'RA', 'PN'].map((inits, i) => (
                  <span key={inits} className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-950 flex items-center justify-center text-[10px] font-bold text-white ${['bg-brand-500', 'bg-amber-500', 'bg-brand-700', 'bg-gray-500'][i]}`}>
                    {inits}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Trusted by collection centres across the island</p>
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xl shadow-brand-900/10 overflow-hidden bg-white dark:bg-gray-900">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400 font-medium">app.tealeafledger.com/collection</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Now weighing</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">S. Perera · TF-1045</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">Premium green leaf</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[['Gross', '10.0 kg'], ['Tare', '2.0 kg'], ['Net', '8.0 kg']].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700 p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{k}</p>
                      <p className="text-base font-extrabold text-brand-700 dark:text-brand-300 mt-1">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-gray-200/60 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-brand-600 text-white">
                    <p className="text-[11px] font-bold tracking-wide">COLLECTION RECEIPT</p>
                    <Printer size={13} />
                  </div>
                  <div className="p-3 space-y-1.5 text-[11px]">
                    {[['Rate', 'Rs. 119.00 / kg'], ['Gross amount', 'Rs. 952.00'], ['Advance recovery', '− Rs. 200.00'], ['Net payable', 'Rs. 752.00']].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 w-36 h-36 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 hidden sm:block">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Today</p>
              <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-300 mt-1">Rs. 24,5<span className="text-base">80</span></p>
              <p className="text-[10px] text-gray-500 mt-1">worth of leaf weighed</p>
              <div className="mt-2 h-6 flex items-end gap-1">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-t bg-brand-400/70" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= STATS BAR ======= */}
      <section className="border-y border-gray-200/70 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['6-step', 'weighment workflow'], ['80mm', 'instant receipts'], ['4', 'trackable report types'], ['2FA', 'security on every role']].map(([num, label]) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">{num}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Features" title="Everything the desk needs, in one ledger" subtitle="From the first bag on the scale to the weekly settlement sheet." />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1">
                <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 dark:from-brand-800 dark:to-brand-700 p-8 md:p-10 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-extrabold">Built for the way a weighbridge actually works</h3>
                <p className="mt-2 text-brand-100 text-sm md:text-base">No generic invoicing blob — every screen follows the real steps your clerk already knows.</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {FEATURES_HIGHLIGHT.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-medium">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-200" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======= ABOUT ======= */}
      <section id="about" className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900 border-y border-gray-200/70 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-3">About</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              A better morning at the leaf-buying centre
            </h2>
            <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
              At a collection centre, a few hours decide everything — hundreds of farmers, thousands of kilos, and a mountain of paper. Missed slips, lost passbooks and late settlements quietly eat a season's margin.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              TeaLeafLedger was built for that exact moment. It turns the weighbridge into a fast, honest, always-in-sync desk so the owner can trust the numbers and the farmer can trust the scale.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-5">
              {[['Accuracy', 'Zero hand-recomputation on the floor'], ['Speed', 'Weigh to receipt in under a minute'], ['Trust', 'Every rupee traceable to a weighment']].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{t}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              [Receipt, '6-step weighment', 'Find → bags → weigh → rate → tax → receipt. The counter flow, faithfully digitised.'],
              [Wallet, 'Live settlement', 'Advances recovered automatically; weekly payment sheets ready when you are.'],
              [Lock, 'Own your security', 'Roles, permissions and 2FA so only the right people touch money and rates.'],
            ].map(([Icon, t, d]) => (
              <div key={t} className="flex gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{t}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4 rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 p-5">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                <Building2 size={20} />
              </span>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Who is it for?</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Tea buying centres, estate weighbridge stations and small-leaf processors ready to leave the paper register behind.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= PRICING ======= */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Pricing" title="Simple plans for your collection centre" subtitle="Start free, grow when your weighing desk does. No hidden fees." />

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((p) => (
              <div key={p.name} className={`relative rounded-2xl border p-8 flex flex-col transition-all hover:-translate-y-1 ${
                p.highlight
                  ? 'border-brand-500 dark:border-brand-500 shadow-xl shadow-brand-600/20 bg-white dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-600 text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {p.name === 'Enterprise' && <Building2 size={15} className="text-gray-400" />}
                  {p.name}
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{p.price}</span>
                  <span className="ml-1.5 text-sm text-gray-500 dark:text-gray-400">{p.period}</span>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{p.desc}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.highlight ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-8 text-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    p.highlight
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/25'
                      : 'border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">Prices shown are indicative and may change. Enterprise pricing is customised to your operation.</p>
        </div>
      </section>

      {/* ======= CTA ======= */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 dark:from-brand-800 dark:via-brand-700 dark:to-brand-600 px-8 py-14 md:px-16 text-center text-white">
          <Star size={28} className="mx-auto text-brand-200 mb-4" fill="currentColor" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to retire the paper register?</h2>
          <p className="mt-4 text-brand-100 max-w-xl mx-auto">Set up your collection centre in minutes. Weigh your first bag on a digital receipt today.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/signup" className="px-7 py-3 rounded-xl bg-white text-brand-700 font-bold hover:bg-brand-50 transition-colors shadow-lg">
              Get started free
            </Link>
            <Link to="/login" className="px-7 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors">
              Sign in to your centre
            </Link>
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
                <Leaf size={18} />
              </span>
              <span className="text-lg font-extrabold tracking-tight">TeaLeafLedger</span>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              A full-stack collection centre management system — weigh, tax, pay, print and report from one desk.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <a href="mailto:kamaleshsivaraj@outlook.com" className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-700 dark:text-gray-400 dark:hover:text-brand-300">
                <Mail size={15} /> kamaleshsivaraj@outlook.com
              </a>
              <a href="https://kamaleshsivaraj.dev" className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-700 dark:text-gray-400 dark:hover:text-brand-300">
                <Globe size={15} /> kamaleshsivaraj.dev
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Product</p>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#features" className="hover:text-brand-700 dark:hover:text-brand-300">Features</a></li>
              <li><a href="#pricing" className="hover:text-brand-700 dark:hover:text-brand-300">Pricing</a></li>
              <li><a href="#about" className="hover:text-brand-700 dark:hover:text-brand-300">About</a></li>
              <li><Link to="/signup" className="hover:text-brand-700 dark:hover:text-brand-300">Get started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Modules</p>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li>Daily collection</li>
              <li>Farmers & suppliers</li>
              <li>Payments & advances</li>
              <li>Factory reconciliation</li>
              <li>Reports</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} TeaLeafLedger · Kamalesh Sivaraj</p>
            <p className="flex items-center gap-1.5">Crafted with <Leaf size={13} className="text-brand-600 dark:text-brand-400" /> for tea country</p>
          </div>
        </div>
      </footer>
    </div>
  );
}