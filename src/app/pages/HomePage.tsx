import React, { FormEvent, useMemo, useState } from 'react';
import { useEffect } from 'react';
import { ArrowRight, Building2, CheckCircle2, Compass, Globe2, Landmark, Mail, MapPin, Phone, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import hcmcMapArt from '../assets/hcmc-map-art.png';
import { investmentNews } from '../data/investmentNews';
import { useApp, UserRole } from '../context/AppContext';
import { FastTrackDraft, SupportDraft, savePendingHomeAction } from '../utils/homeLeadFlow';
import { translateText } from '../utils/localization';

const BRAND = {
  orange: '#eb7a1a',
  orangeSoft: '#fff3e7',
  orangeBorder: '#f0c9a7',
  blue: '#0f3557',
  blueSoft: '#eef4f8',
  blueBorder: '#d9e3ec',
};

const OFFICIAL_VI_TITLE = 'H\u1ea0 T\u1ea6NG X\u00daC TI\u1ebeN \u0110\u1ea6U T\u01af';
const OFFICIAL_VI_TITLE_CITY = 'TH\u00c0NH PH\u1ed0 H\u1ed2 CH\u00cd MINH';
const OFFICIAL_EN_TITLE = 'Hochiminh City Investment Hub';
const OFFICIAL_TAGLINE = 'Your Gateway. Our Support. Your Success';
const HEADER_VI_GOV_LABEL = 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH';
const HEADER_EN_GOV_LABEL = 'HO CHI MINH CITY PEOPLE\'S COMMITTEE';
const HEADER_VI_PORTAL_TITLE = 'Hạ tầng Xúc tiến Đầu tư';
const MAP_PROJECT_POSITIONS: Record<string, { leftPct: number; topPct: number }> = {
  // Manual positions aligned to the provided PNG map artwork.
  p1: { leftPct: 56, topPct: 43 },
  p2: { leftPct: 60, topPct: 74 },
  p3: { leftPct: 27, topPct: 21 },
  p4: { leftPct: 46, topPct: 45 },
  p5: { leftPct: 52, topPct: 50 },
  p6: { leftPct: 34, topPct: 32 },
};

const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  investor: '/investor/explorer',
  gov_operator: '/gov/projects',
  agency: '/agency/projects',
  admin: '/admin/roles',
  executive: '/executive/dashboard',
};

const META: Record<string, { sectorGroup: string; investmentType: string; ward: string }> = {
  p1: { sectorGroup: 'Smart City & Urban Tech', investmentType: 'PPP', ward: 'Linh Trung' },
  p2: { sectorGroup: 'Renewable Energy', investmentType: 'Greenfield', ward: 'Thanh An' },
  p3: { sectorGroup: 'Manufacturing & Industrial', investmentType: 'Greenfield', ward: 'Thai My' },
  p4: { sectorGroup: 'Tourism & Hospitality', investmentType: 'Joint Venture', ward: 'An Khanh' },
  p5: { sectorGroup: 'R&D & Innovation', investmentType: 'Acquisition', ward: 'Hiep Phu' },
  p6: { sectorGroup: 'Food Processing & Supply Chain', investmentType: 'Brownfield', ward: 'Nhuan Duc' },
};

function dueDate(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
}

function amountFromInvestmentSize(investmentSize: string) {
  if (investmentSize === '< $10M') return 8;
  if (investmentSize === '$10M - $50M') return 30;
  if (investmentSize === '$50M - $200M') return 120;
  if (investmentSize === '>$200M') return 250;
  return 25;
}

