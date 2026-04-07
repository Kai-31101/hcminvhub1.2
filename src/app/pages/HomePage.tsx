import React, { FormEvent, useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Compass, Globe2, Headset, Landmark, Mail, Map, MapPin, Phone, Search, ShieldCheck, Star, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ExplorerFooter } from '../components/ExplorerFooter';
import { ExplorerActionModal } from '../components/ExplorerActionModal';
import { PublicPortalHeader } from '../components/PublicPortalHeader';
import { ClearableSelectField } from '../components/ui/clearable-select-field';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { SeeAllButton } from '../components/SeeAllButton';
import designHeroSkyline from '../assets/design-hero-skyline.png';
import homeHeroFigmaCity from '../assets/home-hero-figma-city.png';
import homeHeroInteractive from '../assets/home-hero-interactive.png';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../data/administrativeLocations';
import { investmentNews } from '../data/investmentNews';
import { useApp } from '../context/AppContext';
import { FastTrackDraft, SupportDraft } from '../utils/homeLeadFlow';
import { translateText } from '../utils/localization';
import { normalizeProjectStatus } from '../utils/projectStatus';

const BRAND = {
  orange: '#eb7a1a',
  orangeSoft: '#fff3e7',
  orangeBorder: '#f0c9a7',
  blue: '#0f3557',
  blueSoft: '#eef4f8',
  blueBorder: '#d9e3ec',
};

const HEADER_VI_GOV_LABEL = 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH';
const HEADER_EN_GOV_LABEL = 'HO CHI MINH CITY PEOPLE\'S COMMITTEE';
const OFFICIAL_VI_TITLE = 'H\u1ea0 T\u1ea6NG X\u00daC TI\u1ebeN \u0110\u1ea6U T\u01af';
const OFFICIAL_EN_TITLE = 'Hochiminh City Investment Hub';
const OFFICIAL_TAGLINE = 'Your Gateway. Our Support. Your Success';
const ALL_OPTION = '__all__';
const DEFAULT_LIST_COUNT = 6;
const PAGINATION_PAGE_SIZE = 9;
const DEFAULT_PROJECT_TYPE = 'public';
const HERO_HOTSPOTS = [
  { id: 'hotspot-west', projectId: 'p3', left: 8, top: 56, color: '#5140b2' },
  { id: 'hotspot-center-west', projectId: 'p1', left: 25, top: 45, color: '#5d7486' },
  { id: 'hotspot-south', projectId: 'p4', left: 31, top: 70, color: '#c7b326' },
  { id: 'hotspot-center', projectId: 'p5', left: 57, top: 43, color: '#5aa85e' },
  { id: 'hotspot-east-center', projectId: 'p6', left: 69, top: 53, color: '#ca4a9b' },
  { id: 'hotspot-south-east', projectId: 'p2', left: 65, top: 73, color: '#443c5d' },
  { id: 'hotspot-east', projectId: 'p4', left: 84, top: 45, color: '#c87a29' },
];

const META: Record<string, { sectorGroup: string; investmentType: string; ward: string }> = {
  p1: { sectorGroup: 'Smart City & Urban Tech', investmentType: 'PPP', ward: 'Phường Thủ Đức' },
  p2: { sectorGroup: 'Renewable Energy', investmentType: 'Greenfield', ward: 'Xã Thanh An' },
  p3: { sectorGroup: 'Manufacturing & Industrial', investmentType: 'Greenfield', ward: 'Xã Thái Mỹ' },
  p4: { sectorGroup: 'Tourism & Hospitality', investmentType: 'Joint Venture', ward: 'Phường An Khánh' },
  p5: { sectorGroup: 'R&D & Innovation', investmentType: 'Acquisition', ward: 'Phường Tăng Nhơn Phú' },
  p6: { sectorGroup: 'Food Processing & Supply Chain', investmentType: 'Brownfield', ward: 'Xã Nhuận Đức' },
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

function getMockFollowerCount(projectId: string, budget: number) {
  const seed = projectId.split('').reduce((total, character) => total + character.charCodeAt(0), 0) + budget;
  return 120 + (seed % 38) * 17;
}

function formatFollowerCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
}

function formatPortfolioValue(totalBudgetInMillions: number) {
  return `$${(totalBudgetInMillions / 1000).toFixed(2)}B`;
}