function selectClassName() {
  return 'h-11 w-full rounded-xl border border-[#d9e3ec] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0f3557]';
}

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, language, setLanguage, projects, opportunities, activeInvestorCompany, setActiveInvestorCompany, createOpportunity, createIssue, addNotification } = useApp();
  const t = (value: string) => translateText(value, language);
  const isVi = language === 'vi';

  const homeProjects = useMemo(() => projects.map((project) => ({ ...project, ...(META[project.id] ?? { sectorGroup: project.sector, investmentType: 'Greenfield', ward: 'Ben Nghe' }) })), [projects]);
  const cityCards = homeProjects.slice(0, 4);
  const sectors = Array.from(new Set(homeProjects.map((project) => project.sectorGroup)));
  const wards = Array.from(new Set(homeProjects.map((project) => project.ward)));

  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [fastTrackNotice, setFastTrackNotice] = useState<string | null>(null);
  const [supportNotice, setSupportNotice] = useState<string | null>(null);
  const [submissionDialog, setSubmissionDialog] = useState<'fast_track' | 'support' | null>(null);
  const [fastTrackForm, setFastTrackForm] = useState<FastTrackDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', country: 'Vietnam', sector: sectors[0] ?? 'Infrastructure', locationNeed: 'Ho Chi Minh City', investmentSize: '$10M - $50M', investmentType: 'Joint Venture', notes: '' });
  const [supportForm, setSupportForm] = useState<SupportDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', projectId: homeProjects[0]?.id ?? 'p1', topic: isVi ? 'L\u00e0m r\u00f5 d\u1ef1 \u00e1n v\u00e0 \u0111i\u1ec1u ph\u1ed1i b\u01b0\u1edbc ti\u1ebfp theo' : 'Project clarification and next-step coordination', message: '', urgent: false });
  const filtered = homeProjects.filter((project) => {
    const haystack = [project.name, project.location, project.description, project.sectorGroup].join(' ').toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (sectorFilter === 'all' || project.sectorGroup === sectorFilter) && (wardFilter === 'all' || project.ward === wardFilter);
  });
  const featured = filtered.slice(0, 4);
  const mapProjects = useMemo(() => ([
    { project: homeProjects.find((item) => item.id === 'p3') ?? homeProjects[2], ...MAP_PROJECT_POSITIONS.p3 },
    { project: homeProjects.find((item) => item.id === 'p6') ?? homeProjects[5], ...MAP_PROJECT_POSITIONS.p6 },
    { project: homeProjects.find((item) => item.id === 'p4') ?? homeProjects[3], ...MAP_PROJECT_POSITIONS.p4 },
    { project: homeProjects.find((item) => item.id === 'p1') ?? homeProjects[0], ...MAP_PROJECT_POSITIONS.p1 },
    { project: homeProjects.find((item) => item.id === 'p5') ?? homeProjects[4], ...MAP_PROJECT_POSITIONS.p5 },
    { project: homeProjects.find((item) => item.id === 'p2') ?? homeProjects[1], ...MAP_PROJECT_POSITIONS.p2 },
  ].filter((item) => item.project)), [homeProjects]);
  const [activeMapProjectId, setActiveMapProjectId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const activeMapProjectMarker = activeMapProjectId ? (mapProjects.find((item) => item.project?.id === activeMapProjectId) ?? null) : null;
  const activeMapProject = activeMapProjectMarker?.project ?? null;

  const submittedType = new URLSearchParams(location.search).get('submitted');
  useEffect(() => {
    if (submittedType === 'fast-track') {
      setSubmissionDialog('fast_track');
      setFastTrackNotice(null);
      setSupportNotice(null);
      return;
    }
    if (submittedType === 'support') {
      setSubmissionDialog('support');
      setFastTrackNotice(null);
      setSupportNotice(null);
    }
  }, [submittedType]);
  const stats = [
    { label: isVi ? 'D\u1ef1 \u00e1n c\u00f4ng b\u1ed1' : 'Published projects', value: `${homeProjects.length}` },
    { label: isVi ? 'Gi\u00e1 tr\u1ecb danh m\u1ee5c' : 'Portfolio value', value: `$${homeProjects.reduce((sum, project) => sum + project.budget, 0).toLocaleString()}M` },
    { label: isVi ? 'Th\u1ecb tr\u01b0\u1eddng quan t\u00e2m' : 'Investor markets', value: `${new Set(opportunities.map((item) => item.investorCountry)).size || 1}+` },
  ];
  const navItems = [
    { label: isVi ? 'Trang ch\u1ee7' : 'Home', id: 'top' },
    { label: isVi ? 'D\u1ef1 \u00e1n' : 'Projects', id: 'discover' },
    { label: isVi ? 'Tiếp nhận nhanh' : 'Quick intake', id: 'fast-track' },
    { label: isVi ? 'H\u1ed7 tr\u1ee3' : 'Support', id: 'support' },
  ];
  const solutionCards = [
    [ShieldCheck, isVi ? 'H\u1ed3 s\u01a1 \u0111\u00e3 x\u00e1c th\u1ef1c' : 'Verified project records', isVi ? 'H\u1ed3 s\u01a1 d\u1ef1 \u00e1n \u0111\u01b0\u1ee3c c\u1ea5u tr\u00fac r\u00f5 r\u00e0ng v\u00e0 s\u1eb5n s\u00e0ng cho quy tr\u00ecnh ra quy\u1ebft \u0111\u1ecbnh.' : 'Structured project records prepared for serious investment review.'],
    [Compass, isVi ? 'L\u1ecdc nhanh theo t\u00edn hi\u1ec7u' : 'Signal-first discovery', isVi ? 'Kh\u00e1m ph\u00e1 theo l\u0129nh v\u1ef1c, quy m\u00f4, \u0111\u1ecba \u0111i\u1ec3m v\u00e0 m\u1ee9c \u0111\u1ed9 s\u1eb5n s\u00e0ng.' : 'Discover by sector, size, geography, and readiness.'],
    [Globe2, isVi ? '\u0110i\u1ec1u ph\u1ed1i h\u1ed7 tr\u1ee3 \u0111\u00fang \u0111\u1ea7u m\u1ed1i' : 'Coordinated investor support', isVi ? 'Y\u00eau c\u1ea7u \u0111\u01b0\u1ee3c chuy\u1ec3n \u0111\u1ebfn \u0111\u00fang \u0111\u01a1n v\u1ecb x\u1eed l\u00fd trong h\u1ea1 t\u1ea7ng c\u1ea5p th\u00e0nh ph\u1ed1.' : 'Requests are routed to the responsible city support desk.'],
    [Building2, isVi ? 'V\u1eadn h\u00e0nh c\u1ea5p th\u00e0nh ph\u1ed1' : 'City-operated platform', isVi ? 'Giao di\u1ec7n doanh nghi\u1ec7p, s\u00e1ng r\u00f5, kh\u00f4ng theo b\u1ed1 c\u1ee5c b\u00e1o \u0111i\u1ec7n t\u1eed.' : 'An enterprise interface designed as operating infrastructure, not a news portal.'],
  ];
  function handOffToLogin(type: 'fast_track' | 'support', payload: FastTrackDraft | SupportDraft) {
    savePendingHomeAction({ type, payload: payload as FastTrackDraft & SupportDraft, createdAt: new Date().toISOString() });
    navigate('/login?source=home');
  }

  function closeSubmissionDialog() {
    setSubmissionDialog(null);
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }

  function submitFastTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fastTrackForm.companyName || !fastTrackForm.contactName || !fastTrackForm.email) {
      setFastTrackNotice(isVi ? 'Vui l\u00f2ng \u0111i\u1ec1n doanh nghi\u1ec7p, ng\u01b0\u1eddi li\u00ean h\u1ec7 v\u00e0 email.' : 'Please complete company, contact, and email.');
      return;
    }
    setFastTrackNotice(null);
    setActiveInvestorCompany(fastTrackForm.companyName);
    if (!role) return handOffToLogin('fast_track', fastTrackForm);
    const project = homeProjects[0];
    if (!project) return;
    const opportunityId = createOpportunity({ projectId: project.id, projectName: project.name, investorName: fastTrackForm.contactName, investorCompany: fastTrackForm.companyName, investorCountry: fastTrackForm.country, investorType: 'Strategic', amount: amountFromInvestmentSize(fastTrackForm.investmentSize), stage: 'new', notes: `Homepage fast-track request. Preferred sector: ${fastTrackForm.sector}. Preferred location: ${fastTrackForm.locationNeed}.`, intakeData: { investmentStructure: fastTrackForm.investmentType, timeline: 'Requested via homepage fast-track entry', fundSource: 'To be confirmed', experience: fastTrackForm.notes || 'Homepage lead', contactEmail: fastTrackForm.email, contactPhone: fastTrackForm.phone || 'To be confirmed' } });
    createIssue({ projectId: project.id, projectName: project.name, title: `Fast-track matching request - ${fastTrackForm.companyName}`, description: fastTrackForm.notes || 'Homepage fast-track request', priority: 'high', status: 'open', assignedTo: 'Investor Relations Desk', dueDate: dueDate(2), reportedBy: fastTrackForm.contactName, category: 'Support' });
    addNotification({ title: 'Fast-track lead captured', message: isVi ? 'Y\u00eau c\u1ea7u fast-track \u0111\u00e3 \u0111\u01b0\u1ee3c chuy\u1ec3n \u0111\u1ebfn b\u00e0n ph\u1ee5 tr\u00e1ch.' : 'Fast-track request routed to the responsible desk.', type: 'success', path: `/gov/opportunities/${opportunityId}` });
    setSubmissionDialog('fast_track');
  }

  function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supportForm.companyName || !supportForm.contactName || !supportForm.email || !supportForm.message) {
      setSupportNotice(isVi ? 'Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ee7 th\u00f4ng tin h\u1ed7 tr\u1ee3.' : 'Please complete the support request details.');
      return;
    }
    setSupportNotice(null);
    setActiveInvestorCompany(supportForm.companyName);
    if (!role) return handOffToLogin('support', supportForm);
    const project = homeProjects.find((item) => item.id === supportForm.projectId) ?? homeProjects[0];
    if (!project) return;
    createIssue({ projectId: project.id, projectName: project.name, title: `Investor support desk request - ${supportForm.topic}`, description: supportForm.message, priority: supportForm.urgent ? 'high' : 'medium', status: 'open', assignedTo: 'Investor Support Desk', dueDate: dueDate(supportForm.urgent ? 1 : 3), reportedBy: supportForm.contactName, category: 'Support' });
    addNotification({ title: 'Support request submitted', message: isVi ? 'Y\u00eau c\u1ea7u h\u1ed7 tr\u1ee3 \u0111\u00e3 \u0111\u01b0\u1ee3c chuy\u1ec3n \u0111\u1ebfn b\u00e0n ph\u1ee5 tr\u00e1ch.' : 'Support request routed to the responsible desk.', type: supportForm.urgent ? 'warning' : 'info', path: '/agency/projects' });
    setSubmissionDialog('support');
  }

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur" style={{ borderColor: BRAND.blueBorder }}>
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: BRAND.orangeSoft, borderColor: BRAND.orangeBorder, color: BRAND.blue }}><Landmark size={18} /></div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: BRAND.orange }}>
                {isVi ? HEADER_VI_GOV_LABEL : HEADER_EN_GOV_LABEL}
              </div>
              <div className="text-sm font-semibold" style={{ color: BRAND.blue }}>
                {isVi ? HEADER_VI_PORTAL_TITLE : OFFICIAL_EN_TITLE}
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
            {navItems.map((item) => <button key={item.id} type="button" className="transition hover:text-slate-900" onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}>{item.label}</button>)}
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full border border-[#d9e3ec] bg-white p-1">{(['vi', 'en'] as const).map((option) => <button key={option} type="button" onClick={() => setLanguage(option)} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: language === option ? BRAND.blue : 'transparent', color: language === option ? '#fff' : BRAND.blue }}>{option.toUpperCase()}</button>)}</div>
            <Button className="rounded-full px-5 text-white" style={{ backgroundColor: BRAND.blue }} asChild><Link to="/login">Login / create account</Link></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-8 lg:px-6">
        <section className="grid items-start gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: BRAND.orangeSoft, borderColor: BRAND.orangeBorder, color: BRAND.orange }}><Sparkles size={14} />{isVi ? 'H\u1ea1 t\u1ea7ng v\u1eadn h\u00e0nh \u0111\u1ea7u t\u01b0 c\u1ea5p th\u00e0nh ph\u1ed1' : 'City-level investment operations infrastructure'}</div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.2] md:text-[52px]" style={{ color: BRAND.blue }}>
              {isVi ? (
                <>
                  {OFFICIAL_VI_TITLE}
                  <br />
                  {OFFICIAL_VI_TITLE_CITY}
                </>
              ) : (
                OFFICIAL_EN_TITLE
              )}
            </h1>
            <div className="mt-4 text-lg font-semibold text-slate-800">{OFFICIAL_EN_TITLE}</div>
            <div className="mt-1 text-sm font-medium text-slate-500">{OFFICIAL_TAGLINE}</div>
            <p className="mt-5 max-w-[620px] text-sm leading-7 text-slate-600 md:text-[15px]">{isVi ? 'N\u1ec1n t\u1ea3ng \u0111\u01b0\u1ee3c thi\u1ebft k\u1ebf nh\u01b0 m\u1ed9t h\u1ea1 t\u1ea7ng v\u1eadn h\u00e0nh \u0111\u1ea7u t\u01b0 c\u1ea5p th\u00e0nh ph\u1ed1, gi\u00fap kh\u00e1m ph\u00e1 d\u1ef1 \u00e1n, \u0111i\u1ec1u ph\u1ed1i h\u1ed7 tr\u1ee3 v\u00e0 r\u00fat ng\u1eafn b\u01b0\u1edbc ti\u1ebfp theo cho nh\u00e0 \u0111\u1ea7u t\u01b0.' : 'A city-operated platform for project discovery, support routing, and investor coordination across Ho Chi Minh City.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-full px-6 text-white" style={{ backgroundColor: BRAND.orange }} onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}>{isVi ? 'Kh\u00e1m ph\u00e1 d\u1ef1 \u00e1n' : 'Explore projects'}</Button>
              <Button variant="outline" className="rounded-full px-6" style={{ borderColor: BRAND.blueBorder, color: BRAND.blue }} onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}>{isVi ? 'Li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3' : 'Contact support'}</Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => <div key={item.label} className="rounded-[22px] border bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}><div className="text-[28px] font-bold leading-none" style={{ color: BRAND.blue }}>{item.value}</div><div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div></div>)}
            </div>
          </div>
          <Card className="overflow-hidden rounded-[30px] border bg-white shadow-[0_30px_70px_rgba(15,53,87,0.08)]" style={{ borderColor: BRAND.blueBorder }}>
            <CardContent className="p-5">
              <div className="rounded-[26px] border p-5" style={{ borderColor: BRAND.blueBorder, background: 'radial-gradient(circle at top left, rgba(255,228,204,0.8), transparent 34%), linear-gradient(180deg, #fafcfe 0%, #ffffff 100%)' }}>
                <div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>HCMC Investment Infrastructure</div><h2 className="mt-2 text-xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'B\u1ea3n \u0111\u1ed3 \u0111i\u1ec1u ph\u1ed1i \u0111\u1ea7u t\u01b0' : 'Investment coordination map'}</h2><p className="mt-2 max-w-[280px] text-sm leading-6 text-slate-500">{isVi ? 'Tr\u1ef1c quan h\u00f3a vai tr\u00f2 \u0111i\u1ec1u ph\u1ed1i d\u1ef1 \u00e1n, h\u1ed7 tr\u1ee3 v\u00e0 v\u1eadn h\u00e0nh c\u1ea5p th\u00e0nh ph\u1ed1.' : 'A visual snapshot of city-level investment coordination and support coverage.'}</p></div><div className="rounded-2xl p-2" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}><ShieldCheck size={20} /></div></div>
                <div className="relative mt-8 h-[600px] overflow-hidden rounded-[26px] border bg-white" style={{ borderColor: BRAND.blueBorder }}>
                  <div className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-full border bg-white/95 px-2 py-2 shadow-sm" style={{ borderColor: BRAND.blueBorder }}>
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold" style={{ color: mapZoom <= 0.6 ? '#94a3b8' : BRAND.blue, backgroundColor: '#f8fafc' }} onClick={() => setMapZoom((current) => Math.max(0.6, Number((current - 0.2).toFixed(1))))} disabled={mapZoom <= 0.6}>-</button>
                    <span className="min-w-10 text-center text-xs font-semibold" style={{ color: BRAND.blue }}>{`${Math.round(mapZoom * 100)}%`}</span>
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold" style={{ color: mapZoom >= 1.8 ? '#94a3b8' : BRAND.blue, backgroundColor: '#f8fafc' }} onClick={() => setMapZoom((current) => Math.min(1.8, Number((current + 0.2).toFixed(1))))} disabled={mapZoom >= 1.8}>+</button>
                  </div>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7fbfe_0%,#fdfefe_100%)]" />
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(15,53,87,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,53,87,0.04) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
                  <div className="absolute inset-0 origin-center transition-transform duration-200" style={{ transform: `scale(${mapZoom})` }}>
                    <img
                      src={hcmcMapArt}
                      alt={isVi ? 'Bản đồ TP. Hồ Chí Minh' : 'Ho Chi Minh City map'}
                      className="absolute inset-[10px] h-[calc(100%-20px)] w-[calc(100%-20px)] object-contain"
                    />
                    <div className="absolute left-4 top-4 z-10 rounded-full border bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm" style={{ borderColor: BRAND.blueBorder, color: BRAND.blue }}>
                      {isVi ? 'B\u1ea3n \u0111\u1ed3 h\u00e0nh ch\u00ednh TP.HCM' : 'Ho Chi Minh City administrative map'}
                    </div>
                    {mapProjects.map(({ project, leftPct, topPct }) => project && (
                      <button
                        key={project.id}
                        type="button"
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        onMouseEnter={() => setActiveMapProjectId(project.id)}
                        onMouseLeave={() => setActiveMapProjectId((current) => (current === project.id ? null : current))}
                        onFocus={() => setActiveMapProjectId(project.id)}
                        onBlur={() => setActiveMapProjectId((current) => (current === project.id ? null : current))}
                        onClick={() => navigate(`/investor/project/${project.id}`)}
                        aria-label={t(project.name)}
                      >
                        <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eb7a1a]/20 blur-[2px]" />
                        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: BRAND.orange }}>
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      </button>
                    ))}
                    {activeMapProject && (
                      <div
                        className="absolute z-30 w-[215px] rounded-[22px] border bg-white/96 p-4 shadow-[0_16px_40px_rgba(15,53,87,0.14)] backdrop-blur"
                        style={{
                          borderColor: BRAND.blueBorder,
                          left: `${activeMapProjectMarker?.leftPct ?? 50}%`,
                          top: `${activeMapProjectMarker?.topPct ?? 50}%`,
                          transform: `${(activeMapProjectMarker?.leftPct ?? 50) > 72 ? 'translate(calc(-100% - 18px), -50%)' : 'translate(18px, -50%)'} ${(activeMapProjectMarker?.topPct ?? 50) > 82 ? 'translateY(-20%)' : ''}`.trim(),
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}>{t((activeMapProject as typeof homeProjects[number] & { sectorGroup: string }).sectorGroup)}</span>
                          <span className="text-[11px] text-slate-400">{`$${activeMapProject.budget}M`}</span>
                        </div>
                        <div className="mt-3 text-sm font-semibold leading-6" style={{ color: BRAND.blue }}>{t(activeMapProject.name)}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><MapPin size={12} />{t(activeMapProject.location)}</div>
                        <p className="mt-3 text-xs leading-5 text-slate-600">{t(activeMapProject.description).slice(0, 88)}...</p>
                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Xem chi ti\u1ebft d\u1ef1 \u00e1n' : 'Open project detail'}<ArrowRight size={12} /></div>
                        <div
                          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white"
                          style={{
                            borderColor: BRAND.blueBorder,
                            borderStyle: 'solid',
                            left: (activeMapProjectMarker?.leftPct ?? 50) > 72 ? 'auto' : '-8px',
                            right: (activeMapProjectMarker?.leftPct ?? 50) > 72 ? '-8px' : 'auto',
                            borderBottomWidth: (activeMapProjectMarker?.leftPct ?? 50) > 72 ? 1 : 0,
                            borderRightWidth: (activeMapProjectMarker?.leftPct ?? 50) > 72 ? 1 : 0,
                            borderLeftWidth: (activeMapProjectMarker?.leftPct ?? 50) > 72 ? 0 : 1,
                            borderTopWidth: 0,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[[isVi ? 'Khu tr\u1ecdng \u0111i\u1ec3m' : 'Priority zones', '06'], [isVi ? '\u0110\u1ea7u m\u1ed1i h\u1ed7 tr\u1ee3' : 'Support desks', '04'], [isVi ? 'D\u1ef1 \u00e1n s\u1eb5n s\u00e0ng' : 'Ready projects', '12']].map(([label, value]) => <div key={label as string} className="rounded-2xl border bg-white px-4 py-3" style={{ borderColor: BRAND.blueBorder }}><div className="text-lg font-semibold" style={{ color: BRAND.blue }}>{value}</div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div></div>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 rounded-[30px] border px-6 py-6" style={{ borderColor: '#f2e2d5', background: 'linear-gradient(135deg, #fff2e6 0%, #f5f8fb 68%, #edf4f9 100%)' }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[720px]"><div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'G\u1ee3i m\u1edf lu\u1ed3ng h\u1ed7 tr\u1ee3' : 'Need tailored support'}</div><div className="mt-2 text-center text-2xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Kh\u00f4ng t\u00ecm th\u1ea5y d\u1ef1 \u00e1n ph\u00f9 h\u1ee3p?' : "Can't find a suitable project?"}</div><div className="mt-2 text-center text-sm leading-7 text-slate-600">{isVi ? 'G\u1eedi bi\u1ec3u m\u1eabu ti\u1ebfp nh\u1eadn nhanh \u0111\u1ec3 h\u1ec7 th\u1ed1ng \u0111i\u1ec1u ph\u1ed1i \u0111\u1ea7u m\u1ed1i ph\u1ee5 tr\u00e1ch v\u00e0 b\u01b0\u1edbc ti\u1ebfp theo trong quy tr\u00ecnh c\u1ea5p th\u00e0nh ph\u1ed1.' : 'Submit a quick intake so the platform can route the responsible desk and coordinate the next step inside the city workflow.'}</div></div>
            <Button className="rounded-full px-6 text-white" style={{ backgroundColor: BRAND.orange }} onClick={() => document.getElementById('fast-track')?.scrollIntoView({ behavior: 'smooth' })}>{isVi ? 'G\u1eedi ti\u1ebfp nh\u1eadn nhanh' : 'Submit quick intake'}</Button>
          </div>
        </section>
        <section id="discover" className="mt-14">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'Kh\u00e1m ph\u00e1 c\u01a1 h\u1ed9i \u0111\u1ea7u t\u01b0' : 'Discover investment opportunities'}</div><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Kh\u00e1m ph\u00e1 c\u01a1 h\u1ed9i \u0111\u1ea7u t\u01b0' : 'Discover investment opportunities'}</h2></div>
            {featured[0] && <Button variant="outline" className="rounded-full px-5" style={{ borderColor: BRAND.orangeBorder, color: BRAND.orange }} asChild><Link to={`/investor/project/${featured[0].id}`}>{isVi ? 'Xem d\u1ef1 \u00e1n ti\u00eau bi\u1ec3u' : 'Open highlighted project'}</Link></Button>}
          </div>
          <Card className="mt-6 rounded-[28px] border bg-white shadow-[0_12px_36px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr,0.8fr,0.8fr,auto]">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input className="h-11 rounded-xl border-[#d9e3ec] pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isVi ? 'T\u00ecm theo t\u00ean d\u1ef1 \u00e1n, l\u0129nh v\u1ef1c ho\u1eb7c \u0111\u1ecba \u0111i\u1ec3m' : 'Search by project, sector, or location'} /></div>
              <select className={selectClassName()} value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}><option value="all">{isVi ? 'T\u1ea5t c\u1ea3 l\u0129nh v\u1ef1c' : 'All sectors'}</option>{sectors.map((sector) => <option key={sector} value={sector}>{t(sector)}</option>)}</select>
              <select className={selectClassName()} value={wardFilter} onChange={(event) => setWardFilter(event.target.value)}><option value="all">{isVi ? 'T\u1ea5t c\u1ea3 khu v\u1ef1c' : 'All areas'}</option>{wards.map((ward) => <option key={ward} value={ward}>{t(ward)}</option>)}</select>
              <Button className="h-11 rounded-full px-6 text-white" style={{ backgroundColor: BRAND.orange }} onClick={() => document.getElementById('featured-projects')?.scrollIntoView({ behavior: 'smooth' })}>{isVi ? 'T\u00ecm d\u1ef1 \u00e1n' : 'Search'}</Button>
            </CardContent>
          </Card>
        </section>

        <section id="featured-projects" className="mt-12">
          <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'D\u1ef1 \u00e1n \u0111\u1ea7u t\u01b0 n\u1ed5i b\u1eadt' : 'Featured investment projects'}</div><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'D\u1ef1 \u00e1n \u0111\u1ea7u t\u01b0 n\u1ed5i b\u1eadt' : 'Featured investment projects'}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {featured.map((project) => (
              <Link key={project.id} to={`/investor/project/${project.id}`}>
                <Card className="overflow-hidden rounded-[26px] border bg-white shadow-[0_16px_40px_rgba(15,53,87,0.06)] transition-transform hover:-translate-y-1" style={{ borderColor: BRAND.blueBorder }}>
                  <div className="grid md:grid-cols-[1.1fr,0.9fr]">
                    <div className="h-[220px] overflow-hidden"><img src={project.image} alt={t(project.name)} className="h-full w-full object-cover" /></div>
                    <CardContent className="flex h-full flex-col justify-between p-5">
                      <div>
                        <div className="flex flex-wrap gap-2"><span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}>{t(project.sectorGroup)}</span><span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: BRAND.blueSoft, color: BRAND.blue }}>{t(project.investmentType)}</span></div>
                        <h3 className="mt-4 text-xl font-semibold leading-snug" style={{ color: BRAND.blue }}>{t(project.name)}</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{t(project.description).slice(0, 140)}...</p>
                      </div>
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-500">{isVi ? '\u0110\u1ecba \u0111i\u1ec3m' : 'Location'}</span><span className="font-medium text-slate-700">{t(project.location)}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-slate-500">{isVi ? 'Quy m\u00f4 v\u1ed1n' : 'Capital size'}</span><span className="font-medium text-slate-700">{`$${project.budget}M`}</span></div>
                        <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Xem chi ti\u1ebft' : 'View detail'}<ArrowRight size={14} /></div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {!featured.length && <Card className="mt-6 rounded-[24px] border bg-white" style={{ borderColor: BRAND.blueBorder }}><CardContent className="p-8 text-center text-sm text-slate-500">{isVi ? 'Ch\u01b0a c\u00f3 d\u1ef1 \u00e1n ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc hi\u1ec7n t\u1ea1i.' : 'No projects match the current filters.'}</CardContent></Card>}
        </section>

        <section className="mt-14"><div className="text-center"><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'Gi\u1ea3i ph\u00e1p to\u00e0n di\u1ec7n cho nh\u00e0 \u0111\u1ea7u t\u01b0' : 'Comprehensive solutions for investors'}</div><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Gi\u1ea3i ph\u00e1p to\u00e0n di\u1ec7n cho nh\u00e0 \u0111\u1ea7u t\u01b0' : 'Comprehensive solutions for investors'}</h2></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {solutionCards.map(([Icon, title, body]) => <Card key={title as string} className="rounded-[24px] border bg-white shadow-[0_10px_30px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}><CardContent className="p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}><Icon size={20} /></div><h3 className="mt-4 text-lg font-semibold" style={{ color: BRAND.blue }}>{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{body}</p></CardContent></Card>)}
          </div>
        </section>
        <section className="mt-14">
          <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'Tin t\u1ee9c \u0111\u1ea7u t\u01b0 TP. H\u1ed3 Ch\u00ed Minh' : 'Investment News of Ho Chi Minh City'}</div><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Tin t\u1ee9c \u0111\u1ea7u t\u01b0 TP. H\u1ed3 Ch\u00ed Minh' : 'Investment News of Ho Chi Minh City'}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {investmentNews.map((item, index) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer"><Card className="h-full overflow-hidden rounded-[26px] border bg-white shadow-[0_12px_36px_rgba(15,53,87,0.05)] transition-transform hover:-translate-y-1" style={{ borderColor: BRAND.blueBorder }}><div className="h-2" style={{ background: index % 2 === 0 ? `linear-gradient(90deg, ${BRAND.orange} 0%, #ffb77c 100%)` : `linear-gradient(90deg, ${BRAND.blue} 0%, #2e5f8f 100%)` }} /><div className="h-[220px] overflow-hidden bg-slate-100"><img src={item.image} alt={isVi ? item.viTitle : item.enTitle} className="h-full w-full object-cover" /></div><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}>{item.source}</span><span className="text-xs text-slate-400">{isVi ? item.viDate : item.enDate}</span></div><h3 className="mt-4 text-lg font-semibold leading-snug" style={{ color: BRAND.blue }}>{isVi ? item.viTitle : item.enTitle}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{isVi ? item.viSummary : item.enSummary}</p><div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND.blue }}>{isVi ? '\u0110\u1ecdc ngu\u1ed3n tin' : 'Read source'}<ArrowRight size={14} /></div></CardContent></Card></a>)}
          </div>
        </section>

        <section id="fast-track" className="mt-14">
          <Card className="rounded-[28px] border bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_100%)] shadow-[0_12px_36px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.orangeBorder }}>
            <CardContent className="px-6 py-6">
              <div className="flex items-center justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'G\u1eedi nhu c\u1ea7u nhanh' : 'Submit quick intake'}</div><h3 className="mt-2 text-2xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Bi\u1ec3u m\u1eabu ti\u1ebfp nh\u1eadn nhanh' : 'Quick intake form'}</h3></div><div className="hidden rounded-2xl p-3 md:block" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}><Compass size={20} /></div></div>
              <div className="mt-5 rounded-2xl border bg-white px-5 py-5" style={{ borderColor: BRAND.blueBorder }}>
                <div className="space-y-4">{[(isVi ? 'Ti\u1ebfp nh\u1eadn nhu c\u1ea7u nh\u00e0 \u0111\u1ea7u t\u01b0' : 'Capture investor demand'), (isVi ? '\u0110i\u1ec1u ph\u1ed1i \u0111\u1ebfn \u0111\u1ea7u m\u1ed1i ph\u1ee5 tr\u00e1ch' : 'Route to the responsible support desk'), (isVi ? 'Ph\u1ed1i h\u1ee3p b\u01b0\u1edbc ti\u1ebfp theo trong quy tr\u00ecnh c\u1ea5p th\u00e0nh ph\u1ed1' : 'Coordinate the next step inside the city workflow')].map((item) => <div key={item} className="flex items-start gap-3"><CheckCircle2 size={18} style={{ color: BRAND.orange }} className="mt-0.5 shrink-0" /><span className="text-sm leading-6 text-slate-700">{item}</span></div>)}</div>
              </div>
              {fastTrackNotice && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{fastTrackNotice}</div>}
              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitFastTrack}>
                <label className="space-y-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{isVi ? 'T\u00ean doanh nghi\u1ec7p' : 'Company name'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={fastTrackForm.companyName} onChange={(event) => setFastTrackForm((current) => ({ ...current, companyName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{isVi ? 'Ng\u01b0\u1eddi li\u00ean h\u1ec7' : 'Contact name'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={fastTrackForm.contactName} onChange={(event) => setFastTrackForm((current) => ({ ...current, contactName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" type="email" value={fastTrackForm.email} onChange={(event) => setFastTrackForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{isVi ? 'L\u0129nh v\u1ef1c quan t\u00e2m' : 'Target sector'}</span><select className={selectClassName()} value={fastTrackForm.sector} onChange={(event) => setFastTrackForm((current) => ({ ...current, sector: event.target.value }))}>{sectors.map((sector) => <option key={sector} value={sector}>{t(sector)}</option>)}</select></label>
                <label className="space-y-2 md:col-span-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{isVi ? 'Ghi ch\u00fa' : 'Notes'}</span><Textarea className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={fastTrackForm.notes} onChange={(event) => setFastTrackForm((current) => ({ ...current, notes: event.target.value }))} /></label>
                <div className="md:col-span-2 flex justify-end"><Button type="submit" className="rounded-full px-6 text-white" style={{ backgroundColor: BRAND.orange }}>{isVi ? 'G\u1eedi ti\u1ebfp nh\u1eadn nhanh' : 'Submit quick intake'}</Button></div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section id="support" className="mt-14">
          <div className="grid gap-6 lg:grid-cols-[0.92fr,1.08fr]">
            <Card className="rounded-[28px] border bg-white shadow-[0_12px_36px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}>
              <CardContent className="p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>Contact Arobid for Support</div>
                <h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'B\u00e0n h\u1ed7 tr\u1ee3 \u0111\u1ea7u t\u01b0' : 'Investor support desk'}</h2>
                <p className="mt-3 max-w-[360px] text-sm leading-7 text-slate-600">{isVi ? 'Gi\u1ea3i \u0111\u00e1p c\u00e2u h\u1ecfi d\u1ef1 \u00e1n, \u0111i\u1ec1u ph\u1ed1i cu\u1ed9c h\u1ecdp v\u00e0 theo d\u00f5i b\u01b0\u1edbc ti\u1ebfp theo trong lu\u1ed3ng c\u00f4ng v\u1ee5 c\u1ea5p th\u00e0nh ph\u1ed1.' : 'Get help with project questions, meeting coordination, and next-step follow-up across the city workflow.'}</p>
                <div className="mt-6 space-y-3">{[(isVi ? 'L\u00e0m r\u00f5 d\u1ef1 \u00e1n v\u00e0 t\u00e0i li\u1ec7u' : 'Project and document clarification'), (isVi ? '\u0110i\u1ec1u ph\u1ed1i l\u1ecbch l\u00e0m vi\u1ec7c v\u1edbi \u0111\u1ea7u m\u1ed1i ph\u1ee5 tr\u00e1ch' : 'Meeting coordination with the responsible desk'), (isVi ? 'Theo d\u00f5i b\u01b0\u1edbc ti\u1ebfp theo trong t\u1eebng lu\u1ed3ng x\u1eed l\u00fd' : 'Track next steps across city processing flows')].map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl border px-4 py-4" style={{ borderColor: BRAND.blueBorder, backgroundColor: '#fbfdff' }}><CheckCircle2 size={18} className="mt-0.5" style={{ color: BRAND.orange }} /><span className="text-sm leading-6 text-slate-700">{item}</span></div>)}</div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl border px-4 py-4" style={{ borderColor: BRAND.orangeBorder, backgroundColor: BRAND.orangeSoft }}><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white"><Building2 size={18} style={{ color: BRAND.orange }} /></div><div><div className="text-sm font-semibold" style={{ color: BRAND.blue }}>Powered by Arobid</div><div className="text-xs text-slate-500">{isVi ? 'H\u1ea1 t\u1ea7ng h\u1ed7 tr\u1ee3 nh\u00e0 \u0111\u1ea7u t\u01b0 c\u1ea5p th\u00e0nh ph\u1ed1' : 'City investment support infrastructure'}</div></div></div>
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border bg-[linear-gradient(180deg,#fffaf4_0%,#ffffff_100%)] shadow-[0_12px_36px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.orangeBorder }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>{isVi ? 'G\u1eedi y\u00eau c\u1ea7u h\u1ed7 tr\u1ee3' : 'Support request form'}</div><h3 className="mt-2 text-2xl font-semibold" style={{ color: BRAND.blue }}>{isVi ? 'Li\u00ean h\u1ec7 b\u00e0n h\u1ed7 tr\u1ee3' : 'Contact support desk'}</h3></div><div className="hidden rounded-2xl p-3 md:block" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}><ArrowRight size={18} /></div></div>
                <form className="mt-5 grid gap-4 rounded-[22px] bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submitSupport}>
                {supportNotice && <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{supportNotice}</div>}
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'T\u00ean doanh nghi\u1ec7p' : 'Company name'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={supportForm.companyName} onChange={(event) => setSupportForm((current) => ({ ...current, companyName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'Ng\u01b0\u1eddi li\u00ean h\u1ec7' : 'Contact name'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={supportForm.contactName} onChange={(event) => setSupportForm((current) => ({ ...current, contactName: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" type="email" value={supportForm.email} onChange={(event) => setSupportForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i' : 'Phone'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={supportForm.phone} onChange={(event) => setSupportForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'D\u1ef1 \u00e1n' : 'Project'}</span><select className={selectClassName()} value={supportForm.projectId} onChange={(event) => setSupportForm((current) => ({ ...current, projectId: event.target.value }))}>{homeProjects.map((project) => <option key={project.id} value={project.id}>{t(project.name)}</option>)}</select></label>
                <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'Ch\u1ee7 \u0111\u1ec1 h\u1ed7 tr\u1ee3' : 'Support topic'}</span><Input className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={supportForm.topic} onChange={(event) => setSupportForm((current) => ({ ...current, topic: event.target.value }))} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{isVi ? 'N\u1ed9i dung h\u1ed7 tr\u1ee3' : 'Support details'}</span><Textarea className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]" value={supportForm.message} onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))} /></label>
                <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><input type="checkbox" checked={supportForm.urgent} onChange={(event) => setSupportForm((current) => ({ ...current, urgent: event.target.checked }))} /><span className="text-sm text-slate-600">{isVi ? '\u0110\u00e1nh d\u1ea5u kh\u1ea9n' : 'Mark as urgent'}</span></label>
                <div className="md:col-span-2 flex justify-end"><Button type="submit" className="rounded-full px-6 text-white" style={{ backgroundColor: BRAND.blue }}>{isVi ? 'G\u1eedi y\u00eau c\u1ea7u h\u1ed7 tr\u1ee3' : 'Submit support request'}</Button></div>
              </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      {submissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {submissionDialog === 'fast_track'
                    ? (isVi ? 'Đã gửi yêu cầu tiếp nhận nhanh' : 'Fast-track request submitted')
                    : t('Support request submitted')}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {submissionDialog === 'fast_track'
                    ? (isVi ? 'Yêu cầu đã được ghi nhận và chuyển vào luồng điều phối phù hợp.' : 'Your request has been recorded and routed into the matching workflow.')
                    : (isVi ? 'Yêu cầu hỗ trợ đã được ghi nhận và chuyển tới đầu mối phụ trách.' : 'Your support request has been recorded and routed to the responsible desk.')}
                </div>
              </div>
              <button type="button" onClick={closeSubmissionDialog} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-700" />
                <div className="mt-2 text-sm font-semibold text-emerald-900">
                  {submissionDialog === 'fast_track'
                    ? (isVi ? 'Đã gửi yêu cầu tiếp nhận nhanh' : 'Fast-track request submitted')
                    : t('Support request submitted')}
                </div>
                <div className="mt-1 text-xs text-emerald-700">
                  {t('This information will be sent to ITPC Communication Portal')}
                </div>
                <button
                  type="button"
                  onClick={closeSubmissionDialog}
                  className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t('Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="border-t bg-white" style={{ borderColor: '#9ca3af' }}>
        <div className="mx-auto max-w-[1180px] px-5 py-10 lg:px-6">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            <div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: BRAND.blue }}>
                  <Building2 size={28} strokeWidth={2.1} />
                </div>
                <div>
                  <div className="text-[15px] font-bold uppercase leading-tight" style={{ color: BRAND.blue }}>
                    {'H\u1ea0 T\u1ea6NG X\u00daC TI\u1ebeN \u0110\u1ea6U T\u01af'}
                  </div>
                  <div className="mt-1 inline-block px-2 py-0.5 text-sm text-slate-500">
                    {'TP. H\u1ed3 Ch\u00ed Minh'}
                  </div>
                </div>
              </div>
              <p className="mt-5 max-w-[470px] text-[15px] leading-8 text-slate-500">
                {'N\u1ec1n t\u1ea3ng h\u1ea1 t\u1ea7ng \u0111\u1ea7u t\u01b0 to\u00e0n di\u1ec7n, k\u1ebft n\u1ed1i nh\u00e0 \u0111\u1ea7u t\u01b0 v\u1edbi c\u01a1 h\u1ed9i ph\u00e1t tri\u1ec3n b\u1ec1n v\u1eefng t\u1ea1i Th\u00e0nh ph\u1ed1 H\u1ed3 Ch\u00ed Minh.'}
              </p>
              <div className="mt-4 text-[15px] text-slate-500">
                Powered by <span className="font-semibold" style={{ color: BRAND.orange }}>Arobid</span>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold" style={{ color: BRAND.blue }}>{'Li\u00ean k\u1ebft'}</div>
              <div className="mt-5 space-y-4 text-[15px] text-slate-500">
                <div>{'Trang ch\u1ee7'}</div>
                <div>{'D\u1ecbch v\u1ee5'}</div>
                <div>{'Gi\u1edbi thi\u1ec7u'}</div>
                <div>{'Li\u00ean h\u1ec7'}</div>
              </div>
            </div>

            <div>
              <div className="text-[15px] font-semibold" style={{ color: BRAND.blue }}>{'Li\u00ean h\u1ec7'}</div>
              <div className="mt-5 space-y-4 text-[15px] text-slate-500">
                <div className="flex items-center gap-3">
                  <MapPin size={16} />
                  <span>{'86 L\u00ea Th\u00e1nh T\u00f4n, Q.1, TP.HCM'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} />
                  <span>1900 1234</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} />
                  <span>invest@hcmc.gov.vn</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t pt-8" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex flex-col gap-4 text-[15px] text-slate-500 md:flex-row md:items-center md:justify-between">
              <div>{'\u00a9 2026 \u1ee6y ban Nh\u00e2n d\u00e2n Th\u00e0nh ph\u1ed1 H\u1ed3 Ch\u00ed Minh. All rights reserved.'}</div>
              <div className="flex flex-wrap gap-6 md:justify-end">
                <span>{'Ch\u00ednh s\u00e1ch b\u1ea3o m\u1eadt'}</span>
                <span>{'\u0110i\u1ec1u kho\u1ea3n s\u1eed d\u1ee5ng'}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