function selectClassName() {
  return 'h-11 w-full rounded-xl border border-[#d9e3ec] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0f3557]';
}

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, projects, watchlist, toggleWatchlist, activeInvestorCompany, setActiveInvestorCompany, createOpportunity, createIssue, addNotification } = useApp();
  const t = (value: string) => translateText(value, language);
  const isVi = language === 'vi';
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const featuredProjectsRef = useRef<HTMLElement | null>(null);

  const homeProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        ...(META[project.id] ?? {
          sectorGroup: project.sector,
          investmentType: 'Greenfield',
          ward: getProjectAdministrativeLocation(project) || project.location,
        }),
      })),
    [projects],
  );
  const sectors = Array.from(new Set(homeProjects.map((project) => project.sectorGroup)));
  const sectorOptions = useMemo(
    () => [
      { value: ALL_OPTION, label: t('All') },
      ...Array.from(new Set(projects.map((project) => project.sector))).map((sector) => ({
        value: sector,
        label: t(sector),
      })),
    ],
    [language, projects],
  );
  const locationOptions = useMemo(
    () => [
      { value: ALL_OPTION, label: t('All areas') },
      ...administrativeLocationOptions.map((locationName) => ({
        value: locationName,
        label: getAdministrativeLocationLabel(locationName, language),
      })),
    ],
    [language],
  );
  const investmentRangeOptions = useMemo(
    () => [
      { value: ALL_OPTION, label: t('Any Range') },
      { value: '0-100', label: '$0 - $100M' },
      { value: '100-250', label: '$100M - $250M' },
      { value: '250-500', label: '$250M - $500M' },
      { value: '500+', label: '$500M+' },
    ],
    [language],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState(ALL_OPTION);
  const [selectedLocation, setSelectedLocation] = useState(ALL_OPTION);
  const [selectedInvestmentRange, setSelectedInvestmentRange] = useState(ALL_OPTION);
  const [selectedProjectType, setSelectedProjectType] = useState(DEFAULT_PROJECT_TYPE);
  const [isPaginationMode, setIsPaginationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fastTrackNotice, setFastTrackNotice] = useState<string | null>(null);
  const [supportNotice, setSupportNotice] = useState<string | null>(null);
  const [isFastTrackModalOpen, setIsFastTrackModalOpen] = useState(false);
  const [submissionDialog, setSubmissionDialog] = useState<'fast_track' | 'support' | null>(null);
  const [fastTrackForm, setFastTrackForm] = useState<FastTrackDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', country: 'Vietnam', sector: '', locationNeed: 'Ho Chi Minh City', investmentSize: '', investmentType: '', notes: '' });
  const [supportForm, setSupportForm] = useState<SupportDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', projectId: homeProjects[0]?.id ?? 'p1', topic: t('Project clarification and next-step coordination'), message: '', urgent: false });
  const filteredProjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const haystack = [project.name, project.location, project.province, project.sector, project.description]
        .join(' ')
        .toLowerCase();
      const district = getProjectAdministrativeLocation(project);
      const projectType = 'public';

      let investmentRangeMatch = true;
      if (selectedInvestmentRange === '0-100') investmentRangeMatch = project.budget < 100;
      if (selectedInvestmentRange === '100-250') investmentRangeMatch = project.budget >= 100 && project.budget < 250;
      if (selectedInvestmentRange === '250-500') investmentRangeMatch = project.budget >= 250 && project.budget < 500;
      if (selectedInvestmentRange === '500+') investmentRangeMatch = project.budget >= 500;

      if (selectedSector !== ALL_OPTION && project.sector !== selectedSector) return false;
      if (selectedLocation !== ALL_OPTION && district !== selectedLocation) return false;
      if (selectedProjectType !== ALL_OPTION && projectType !== selectedProjectType) return false;
      if (!investmentRangeMatch) return false;
      if (keyword && !haystack.includes(keyword)) return false;

      return true;
    });
  }, [projects, searchTerm, selectedInvestmentRange, selectedLocation, selectedProjectType, selectedSector]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGINATION_PAGE_SIZE));
  const visibleProjects = isPaginationMode
    ? filteredProjects.slice((currentPage - 1) * PAGINATION_PAGE_SIZE, currentPage * PAGINATION_PAGE_SIZE)
    : filteredProjects.slice(0, DEFAULT_LIST_COUNT);
  const highlightedProject = homeProjects[0] ?? null;
  const heroHotspots = useMemo(() => HERO_HOTSPOTS.map((hotspot) => ({ ...hotspot, project: homeProjects.find((project) => project.id === hotspot.projectId) ?? null })).filter((hotspot) => hotspot.project), [homeProjects]);
  const [interactiveHero, setInteractiveHero] = useState(false);
  const [activeHeroHotspotId, setActiveHeroHotspotId] = useState<string | null>(null);

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
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedInvestmentRange, selectedLocation, selectedProjectType, selectedSector]);
  const stats = useMemo(() => {
    const totalFollowers = projects.reduce((sum, project) => sum + getMockFollowerCount(project.id, project.budget), 0);

    return [
      { label: 'Total Projects', value: `${projects.length}` },
      { label: 'Active Sectors', value: `${new Set(projects.map((project) => project.sector)).size}` },
      { label: 'Follower', value: formatFollowerCount(totalFollowers) },
      { label: 'Investment Value', value: formatPortfolioValue(projects.reduce((sum, project) => sum + project.budget, 0)) },
    ];
  }, [projects]);
  const keyStats = useMemo(
    () => {
      const totalFollowers = projects.reduce((sum, project) => sum + getMockFollowerCount(project.id, project.budget), 0);

      return [
        { label: 'Total Projects', value: `${projects.length}` },
        { label: 'Active Sectors', value: `${new Set(projects.map((project) => project.sector)).size}` },
        { label: 'Follower', value: formatFollowerCount(totalFollowers) },
        { label: 'Investment Value', value: formatPortfolioValue(projects.reduce((sum, project) => sum + project.budget, 0)) },
      ];
    },
    [projects],
  );
  const navItems = [
    { label: t('Home'), id: 'top' },
    { label: t('Projects'), id: 'discover' },
    { label: t('Quick intake'), id: 'fast-track' },
    { label: t('Support'), id: 'support' },
  ];
  const solutionCards = [
    [ShieldCheck, t('Verified project records'), t('Structured project records prepared for serious investment review.')],
    [Compass, t('Signal-first discovery'), t('Discover by sector, size, geography, and readiness.')],
    [Globe2, t('Coordinated investor support'), t('Requests are routed to the responsible city support desk.')],
    [Building2, t('City-operated platform'), t('An enterprise interface designed as operating infrastructure, not a news portal.')],
  ];
  function closeSubmissionDialog() {
    setSubmissionDialog(null);
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }

  function openFastTrackModal() {
    setFastTrackNotice(null);
    setIsFastTrackModalOpen(true);
  }

  function closeFastTrackModal() {
    setFastTrackNotice(null);
    setIsFastTrackModalOpen(false);
  }

  function enterInteractiveHero() {
    setInteractiveHero(true);
    setActiveHeroHotspotId((current) => current ?? heroHotspots[0]?.id ?? null);
  }

  function exitInteractiveHero() {
    setInteractiveHero(false);
  }

  function openHeroMapView() {
    enterInteractiveHero();
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetExplorerFilters() {
    setSearchTerm('');
    setSelectedSector(ALL_OPTION);
    setSelectedLocation(ALL_OPTION);
    setSelectedInvestmentRange(ALL_OPTION);
    setSelectedProjectType(DEFAULT_PROJECT_TYPE);
    setIsPaginationMode(false);
    setCurrentPage(1);
  }

  function enablePaginationMode() {
    setIsPaginationMode(true);
    setCurrentPage(1);
  }

  function handleToggleWatchlist(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleWatchlist(id);
  }

  function submitFastTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fastTrackForm.companyName || !fastTrackForm.contactName || !fastTrackForm.email) {
      setFastTrackNotice(t('Please complete company, contact, and email.'));
      return;
    }
    setFastTrackNotice(null);
    setActiveInvestorCompany(fastTrackForm.companyName);
    const project = homeProjects[0];
    if (!project) return;
    const opportunityId = createOpportunity({ projectId: project.id, projectName: project.name, investorName: fastTrackForm.contactName, investorCompany: fastTrackForm.companyName, investorCountry: fastTrackForm.country, investorType: 'Strategic', amount: amountFromInvestmentSize(fastTrackForm.investmentSize), stage: 'new', notes: `Homepage fast-track request. Preferred sector: ${fastTrackForm.sector}. Preferred location: ${fastTrackForm.locationNeed}.`, intakeData: { investmentStructure: fastTrackForm.investmentType, timeline: 'Requested via homepage fast-track entry', fundSource: 'To be confirmed', experience: fastTrackForm.notes || 'Homepage lead', contactEmail: fastTrackForm.email, contactPhone: fastTrackForm.phone || 'To be confirmed' } });
    createIssue({ projectId: project.id, projectName: project.name, title: `Fast-track matching request - ${fastTrackForm.companyName}`, description: fastTrackForm.notes || 'Homepage fast-track request', priority: 'high', status: 'open', assignedTo: 'Investor Relations Desk', dueDate: dueDate(2), reportedBy: fastTrackForm.contactName, category: 'Support' });
    addNotification({ title: 'Fast-track lead captured', message: t('Fast-track request routed to the responsible desk.'), type: 'success', path: `/gov/opportunities/${opportunityId}` });
    setIsFastTrackModalOpen(false);
    setSubmissionDialog('fast_track');
  }

  function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supportForm.companyName || !supportForm.contactName || !supportForm.email || !supportForm.phone || !supportForm.message) {
      setSupportNotice(t('Please complete the support request details.'));
      return;
    }
    setSupportNotice(null);
    setActiveInvestorCompany(supportForm.companyName);
    const project = homeProjects.find((item) => item.id === supportForm.projectId) ?? homeProjects[0];
    if (!project) return;
    createIssue({ projectId: project.id, projectName: project.name, title: `Investor support desk request - ${supportForm.topic}`, description: supportForm.message, priority: supportForm.urgent ? 'high' : 'medium', status: 'open', assignedTo: 'Investor Support Desk', dueDate: dueDate(supportForm.urgent ? 1 : 3), reportedBy: supportForm.contactName, category: 'Support' });
    addNotification({ title: 'Support request submitted', message: t('Support request routed to the responsible desk.'), type: supportForm.urgent ? 'warning' : 'info', path: '/agency/projects' });
    setSubmissionDialog('support');
  }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-white text-slate-900">
      <PublicPortalHeader
        items={navItems.map((item) => ({
          label: item.label,
          onClick: () => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }),
        }))}
        title={t('Hochiminh City Investment Hub')}
        subtitle={t("HO CHI MINH CITY PEOPLE'S COMMITTEE")}
        actionLabel={t('Login')}
        actionTo="/login"
      />
      <main className="mx-auto max-w-[1180px] flex-1 px-5 pb-16 pt-0 lg:px-6">
        <section ref={heroSectionRef} className="relative h-[600px] overflow-hidden bg-[#081d36]">
          {!interactiveHero ? (
            <>
              <button
                type="button"
                className="absolute inset-0 block cursor-pointer overflow-hidden"
                onClick={enterInteractiveHero}
                aria-label={t('Open interactive hero banner')}
              >
                <img
                  src={homeHeroFigmaCity}
                  alt={t('Ho Chi Minh City hero banner')}
                  className="h-full w-full scale-[1.08] object-cover object-[center_28%]"
                  draggable={false}
                />
              </button>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.08)_0%,rgba(0,12,33,0.16)_24%,rgba(0,13,38,0.82)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,45,0.88)_0%,rgba(5,22,45,0.48)_26%,rgba(5,22,45,0.12)_56%,rgba(5,22,45,0.12)_84%,rgba(5,22,45,0.62)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_64%,rgba(1,15,33,0.36)_0%,rgba(1,15,33,0.18)_15%,rgba(1,15,33,0)_34%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_98%_95%,rgba(1,15,33,0.86)_0%,rgba(1,15,33,0.58)_3%,rgba(1,15,33,0)_12%)]" />
              <div className="relative flex h-full flex-col justify-between px-6 pb-10 pt-12 lg:px-10 lg:pb-12 lg:pt-14">
                <div className="grid gap-8">
                  <div className="relative z-20 max-w-[520px] pt-4 lg:pt-8">
                    <h1 className="text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] text-white md:text-[54px]">
                      <span className="block">Hochiminh City</span>
                      <span className="mt-2 block" style={{ color: '#ff6a00' }}>Investment Hub</span>
                    </h1>
                    <p className="mt-8 text-[20px] font-medium tracking-[0.03em] text-white/72">
                      {t('Your Gateway. Our Support. Your Success')}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-6">
                      <Button
                        className="inline-flex h-[50px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-6 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
                        style={{ background: 'linear-gradient(180deg, #ff7a1a 0%, #ed6203 100%)' }}
                        onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        {t('Explore Opportunities')}
                      </Button>
                      <button
                        type="button"
                        className="text-[16px] font-semibold text-white underline decoration-[#ff6a00] decoration-[1.5px] underline-offset-4 transition hover:text-white/85"
                        onClick={enterInteractiveHero}
                      >
                        {t('Interactive Map')}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((item) => (
                    <div key={item.label} className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white/70 px-4 py-4 backdrop-blur-sm">
                      <div className="tabular-nums text-[26px] font-normal leading-8 text-[#9d4300]">{item.value}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#455f87]">{t(item.label)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={homeHeroInteractive}
                  alt={t('Ho Chi Minh City interactive hero banner')}
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,13,38,0)_0%,rgba(0,13,38,0.08)_58%,rgba(0,13,38,0.34)_100%)]" />
              <div className="relative h-full">
                <div className="absolute left-6 top-6 z-30 lg:left-8">
                  <button
                    type="button"
                    onClick={exitInteractiveHero}
                    className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-[rgba(4,18,33,0.48)] px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-[rgba(4,18,33,0.68)]"
                  >
                    <ArrowLeft size={16} />
                    {t('Back')}
                  </button>
                </div>
                <div className="absolute inset-0">
                  {heroHotspots.map(({ id, projectId, left, top, color, project }) => {
                    if (!project) return null;
                    const isActive = activeHeroHotspotId === id;
                    const cardPositionClass = left > 70
                      ? 'right-[calc(100%+14px)] items-end text-right'
                      : 'left-[calc(100%+14px)] items-start text-left';
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none ${isActive ? 'z-40' : 'z-20'}`}
                        style={{ left: `${left}%`, top: `${top}%` }}
                        onMouseEnter={() => setActiveHeroHotspotId(id)}
                        onMouseLeave={() => setActiveHeroHotspotId((current) => (current === id ? null : current))}
                        onFocus={() => setActiveHeroHotspotId(id)}
                        onBlur={() => setActiveHeroHotspotId((current) => (current === id ? null : current))}
                        onClick={() => navigate(`/investor/project/${projectId}`)}
                        aria-label={t(project.name)}
                      >
                        <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md" style={{ backgroundColor: `${color}66` }} />
                        <MapPin size={28} fill={color} color={color} strokeWidth={1.8} className={`drop-shadow-[0_10px_18px_rgba(15,23,42,0.38)] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                        {isActive && (
                          <span className={`absolute top-1/2 z-50 flex w-[240px] -translate-y-1/2 ${cardPositionClass}`}>
                            <span className="block rounded-none border border-white/18 bg-[rgba(7,18,35,0.88)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.42)] backdrop-blur">
                              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
                                <MapPin size={12} />
                                {t(project.sectorGroup)}
                              </span>
                              <span className="mt-3 block overflow-hidden rounded-none border border-white/10 bg-white/5">
                                <img src={project.image} alt={t(project.name)} className="h-[120px] w-full object-cover" />
                              </span>
                              <span className="mt-3 block text-sm font-semibold leading-5 text-white">
                                {t(project.name)}
                              </span>
                              <span className="mt-2 block text-xs leading-5 text-white/72">
                                {getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language)}
                              </span>
                              <span className="mt-2 block text-[11px] leading-5 text-white/78">
                                {t(project.description).slice(0, 86)}...
                              </span>
                              <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-[#ffb77c]">
                                {t('Open project detail')}
                                <ArrowRight size={12} />
                              </span>
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
        <section
          id="fast-track"
          className="relative z-20 w-full border px-6 py-4 md:px-8 md:py-4"
          style={{ borderColor: '#f2e2d5', background: 'linear-gradient(135deg, #fff2e6 0%, #f5f8fb 68%, #edf4f9 100%)' }}>
          <div className="grid gap-4 md:grid-cols-2 md:items-center">
            <div className="flex min-h-[96px] flex-col items-center justify-center text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.orange }}>
                {t('Need tailored support')}
              </div>
              <div className="mt-2 text-2xl font-semibold" style={{ color: BRAND.blue }}>
                {t("FAST-TRACK")}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {t('Submit a quick intake')}
              </div>
            </div>
            <div className="flex min-h-[96px] items-center justify-center">
              <Button
                className="inline-flex h-[50px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-6 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: BRAND.orange }}
                onClick={openFastTrackModal}
              >
                {t('Submit quick intake')}
              </Button>
            </div>
          </div>
        </section>
        <section id="discover" className="mt-10">
          <Card className="mt-6 rounded-none border bg-white shadow-[0_12px_36px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}>
            <CardContent className="grid gap-5 p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7164]" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t('Search by project name, ID, or keywords...')}
                    className="h-[60px] rounded-none border-[rgba(224,192,177,0.2)] bg-[#f2f4f6] pl-12 text-[16px] text-[#191c1e] shadow-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={openHeroMapView}
                  className="inline-flex h-[60px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-6 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
                >
                  <Map size={18} />
                  {t('View on Map')}
                </button>
              </div>

              <div className="grid gap-4 border-t border-[rgba(224,192,177,0.12)] pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
                <div className="space-y-2">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Sector')}</div>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="h-[44px] w-full rounded-none border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] text-[#455f87] shadow-none">
                      <SelectValue placeholder={t('All Sectors')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Location')}</div>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-[44px] w-full rounded-none border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] text-[#455f87] shadow-none">
                  <SelectValue placeholder={t('All areas')} />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Investment Size')}</div>
                  <Select value={selectedInvestmentRange} onValueChange={setSelectedInvestmentRange}>
                    <SelectTrigger className="h-[44px] w-full rounded-none border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] text-[#455f87] shadow-none">
                      <SelectValue placeholder={t('Any Range')} />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Project Type')}</div>
                  <div className="inline-flex rounded-none bg-[#f2f4f6] p-1">
                    {[
                      { value: 'public', label: 'Public' },
                      { value: 'private', label: 'Private' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedProjectType(option.value)}
                        className={`rounded-none px-4 py-2 text-[13px] font-medium transition-colors ${
                          selectedProjectType === option.value
                            ? 'bg-[#ffd7c5] text-[#6a2d00]'
                            : 'text-[#455f87]'
                        }`}
                      >
                        {t(option.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetExplorerFilters}
                  className="justify-self-start border-b border-[rgba(157,67,0,0.2)] pb-1 text-[14px] font-medium text-[#9d4300] lg:justify-self-end"
                >
                  {t('Clear all filters')}
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="featured-projects" ref={featuredProjectsRef} className="mt-12 space-y-10">
          <div><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{t('Featured investment projects')}</h2></div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[14px] text-[#455f87]">
              {t('Showing')} <span className="font-semibold text-[#191c1e]">{filteredProjects.length}</span> {t('projects')}
            </div>
            <div className="text-[12px] uppercase tracking-[0.12em] text-[#8c7164]">
              {t('Sorted by')}: <span className="text-[#455f87]">{t('Relevance')}</span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {visibleProjects.map((project) => {
              const isWatching = watchlist.includes(project.id);
              const followerCount = getMockFollowerCount(project.id, project.budget);
              const locationLabel = getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language);

              return (
                <Link
                  key={project.id}
                  to={`/investor/project/${project.id}`}
                  className="group overflow-hidden rounded-none border border-[rgba(224,192,177,0.1)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(69,95,135,0.12)]"
                >
                  <div className="relative h-52 overflow-hidden bg-[#e0e3e5]">
                    <img
                      src={project.image}
                      alt={t(project.name)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <div className="rounded-none border border-white/60 bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9d4300] shadow-sm">
                        {formatFollowerCount(followerCount)} {t('followers')}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => handleToggleWatchlist(project.id, event)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-none border backdrop-blur-sm transition-colors ${
                          isWatching
                            ? 'border-[#f6d6bf] bg-[#fff1e7] text-[#9d4300]'
                            : 'border-white/70 bg-white/92 text-[#8c7164] hover:text-[#9d4300]'
                        }`}
                        aria-label={isWatching ? t('Watching') : t('Follow')}
                      >
                        <Star size={14} fill={isWatching ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-none bg-white/92 px-2 py-1 text-[10px] uppercase tracking-[0.06em] text-[#9d4300] shadow-sm">
                        {t(project.sector)}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-[290px] flex-col px-5 py-5">
                    <div>
                      <h3 className="line-clamp-2 text-[20px] font-normal leading-7 text-[#191c1e]">
                        {t(project.name)}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-[12px] text-[#455f87]">
                        <MapPin size={13} />
                          <span className="line-clamp-1">{locationLabel}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 min-h-[72px] text-[14px] leading-[1.65] text-[#455f87]">
                        {t(project.description)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-3 border-t border-[rgba(224,192,177,0.15)] pt-4">
                      {[
                        { label: 'Total Budget', value: `$${project.budget}M` },
                        { label: 'IRR', value: t(project.returnRate) },
                        { label: 'Min Invest', value: `$${project.minInvestment}M` },
                        { label: 'Timeline', value: t(project.timeline) },
                      ].map((metric) => (
                        <div key={metric.label} className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.08em] text-[#8c7164]">
                            {t(metric.label)}
                          </div>
                          <div className="mt-1 truncate text-[12px] font-medium text-[#191c1e]">
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(project.highlights ?? []).slice(0, 2).map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-none bg-[#f2f4f6] px-2 py-1 text-[11px] font-medium text-[#455f87]"
                        >
                          {t(highlight)}
                        </span>
                      ))}
                      {(project.highlights?.length ?? 0) > 2 && (
                        <span className="rounded-none bg-[#f2f4f6] px-2 py-1 text-[11px] font-medium text-[#8c7164]">
                          +{(project.highlights?.length ?? 0) - 2}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-[rgba(224,192,177,0.15)] pt-4">
                      <button
                        type="button"
                        onClick={(event) => handleToggleWatchlist(project.id, event)}
                        className={`inline-flex items-center justify-center rounded-none px-4 py-2 text-[14px] font-medium transition-colors ${
                          isWatching
                            ? 'bg-[#fff1e7] text-[#9d4300]'
                            : 'bg-[#f2f4f6] text-[#455f87] hover:bg-[#e6eaee]'
                        }`}
                      >
                        {isWatching ? t('Watching') : t('Follow')}
                      </button>
                      <div className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#9d4300]">
                        {t('View detail')}
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!isPaginationMode && filteredProjects.length > 0 && (
            <SeeAllButton label={t('View More')} onClick={enablePaginationMode} />
          )}

          {isPaginationMode && filteredProjects.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex min-w-[88px] items-center justify-center border border-[rgba(224,192,177,0.24)] px-4 py-2 text-[14px] font-medium text-[#455f87] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('Previous')}
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex h-10 min-w-[40px] items-center justify-center border px-3 text-[14px] font-medium transition-colors ${
                    page === currentPage
                      ? 'border-[#9d4300] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] text-white'
                      : 'border-[rgba(224,192,177,0.24)] bg-white text-[#455f87] hover:bg-[#f7f1ec]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex min-w-[88px] items-center justify-center border border-[rgba(224,192,177,0.24)] px-4 py-2 text-[14px] font-medium text-[#455f87] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('Next')}
              </button>
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="rounded-none border border-[rgba(224,192,177,0.1)] bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="text-[18px] font-medium text-[#191c1e]">{t('No projects found')}</div>
              <div className="mt-2 text-[14px] text-[#455f87]">
                {t('Try adjusting your filters to explore other projects.')}
              </div>
            </div>
          )}
        </section>

        <section className="mt-14"><div className="text-center"><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{t('Comprehensive solutions for investors')}</h2></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {solutionCards.map(([Icon, title, body]) => <Card key={title as string} className="rounded-none border bg-white shadow-[0_10px_30px_rgba(15,53,87,0.05)]" style={{ borderColor: BRAND.blueBorder }}><CardContent className="p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}><Icon size={20} /></div><h3 className="mt-4 text-lg font-semibold" style={{ color: BRAND.blue }}>{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{body}</p></CardContent></Card>)}
          </div>
        </section>
        <section className="mt-14 bg-[#455f87] px-6 py-16 text-white md:px-10">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {keyStats.map((item) => (
              <div key={item.label} className="rounded-none border border-white/12 bg-white/6 px-4 py-4 backdrop-blur-sm">
                <div className="tabular-nums text-[26px] font-normal leading-8 text-[#f97316]">{item.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/70">{t(item.label)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-14">
          <div className="text-center"><h2 className="mt-2 text-3xl font-semibold" style={{ color: BRAND.blue }}>{t('Why Ho Chi Minh City?')}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {investmentNews.map((item, index) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer"><Card className="h-full overflow-hidden rounded-none border bg-white shadow-[0_12px_36px_rgba(15,53,87,0.05)] transition-transform hover:-translate-y-1" style={{ borderColor: BRAND.blueBorder }}><div className="h-2" style={{ background: index % 2 === 0 ? `linear-gradient(90deg, ${BRAND.orange} 0%, #ffb77c 100%)` : `linear-gradient(90deg, ${BRAND.blue} 0%, #2e5f8f 100%)` }} /><div className="h-[220px] overflow-hidden bg-slate-100"><img src={item.image} alt={isVi ? item.viTitle : item.enTitle} className="h-full w-full object-cover" /></div><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: BRAND.orangeSoft, color: BRAND.orange }}>{item.source}</span><span className="text-xs text-slate-400">{isVi ? item.viDate : item.enDate}</span></div><h3 className="mt-4 text-lg font-semibold leading-snug" style={{ color: BRAND.blue }}>{isVi ? item.viTitle : item.enTitle}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{isVi ? item.viSummary : item.enSummary}</p><div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND.blue }}>{t('Read source')}<ArrowRight size={14} /></div></CardContent></Card></a>)}
          </div>
        </section>
        <section id="support" className="mt-16">
          <div className="overflow-hidden bg-white shadow-[0_32px_72px_rgba(15,23,42,0.18)]">
            <div className="grid bg-white lg:grid-cols-[1fr_1.08fr]">
              <div className="relative min-h-[220px] lg:min-h-full">
                <img src={designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-[rgba(7,17,31,0.62)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.22)_0%,rgba(7,17,31,0.68)_100%)]" />
                <div className="absolute inset-0 flex items-center justify-center px-6 py-6 lg:px-10">
                  <div className="flex max-w-[640px] flex-col items-center text-center text-white">
                    <div className="inline-flex h-[84px] w-[84px] items-center justify-center rounded-[20px] bg-[#ffe6d8] text-[#f97316] shadow-[0_18px_40px_rgba(0,0,0,0.16)] lg:h-[92px] lg:w-[92px]">
                      <Headset size={44} />
                    </div>
                    <h2 className="mt-4 text-[24px] font-semibold leading-[1.2] text-white lg:text-[26px]">
                      {t('Need assistance with your investment journey?')}
                    </h2>
                    <p className="mt-2 max-w-[560px] text-[15px] leading-[1.5] text-white/88 lg:text-[16px]">
                      {t('Our team is here to provide dedicated guidance and bureaucratic support at every single step of your project implementation.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-white">
                <div className="shrink-0 bg-[#5872A0] px-8 py-3 text-center text-[20px] font-semibold text-white md:px-12 md:py-4">
                  {t('Investment Support')}
                </div>
                <div className="flex-1 px-5 py-4 md:px-8 md:py-4">
                  <form className="space-y-4" onSubmit={submitSupport}>
                    {supportNotice ? (
                      <div className="border border-[#f3c3a7] bg-[#fff1e7] px-4 py-3 text-[14px] text-[#9d4300]">
                        {supportNotice}
                      </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Company Name')} <span className="text-[#f97316]">(*)</span></span>
                        <Input
                          value={supportForm.companyName}
                          onChange={(event) => setSupportForm((current) => ({ ...current, companyName: event.target.value }))}
                          placeholder={t('Enter company name')}
                          className="h-10 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Contact Person')} <span className="text-[#f97316]">(*)</span></span>
                        <Input
                          value={supportForm.contactName}
                          onChange={(event) => setSupportForm((current) => ({ ...current, contactName: event.target.value }))}
                          placeholder={t('Enter full name')}
                          className="h-10 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">Email <span className="text-[#f97316]">(*)</span></span>
                        <Input
                          type="email"
                          value={supportForm.email}
                          onChange={(event) => setSupportForm((current) => ({ ...current, email: event.target.value }))}
                          placeholder={t('Enter email address')}
                          className="h-10 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Phone Number')} <span className="text-[#f97316]">(*)</span></span>
                        <Input
                          value={supportForm.phone}
                          onChange={(event) => setSupportForm((current) => ({ ...current, phone: event.target.value }))}
                          placeholder={t('Enter phone number')}
                          className="h-10 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Support Topic')}</span>
                        <Input
                          value={supportForm.topic}
                          onChange={(event) => setSupportForm((current) => ({ ...current, topic: event.target.value }))}
                          placeholder={t('Project clarification and next-step coordination')}
                          className="h-10 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Project')}</span>
                        <select
                          value={supportForm.projectId}
                          onChange={(event) => setSupportForm((current) => ({ ...current, projectId: event.target.value }))}
                          className="h-10 w-full rounded-[14px] border border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] outline-none"
                        >
                          {homeProjects.map((project) => (
                            <option key={project.id} value={project.id}>{t(project.name)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-[12px] font-medium text-[#1a2755]">{t('Support Details')} <span className="text-[#f97316]">(*)</span></span>
                        <Textarea
                          value={supportForm.message}
                          onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))}
                          rows={4}
                          placeholder={t('Enter your request details')}
                          className="min-h-[96px] rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                        />
                      </label>
                    </div>

                    <div className="flex justify-center pt-0.5">
                      <button
                        type="submit"
                        className="inline-flex min-w-[260px] items-center justify-center gap-3 bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-7 py-3 text-[18px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]"
                      >
                        <Headset size={20} />
                        {t('Contact Support')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {isFastTrackModalOpen && (
        <ExplorerActionModal
          onClose={closeFastTrackModal}
          panelTitle={t('Quick Intake')}
          leftIcon={<Headset size={44} />}
          leftTitle={t('Quick Intake')}
          leftDescription={t('Submit a quick intake so the platform can route the responsible desk and coordinate the next step inside the city workflow.')}
        >
          <form onSubmit={submitFastTrack} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Company Name')} <span className="text-[#f97316]">(*)</span></span>
                <Input
                  value={fastTrackForm.companyName}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, companyName: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter company name')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Contact Person')} <span className="text-[#f97316]">(*)</span></span>
                <Input
                  value={fastTrackForm.contactName}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, contactName: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter full name')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">Email <span className="text-[#f97316]">(*)</span></span>
                <Input
                  type="email"
                  value={fastTrackForm.email}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter email address')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Phone Number')}</span>
                <Input
                  value={fastTrackForm.phone}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, phone: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter phone number')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Country')}</span>
                <Input
                  value={fastTrackForm.country}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, country: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter country')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Preferred Sector')}</span>
                <ClearableSelectField
                  ariaLabel={t('Preferred Sector')}
                  value={fastTrackForm.sector}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, sector: value }))}
                  placeholder={t('Select preferred sector')}
                  options={sectors.map((sector) => ({ value: sector, label: t(sector) }))}
                  className="h-11 rounded-[14px] border border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] outline-none transition focus:border-[#0f3557]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Preferred Location')}</span>
                <Input
                  value={fastTrackForm.locationNeed}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, locationNeed: event.target.value }))}
                  className="h-11 rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                  placeholder={t('Enter preferred location')}
                />
              </label>
              <label className="space-y-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Investment Size')}</span>
                <ClearableSelectField
                  ariaLabel={t('Investment Size')}
                  value={fastTrackForm.investmentSize}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, investmentSize: value }))}
                  placeholder={t('Select investment size')}
                  options={['< $10M', '$10M - $50M', '$50M - $200M', '>$200M'].map((option) => ({ value: option, label: option }))}
                  className="h-11 rounded-[14px] border border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] outline-none transition focus:border-[#0f3557]"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Investment Type')}</span>
                <ClearableSelectField
                  ariaLabel={t('Investment Type')}
                  value={fastTrackForm.investmentType}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, investmentType: value }))}
                  placeholder={t('Select investment type')}
                  options={['I have investment requirements', 'I want project suggestions', 'I need investment support', 'I want to explore partnership', 'Others'].map((option) => ({ value: option, label: t(option) }))}
                  className="h-11 rounded-[14px] border border-[#dfe5ec] bg-[#f7f9fb] px-4 text-[14px] text-[#1f2937] outline-none transition focus:border-[#0f3557]"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[12px] font-medium text-[#1a2755]">{t('Notes')}</span>
                <Textarea
                  value={fastTrackForm.notes}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  placeholder={t('Enter a short note about your investment needs')}
                  className="min-h-[110px] rounded-[14px] border-[#dfe5ec] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#1f2937] shadow-none placeholder:text-[13px] placeholder:text-[#8b97a8]"
                />
              </label>
            </div>

            {fastTrackNotice && (
              <div className="rounded-[14px] border border-[#f2c5a5] bg-[#fff3e7] px-4 py-3 text-sm text-[#9d4300]">
                {fastTrackNotice}
              </div>
            )}

            <div className="flex justify-center pt-1">
              <button
                type="submit"
                className="inline-flex min-w-[240px] items-center justify-center gap-3 bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-7 py-3 text-[18px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]"
              >
                <Mail size={18} />
                {t('Submit quick intake')}
              </button>
            </div>
          </form>
        </ExplorerActionModal>
      )}
      {submissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-xl rounded-none bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {submissionDialog === 'fast_track'
                    ? t('Fast-track request submitted')
                    : t('Support request submitted')}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {submissionDialog === 'fast_track'
                    ? t('Your request has been recorded and routed into the matching workflow.')
                    : t('Your support request has been recorded and routed to the responsible desk.')}
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
                    ? t('Fast-track request submitted')
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
      <ExplorerFooter />
    </div>
  );
}
