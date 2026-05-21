import React, { FormEvent, useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Building2, CheckCircle2, ChevronDown, Cloud, Globe2, Headset, Landmark, Mail, Map, MapPin, Search, SearchCheck, ShieldCheck, Star, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ExplorerActionModal } from '../components/ExplorerActionModal';
import { ClearableSelectField } from '../components/ui/clearable-select-field';
import { InvestmentMapModal } from '../components/InvestmentMapModal';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { SeeAllButton } from '../components/SeeAllButton';
import { ArobidLogo } from '../components/ArobidLogo';
import homeHeroFigmaCity from '../assets/home-hero-figma-city.png';
import homeHeroInteractive from '../assets/home-hero-interactive.png';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../data/administrativeLocations';
import { investmentNews } from '../data/investmentNews';
import { useApp } from '../context/AppContext';
import { FastTrackDraft, SupportDraft } from '../utils/homeLeadFlow';
import { translateText } from '../utils/localization';
import { normalizeProjectStatus } from '../utils/projectStatus';

const HEADER_VI_GOV_LABEL = 'ỦY BAN NHÂN DÂN TP. HỒ CHÍ MINH';
const HEADER_EN_GOV_LABEL = 'HO CHI MINH CITY PEOPLE\'S COMMITTEE';
const OFFICIAL_VI_TITLE = 'H\u1ea0 T\u1ea6NG X\u00daC TI\u1ebeN \u0110\u1ea6U T\u01af';
const OFFICIAL_EN_TITLE = 'Hochiminh City Investment Hub';
const HERO_VIDEO_ID = 'LjDjXXM62Xg';
const HERO_VIDEO_SRC = `https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_VIDEO_ID}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&vq=hd1080`;
const OFFICIAL_TAGLINE = 'Your Gateway. Our Support. Your Success';
const ALL_OPTION = '__all__';
const FEATURED_LIST_COUNT = 3;
const NEW_UPDATE_INITIAL_COUNT = 6;
const NEW_UPDATE_ROW_SIZE = 3;
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

function formatPortfolioValue(totalBudgetInMillions: number, language: 'en' | 'vi') {
  const billions = totalBudgetInMillions / 1000;
  const formatted = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(billions);

  return language === 'vi' ? `${formatted} tỷ USD` : `$${formatted}B`;
}

function formatInvestmentAmount(totalBudgetInMillions: number, language: 'en' | 'vi') {
  const formatted = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(totalBudgetInMillions);
  return language === 'vi' ? `${formatted} triệu USD` : `$${formatted}M`;
}

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, projects, watchlist, toggleWatchlist, activeInvestorCompany, setActiveInvestorCompany, createOpportunity, createIssue, addNotification } = useApp();
  const t = (value: string) => translateText(value, language);
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
  const [newUpdateVisibleCount, setNewUpdateVisibleCount] = useState(NEW_UPDATE_INITIAL_COUNT);
  const [fastTrackNotice, setFastTrackNotice] = useState<string | null>(null);
  const [supportNotice, setSupportNotice] = useState<string | null>(null);
  const [isFastTrackModalOpen, setIsFastTrackModalOpen] = useState(false);
  const [isInvestmentMapOpen, setIsInvestmentMapOpen] = useState(false);
  const [submissionDialog, setSubmissionDialog] = useState<'fast_track' | 'support' | null>(null);
  const [supportAcceptedTerms, setSupportAcceptedTerms] = useState(false);
  const [fastTrackForm, setFastTrackForm] = useState<FastTrackDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', country: t('Vietnam'), sector: '', locationNeed: t('Ho Chi Minh City'), investmentSize: '', investmentType: '', notes: '' });
  const [supportForm, setSupportForm] = useState<SupportDraft>({ companyName: activeInvestorCompany, contactName: '', email: '', phone: '', projectId: homeProjects[0]?.id ?? 'p1', topic: t('Project clarification and next-step coordination'), message: '', urgent: false });
  const filteredProjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const haystack = [project.name, project.location, project.province, project.sector, project.description]
        .join(' ')
        .toLowerCase();
      const district = getProjectAdministrativeLocation(project);
      const projectType = project.projectType ?? DEFAULT_PROJECT_TYPE;

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
  const featuredProjects = filteredProjects.slice(0, FEATURED_LIST_COUNT);
  const updatedProjects = useMemo(
    () => [...filteredProjects].sort((left, right) => (right.updatedAt ?? right.createdAt ?? '').localeCompare(left.updatedAt ?? left.createdAt ?? '')),
    [filteredProjects],
  );
  const visibleUpdatedProjects = updatedProjects.slice(0, newUpdateVisibleCount);
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
    setNewUpdateVisibleCount(NEW_UPDATE_INITIAL_COUNT);
  }, [searchTerm, selectedInvestmentRange, selectedLocation, selectedProjectType, selectedSector]);
  useEffect(() => {
    setFastTrackForm((current) => ({
      ...current,
      country: current.country === 'Vietnam' || current.country === 'Việt Nam' ? t('Vietnam') : current.country,
      locationNeed:
        current.locationNeed === 'Ho Chi Minh City' || current.locationNeed === 'TP. Ho Chi Minh'
          ? t('Ho Chi Minh City')
          : current.locationNeed,
    }));
  }, [language]);
  const investmentSystemCards = useMemo(
    () => [
      {
        title: 'Verified Investment Pipeline',
        description: 'All projects are validated by responsible authorities before publication',
        badge: 'TRUSTED',
        badgeClassName: 'bg-[#ffeae1] text-[#ed6203]',
        Icon: ShieldCheck,
      },
      {
        title: 'Structured Discovery Engine',
        description: 'Filter projects by sector, capital size, readiness, and location',
        badge: 'FILTERED',
        badgeClassName: 'bg-[#ecfeff] text-[#075985]',
        Icon: SearchCheck,
      },
      {
        title: 'Direct Government Routing',
        description: 'Investor requests are handled by the responsible department',
        badge: 'GOV ROUTE',
        badgeClassName: 'bg-[#ecfeff] text-[#0070e0]',
        Icon: Landmark,
      },
      {
        title: 'City-Level Operating System',
        description: 'Not a listing platform — an execution infrastructure',
        badge: 'INFRASTRUCTURE',
        badgeClassName: 'bg-[#dcfce7] text-[#166534]',
        Icon: Cloud,
      },
    ],
    [],
  );
  const investmentSystemMetrics = useMemo(() => {
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
    const averageBudget = projects.length > 0 ? totalBudget / projects.length : 0;

    return [
      { label: 'TOTAL INVESTMENT PROJECTS', value: `${projects.length}` },
      { label: 'TOTAL REGISTERED CAPITAL (USD)', value: formatPortfolioValue(totalBudget, language) },
      { label: 'ACTIVE SECTORS', value: `${new Set(projects.map((project) => project.sector)).size}` },
      { label: 'AVG DEAL SIZE / RANGE', value: formatInvestmentAmount(averageBudget, language) },
    ];
  }, [language, projects]);
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
    setIsInvestmentMapOpen(true);
  }

  function resetExplorerFilters() {
    setSearchTerm('');
    setSelectedSector(ALL_OPTION);
    setSelectedLocation(ALL_OPTION);
    setSelectedInvestmentRange(ALL_OPTION);
    setSelectedProjectType(DEFAULT_PROJECT_TYPE);
    setNewUpdateVisibleCount(NEW_UPDATE_INITIAL_COUNT);
  }

  function handleToggleWatchlist(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleWatchlist(id);
  }

  function renderProjectCard(project: (typeof projects)[number]) {
    const isWatching = watchlist.includes(project.id);
    const followerCount = getMockFollowerCount(project.id, project.budget);
    const locationLabel = getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language);

    return (
      <Link key={project.id} to={`/investor/project/${project.id}`} className="group rounded-xl bg-white p-3 shadow-[0_0_6px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5">
        <div className="relative aspect-[1080/608] overflow-hidden rounded-md bg-[#e0e3e5]">
          <img
            src={project.image}
            alt={t(project.name)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="inline-flex h-6 items-center gap-1.5 rounded-md bg-white/80 px-2 pr-3 text-[10px] leading-3 text-[#1f2937]">
              <User size={12} />
              {formatFollowerCount(followerCount)} {t('followers')}
            </div>
            <button
              type="button"
              onClick={(event) => handleToggleWatchlist(project.id, event)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                isWatching
                  ? 'border-[#f6d6bf] bg-[#fff1e7] text-[#9d4300]'
                  : 'border-white/70 bg-white/92 text-[#8c7164] hover:text-[#9d4300]'
              }`}
              aria-label={isWatching ? t('Watching') : t('Follow')}
            >
              <Star size={14} fill={isWatching ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="rounded-md bg-[#ffeae1] px-2.5 py-1.5 text-[10px] uppercase leading-3 text-[#ed6203]">
              {t(project.sector)}
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md bg-white/80 px-2 pr-3 text-[10px] text-[#030712]">
              <MapPin size={12} />
              {locationLabel}
            </span>
          </div>
        </div>

        <div className="flex min-h-[255px] flex-col px-1.5 py-3">
          <div>
            <h3 className="line-clamp-2 text-[18px] font-semibold leading-7 text-[#030712]">
              {t(project.name)}
            </h3>
            <p className="mt-2 line-clamp-2 min-h-[40px] text-[14px] leading-5 text-[#1f2937]">
              {t(project.description)}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[#6b7280]">
              <Building2 size={14} />
              {t('Opening for Investor')}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4">
            {[
              { label: 'Total Budget', value: formatInvestmentAmount(project.budget, language) },
              { label: 'IRR', value: t(project.returnRate) },
              { label: 'Min Invest', value: formatInvestmentAmount(project.minInvestment, language) },
              { label: 'Timeline', value: t(project.timeline) },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0">
                <div className="text-[10px] uppercase leading-3 text-[#6b7280]">
                  {t(metric.label)}
                </div>
                <div className="mt-2 truncate text-[12px] font-bold leading-4 text-[#92400e]">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-[#e5e7eb] pt-3">
            <div className="inline-flex items-center gap-1 text-[12px] text-[#6b7280]">
              <Globe2 size={14} />
              {t(project.projectType === 'private' ? 'Private' : 'Public')}
            </div>
            <div className="inline-flex items-center gap-1 text-[12px] font-medium text-[#ed6203]">
              {t('Discovery Now')}
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    );
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
      <main className="flex-1 bg-white">
        <section ref={heroSectionRef} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-[#071423] text-white">
          <img
            src={interactiveHero ? homeHeroInteractive : homeHeroFigmaCity}
            alt={t('Ho Chi Minh City hero banner')}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          {!interactiveHero ? (
            <iframe
              title={t('Ho Chi Minh City hero background video')}
              src={HERO_VIDEO_SRC}
              className="pointer-events-none absolute left-1/2 top-[calc(50%-90px)] aspect-video h-[calc(100%+180px)] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              aria-hidden="true"
              tabIndex={-1}
            />
          ) : null}
          <div className="absolute inset-0 bg-transparent" />
          <div className="absolute inset-0 bg-transparent" />

          <header className="absolute left-0 top-0 z-40 flex h-[84px] w-full items-center gap-3 px-6 py-3 md:px-[78px]">
            <button type="button" onClick={() => document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' })} className="relative h-[60px] w-[60px] shrink-0">
              <img src="/figma-homepage/header-logo.png" alt={t('Ho Chi Minh City People Committee')} className="h-full w-full object-contain" />
            </button>
            <nav className="ml-auto hidden items-center gap-8 lg:flex">
              {[
                { label: 'Home', id: 'top', active: true },
                { label: 'Projects map view', action: openHeroMapView },
                { label: 'Projects', id: 'discover' },
                { label: 'Quick Request', id: 'fast-track' },
                { label: 'Support', id: 'support' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.action ? item.action() : document.getElementById(item.id ?? 'top')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`h-[31px] border-b-2 px-2 text-[18px] leading-7 ${item.active ? 'border-[#ed6203] font-bold text-[#ed6203]' : 'border-transparent font-normal text-white'}`}
                >
                  {t(item.label)}
                </button>
              ))}
              <button type="button" disabled aria-disabled="true" className="inline-flex cursor-default items-center gap-3 text-[18px] font-semibold leading-7 text-white">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#1f4b8f]">EN</span>
                EN
                <ChevronDown size={24} />
              </button>
              <Link to="/login" className="inline-flex h-10 w-[151px] items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
                <User size={20} />
                {t('Login')}
              </Link>
            </nav>
          </header>

          {interactiveHero ? (
            <div className="absolute inset-0 z-20">
              <button
                type="button"
                onClick={exitInteractiveHero}
                className="absolute left-6 top-[104px] z-30 inline-flex items-center gap-2 rounded-full border border-white/24 bg-[rgba(4,18,33,0.48)] px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-[rgba(4,18,33,0.68)] md:left-[78px]"
              >
                <ArrowLeft size={16} />
                {t('Back')}
              </button>
              {heroHotspots.map(({ id, projectId, left, top, color, project }) => {
                if (!project) return null;
                const isActive = activeHeroHotspotId === id;
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
                    <MapPin size={30} fill={color} color={color} strokeWidth={1.8} className="drop-shadow-[0_10px_18px_rgba(15,23,42,0.38)]" />
                    {isActive ? (
                      <span className="absolute left-[calc(100%+14px)] top-1/2 block w-[240px] -translate-y-1/2 rounded-md border border-white/18 bg-[rgba(7,18,35,0.88)] p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.42)] backdrop-blur">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>{t(project.sectorGroup)}</span>
                        <img src={project.image} alt={t(project.name)} className="mt-3 h-[120px] w-full rounded-md object-cover" />
                        <span className="mt-3 block text-sm font-semibold leading-5 text-white">{t(project.name)}</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="absolute left-6 top-[clamp(140px,26vh,287px)] z-10 w-[calc(100%-48px)] max-w-[896px] md:left-[78px]">
            <div>
              <h1 className="text-[42px] font-bold leading-[56px] text-[#ed6203] md:text-[48px]">HO CHI MINH CITY</h1>
              <div className="mt-0 flex items-center gap-3 text-[46px] font-extrabold leading-[52px] text-white md:text-[52px]">
                INVESTMENT HUB
              </div>
              <p className="mt-0 text-[24px] leading-8 text-white">{t('Your Gateway. Our Support. Your Success')}</p>
            </div>

            <div className="mt-8 grid max-w-[896px] grid-cols-2 gap-4 md:grid-cols-4">
              {investmentSystemMetrics.map((metric) => (
                <div key={metric.label} className="flex min-h-[118px] flex-col items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                  <div className="text-[32px] font-semibold leading-10 text-white">{metric.value}</div>
                  <div className="mt-1 text-[12px] font-medium uppercase leading-4 text-white/85">{t(metric.label)}</div>
                </div>
              ))}
            </div>

            <div id="fast-track" className="mt-[clamp(24px,7vh,80px)] flex w-full max-w-[384px] flex-col items-center justify-center gap-2 rounded-lg bg-black/20 p-6 text-center shadow-[0_0_8px_rgba(237,98,3,0.12)]">
              <div className="text-[18px] leading-7 text-white">{t('Need tailor support')}</div>
              <div className="text-[24px] font-bold leading-8 text-white">{t('FAST-TRACK')}</div>
              <button type="button" onClick={openFastTrackModal} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 py-2.5 text-[14px] font-medium leading-5 text-white">
                <Mail size={20} />
                {t('Submit Investment Interest')}
              </button>
            </div>
          </div>

          <button type="button" onClick={enterInteractiveHero} className="absolute bottom-10 left-1/2 z-20 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center text-white" aria-label={t('Open interactive hero banner')}>
            <ChevronDown size={30} />
          </button>
        </section>

        <section id="projects-map" className="relative overflow-hidden bg-[#f9fafb] px-6 py-8 md:px-[78px]">
          <div className="relative mx-auto grid max-w-[1284px] items-center gap-8 rounded-lg bg-white px-6 py-8 lg:grid-cols-[451px_1fr] lg:pr-3">
            <div className="flex max-w-[451px] flex-col justify-center gap-3">
              <h2 className="text-[28px] font-bold leading-9 text-[#ed6203]">{t('Smart Investing, Visually Mapped')}</h2>
              <p className="max-w-[424px] text-[12px] leading-4 text-[#6b7280]">
                {t('Explore global opportunities with real-time data and intuitive map-based insights. Navigate the complexity of markets with precision.')}
              </p>
              <button type="button" onClick={openHeroMapView} className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
                <Map size={20} />
                {t('View on map')}
              </button>
            </div>
            <img src="/figma-homepage/map-visual.png" alt="" className="h-[300px] w-full rounded-md object-cover lg:h-[388px]" />
          </div>
        </section>

        <section id="discover" ref={featuredProjectsRef} className="relative overflow-hidden bg-white px-6 py-12 md:px-[78px]">
          <h2 className="text-[28px] font-semibold leading-9 text-[#ed6203]">{t('Featured investment projects')}</h2>
          <div className="mt-6 flex flex-col gap-3">
            <div className="relative w-full">
              <Search size={44} className="absolute left-0 top-3 z-10 rounded-lg bg-[#ed6203] p-3 text-white" />
              <div className="ml-6 flex min-h-[64px] flex-col gap-4 rounded-lg border border-[#ed6203] bg-white py-2.5 pl-10 pr-3 shadow-[0_0_8px_rgba(0,0,0,0.08)] lg:flex-row lg:items-center">
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('Search by project name, ID, or keywords...')} className="h-[42px] min-w-[280px] flex-1 border-0 bg-transparent px-0 text-[14px] font-normal shadow-none focus-visible:ring-0" />
                {[
                  { label: 'Sector', value: selectedSector, set: setSelectedSector, options: sectorOptions },
                  { label: 'Location', value: selectedLocation, set: setSelectedLocation, options: locationOptions },
                  { label: 'Investment size', value: selectedInvestmentRange, set: setSelectedInvestmentRange, options: investmentRangeOptions },
                ].map((filter) => (
                  <Select key={filter.label} value={filter.value} onValueChange={filter.set}>
                    <div className="min-w-[170px] border-l border-[#e5e7eb] pl-3">
                      <span className="block text-[14px] font-semibold leading-5 text-[#030712]">{t(filter.label)}</span>
                      <SelectTrigger className="mt-1 h-8 rounded-md border border-[#d1d5db] bg-white px-3 text-left text-[14px] font-normal text-[#4b5563] shadow-none focus:ring-0">
                        <SelectValue className="font-normal text-[#4b5563]" />
                      </SelectTrigger>
                    </div>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
                <button type="button" onClick={resetExplorerFilters} className="text-[12px] font-medium text-[#6b7280]">{t('Clear All Filter')}</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex h-11 overflow-hidden rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
                {[
                  { value: 'public', label: 'Public Sector', Icon: Globe2 },
                  { value: 'private', label: 'Private Sector', Icon: Briefcase },
                ].map(({ value, label, Icon }) => (
                  <button key={value} type="button" onClick={() => setSelectedProjectType(value)} className={`inline-flex items-center gap-2 px-3 text-[14px] font-medium ${selectedProjectType === value ? 'bg-white text-[#ed6203]' : 'bg-[#f3f4f6] text-[#030712]'}`}>
                    <Icon size={20} />
                    {t(label)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[16px] text-[#030712]">
                {t('Showing')} <span className="text-[#ed6203]">{filteredProjects.length}</span> {t('projects')}
                <span className="h-8 w-px bg-[#e5e7eb]" />
                <button type="button" className="inline-flex items-center gap-2 text-[14px] font-medium">
                  {t('Relevance')}
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {featuredProjects.map(renderProjectCard)}
          </div>

          {filteredProjects.length === 0 && (
            <div className="rounded-none border border-[rgba(224,192,177,0.1)] bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="text-[18px] font-medium text-[#191c1e]">{t('No projects found')}</div>
              <div className="mt-2 text-[14px] text-[#455f87]">
                {t('Try adjusting your filters to explore other projects.')}
              </div>
            </div>
          )}
        </section>

        <section id="new-update-projects" className="relative overflow-hidden bg-[#f9fafb] px-6 py-12 md:px-[78px]">
          <div className="mx-auto max-w-[1284px]">
            <h2 className="text-[28px] font-semibold leading-9 text-[#ed6203]">{t('New Update Projects')}</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {visibleUpdatedProjects.map(renderProjectCard)}
            </div>
            {newUpdateVisibleCount < updatedProjects.length && (
              <SeeAllButton
                label={t('View More')}
                onClick={() => setNewUpdateVisibleCount((count) => Math.min(updatedProjects.length, count + NEW_UPDATE_ROW_SIZE))}
              />
            )}
            {updatedProjects.length === 0 && (
              <div className="rounded-none border border-[rgba(224,192,177,0.1)] bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="text-[18px] font-medium text-[#191c1e]">{t('No projects found')}</div>
                <div className="mt-2 text-[14px] text-[#455f87]">
                  {t('Try adjusting your filters to explore other projects.')}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="investment-system" className="relative overflow-hidden bg-[#1e40af] px-6 py-8 text-white md:px-[78px]">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-70"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'%3E%3Crect width='240' height='160' fill='%231e40af'/%3E%3Cpath d='M48 0 86 28 48 56Z' fill='%232a55c4'/%3E%3Cpath d='M142 20 180 48 142 76Z' fill='%232751c0'/%3E%3Cpath d='M212 0 240 21 212 42Z' fill='%23305ccc'/%3E%3Cpath d='M18 76 56 104 18 132Z' fill='%2317359a'/%3E%3Cpath d='M104 96 142 124 104 152Z' fill='%232449b6'/%3E%3Cpath d='M208 104 240 128 208 152Z' fill='%232d58c8'/%3E%3Cpath d='M0 10 34 35 0 60Z' fill='%23193a9f'/%3E%3C/svg%3E\")",
              backgroundSize: '240px 160px',
            }}
          />
          <div className="relative mx-auto max-w-[1284px]">
            <h2 className="text-center text-[28px] font-semibold leading-9 text-white">{t('How the Investment System Works')}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {investmentSystemCards.map(({ title, description, badge, badgeClassName, Icon }) => (
                <div key={title} className="relative min-h-[156px] overflow-hidden rounded-md bg-white px-3 py-6 text-left text-[#1f2937]">
                  <div className="absolute -right-12 -top-16 h-[155px] w-[155px] rounded-full bg-[#f3f4f6]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#1f2937]">
                      <Icon size={22} />
                    </div>
                    <span className={`rounded-md px-2.5 py-1.5 text-[10px] leading-3 ${badgeClassName}`}>{t(badge)}</span>
                  </div>
                  <h3 className="relative mt-3 text-[16px] font-medium leading-6 text-[#1f2937]">{t(title)}</h3>
                  <p className="relative mt-3 text-[10px] leading-3 text-[#6b7280]">{t(description)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4">
              {investmentSystemMetrics.map((metric, index) => (
                <div key={metric.label} className={`flex flex-col items-center justify-center gap-1.5 text-center ${index > 0 ? 'xl:border-l xl:border-white/40' : ''}`}>
                  <div className="text-[32px] font-semibold leading-10 text-white">{metric.value}</div>
                  <div className="text-[14px] leading-5 text-white">{t(metric.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="support"
          className="relative overflow-hidden bg-white px-6 pb-6 pt-24 md:px-[78px]"
          style={{
            backgroundImage: "url('/figma-homepage/support-pattern.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 206px',
            backgroundPosition: 'left 180px',
          }}
        >
          <div className="absolute inset-0 bg-white/40" />
          <div className="relative mx-auto grid max-w-[1284px] gap-10 lg:grid-cols-[519px_1fr]">
            <div className="flex max-w-[519px] flex-col gap-7">
              <h2 className="text-[28px] font-bold leading-9 text-[#ed6203]">
                {t('Need assistance')}<br />
                {t('with your investment journey?')}
              </h2>
              <p className="max-w-[444px] text-[16px] leading-6 text-black">
                {t('Our team is here to provide dedicated guidance and bureaucratic support at every single step of your project implementation.')}
              </p>
              <img src="/figma-homepage/support-journey.png" alt="" className="h-[173px] w-[284px] rounded-2xl object-cover" />
            </div>

            <form onSubmit={submitSupport} className="flex flex-col gap-4 bg-white/95">
              {supportNotice ? (
                <div className="rounded-md border border-[#f3c3a7] bg-[#fff1e7] px-4 py-3 text-[14px] text-[#9d4300]">
                  {supportNotice}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Company Name')} <span className="text-[#dc2626]">*</span></span>
                  <Input
                    value={supportForm.companyName}
                    onChange={(event) => setSupportForm((current) => ({ ...current, companyName: event.target.value }))}
                    placeholder={t('Enter company name')}
                    className="h-11 rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-none placeholder:text-[#6b7280]"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Contact Person')} <span className="text-[#dc2626]">*</span></span>
                  <Input
                    value={supportForm.contactName}
                    onChange={(event) => setSupportForm((current) => ({ ...current, contactName: event.target.value }))}
                    placeholder={t('Enter full name')}
                    className="h-11 rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-none placeholder:text-[#6b7280]"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Email')} <span className="text-[#dc2626]">*</span></span>
                  <Input
                    type="email"
                    value={supportForm.email}
                    onChange={(event) => setSupportForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder={t('Enter email address')}
                    className="h-11 rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-none placeholder:text-[#6b7280]"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Phone Number')} <span className="text-[#dc2626]">*</span></span>
                  <Input
                    value={supportForm.phone}
                    onChange={(event) => setSupportForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder={t('Enter phone number')}
                    className="h-11 rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-none placeholder:text-[#6b7280]"
                  />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Support Topic')}</span>
                <Input
                  value={supportForm.topic}
                  onChange={(event) => setSupportForm((current) => ({ ...current, topic: event.target.value }))}
                  placeholder={t('Project clarification and next-step coordination')}
                  className="h-11 rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-none placeholder:text-[#6b7280]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Project')}</span>
                <select
                  value={supportForm.projectId}
                  onChange={(event) => setSupportForm((current) => ({ ...current, projectId: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] outline-none"
                >
                  {homeProjects.map((project) => (
                    <option key={project.id} value={project.id}>{t(project.name)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('Support Detail')} <span className="text-[#dc2626]">*</span></span>
                <Textarea
                  value={supportForm.message}
                  onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder={t('Enter a description...')}
                  rows={6}
                  className="min-h-[148px] rounded-lg border-[#d4d4d4] bg-white px-3.5 py-2.5 text-[16px] font-normal text-[#030712] shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-[#737373]"
                />
              </label>

              <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]">
                <input
                  type="checkbox"
                  checked={supportAcceptedTerms}
                  onChange={(event) => setSupportAcceptedTerms(event.target.checked)}
                  className="h-5 w-5 rounded border-[#d4d4d4] accent-[#ed6203]"
                />
                <span>{t('I agree to Ho Chi Minh Investment Hub’s')} <span className="text-[#ed6203] underline">{t('Term and Conditions')}</span></span>
              </label>

              <button
                type="submit"
                disabled={!supportAcceptedTerms}
                className="inline-flex h-10 w-[176px] items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white disabled:bg-[#d1d5db] disabled:text-[#9ca3af]"
              >
                <Headset size={20} />
                {t('Send')}
              </button>
            </form>
          </div>
        </section>

        <section id="why-hcmc" className="px-6 py-10 md:px-[78px]">
          <div className="mx-auto max-w-[1284px]">
            <h2 className="text-[28px] font-semibold leading-9 text-[#ed6203]">{t('Why Ho Chi Minh City?')}</h2>
            <div className="mt-6 flex flex-wrap gap-3 text-[16px] leading-6">
              {['Investment Environment', 'Key Industries', 'Operating Ecosystem', 'Infrastructure & Connectivity', 'Living & Lifestyle'].map((tab, index) => (
                <button key={tab} type="button" className={`h-[31px] px-3 ${index === 0 ? 'border-b-2 border-[#ed6203] font-semibold text-[#ed6203]' : 'text-[#6b7280]'}`}>
                  {t(tab)}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-3 lg:grid-cols-[659px_1fr]">
              <a href={investmentNews[0]?.href} target="_blank" rel="noreferrer" className="relative h-[371px] overflow-hidden rounded-md">
                <img src="/figma-homepage/why-main.png" alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="rounded-md bg-black/35 p-3 backdrop-blur-sm">
                    <span className="rounded-full bg-[#ecfeff] px-2.5 py-1.5 text-[10px] text-[#075985]">VIETNAM NEWS</span>
                    <div className="mt-2 text-[14px] leading-5">April 17, 2026</div>
                    <div className="text-[16px] leading-6">{t('The green living advantages stem from the location and planning of Van Phuc City.')}</div>
                  </div>
                </div>
              </a>
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <a key={item} href={investmentNews[item % investmentNews.length]?.href} target="_blank" rel="noreferrer" className="relative min-h-[180px] overflow-hidden rounded-md">
                    <img src="/figma-homepage/why-card.png" alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <div className="rounded-md bg-black/35 p-3 backdrop-blur-sm">
                        <span className="rounded-full bg-[#ecfeff] px-2.5 py-1.5 text-[10px] text-[#075985]">VIETNAM NEWS</span>
                        <div className="mt-2 text-[14px] leading-5">April 17, 2026</div>
                        <div className="line-clamp-2 text-[16px] leading-6">{t('The green living advantages stem from the location and planning of Van Phuc...')}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="partners" className="relative overflow-hidden bg-white px-6 py-8 md:px-[78px]">
          <img src="/figma-homepage/partners-bg.png" alt="" className="pointer-events-none absolute inset-x-0 top-[-521px] h-[1450px] w-full object-cover opacity-30" />
          <div className="relative mx-auto flex max-w-[1284px] flex-col items-center gap-10">
            <h2 className="text-[28px] font-bold leading-9 text-[#ed6203]">{t('Partners')}</h2>
            <div className="flex w-full flex-col items-center gap-6">
              <div className="text-[16px] font-medium leading-6 text-[#6b7280]">{t('Government')}</div>
              <div className="flex w-full flex-wrap items-center justify-center gap-[90px]">
                {['gov-1.png', 'gov-2.png', 'gov-3b.png', 'gov-4.png', 'gov-5.png'].map((logo) => (
                  <div key={logo} className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-white">
                    <img src={`/figma-homepage/${logo}`} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
              <button type="button" className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-[14px] font-medium text-[#ed6203]">
                {t('See more')}
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="flex w-full flex-col items-center gap-6">
              <div className="text-[16px] font-medium leading-6 text-[#6b7280]">{t('Strategic Partners')}</div>
              <div className="flex w-full flex-wrap items-center justify-center gap-10">
                {['strategic-1.png', 'strategic-2.png', 'strategic-3.png', 'strategic-4.png', 'strategic-5.png'].map((logo) => (
                  <div key={logo} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-white">
                    <img src={`/figma-homepage/${logo}`} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer id="footer" className="border-t border-[#f9fafb] bg-white px-6 py-8 md:px-[78px]">
          <div className="mx-auto flex max-w-[1284px] flex-col gap-3">
            <div className="grid gap-8 lg:grid-cols-[365px_1fr_1fr_327px]">
              <div className="space-y-7">
                <div className="flex items-center gap-[13px]">
                  <img src="/figma-homepage/header-logo.png" alt="" className="h-[50px] w-[50px] object-contain" />
                  <div className="text-[22px] font-bold leading-6 text-[#1f2937]">HCMC<br />INVESTMENT HUB</div>
                </div>
                <p className="text-[12px] leading-4 text-[#6b7280]">© 2024 HCMC Investment Promotion Center. All Rights Reserved.</p>
                <div className="flex gap-3 text-[#1f2937]">
                  <span className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#1877f2] text-[12px] font-bold text-white">f</span>
                  <Mail size={25} />
                  <span className="flex h-[25px] w-[25px] items-center justify-center rounded-sm bg-[#0a66c2] text-[12px] font-bold text-white">in</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[16px] font-bold leading-6 text-[#ed6203]">HCMC INVESTMENT HUB</div>
                {['Projects', 'Projects Map View', 'Why Ho Chi Minh City?'].map((item) => <div key={item} className="text-[14px] leading-5 text-[#030712]">{t(item)}</div>)}
              </div>
              <div className="space-y-3">
                <div className="text-[16px] font-bold leading-6 text-[#ed6203]">{t('SUPPORT')}</div>
                {['Quick Intake', 'Support', 'FAQs'].map((item) => <div key={item} className="text-[14px] leading-5 text-[#030712]">{t(item)}</div>)}
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1.5 text-[10px] leading-3 text-[#166534]">
                  <CheckCircle2 size={15} />
                  Digital Trade & Investment Infrastructure
                </div>
                <div className="flex flex-wrap items-center gap-[13px]">
                  <span className="text-[12px] leading-4 text-[#030712]">{t('Powered by')}</span>
                  <ArobidLogo className="h-[54px] w-[207px] shrink-0" />
                </div>
                <p className="text-[12px] leading-4 text-[#6b7280]">{t('Providing cutting-edge investment management technology for modern government hubs.')}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-[#e5e7eb] pt-3 text-right text-[10px] leading-3 text-[#111827]">
              Privacy Policy&nbsp;&nbsp;&nbsp; Term of Services
            </div>
          </div>
        </footer>
      </main>
      {isFastTrackModalOpen && (
        <ExplorerActionModal
          onClose={closeFastTrackModal}
          closeLabel={t('Close')}
          panelTitle={t('Investment Interest')}
          variant="investment-interest"
          leftIcon={<Landmark size={44} />}
          leftTitle={t('Ready to submit your investment interest?')}
          leftDescription={t('Share your company profile and project intent. Our team will capture the request and coordinate the next step in the city investment workflow.')}
        >
          <form onSubmit={submitFastTrack} className="space-y-3">
            <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span>
                <Input
                  value={fastTrackForm.companyName}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, companyName: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter company name')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Contact Name')}<span className="text-[#dc2626]">*</span></span>
                <Input
                  value={fastTrackForm.contactName}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, contactName: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter full name')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Email')}<span className="text-[#dc2626]">*</span></span>
                <Input
                  type="email"
                  value={fastTrackForm.email}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter email address')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Phone Number')}</span>
                <Input
                  value={fastTrackForm.phone}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, phone: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter phone number')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Country')}</span>
                <Input
                  value={fastTrackForm.country}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, country: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter country')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Preferred Sector')}</span>
                <ClearableSelectField
                  ariaLabel={t('Preferred Sector')}
                  value={fastTrackForm.sector}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, sector: value }))}
                  placeholder={t('Select preferred sector')}
                  options={sectors.map((sector) => ({ value: sector, label: t(sector) }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Preferred Location')}</span>
                <Input
                  value={fastTrackForm.locationNeed}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, locationNeed: event.target.value }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                  placeholder={t('Enter preferred location')}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Size')}</span>
                <ClearableSelectField
                  ariaLabel={t('Investment Size')}
                  value={fastTrackForm.investmentSize}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, investmentSize: value }))}
                  placeholder={t('Select investment size')}
                  options={['< $10M', '$10M - $50M', '$50M - $200M', '>$200M'].map((option) => ({ value: option, label: t(option) }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Type')}</span>
                <ClearableSelectField
                  ariaLabel={t('Investment Type')}
                  value={fastTrackForm.investmentType}
                  onChange={(value) => setFastTrackForm((current) => ({ ...current, investmentType: value }))}
                  placeholder={t('Select investment type')}
                  options={['I have investment requirements', 'I want project suggestions', 'I need investment support', 'I want to explore partnership', 'Others'].map((option) => ({ value: option, label: t(option) }))}
                  className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Notes')}</span>
                <Textarea
                  value={fastTrackForm.notes}
                  onChange={(event) => setFastTrackForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  placeholder={t('Enter a short note about your investment needs')}
                  className="h-[152px] resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                />
              </label>
            </div>

            {fastTrackNotice && (
              <div className="rounded-lg border border-[#f2c5a5] bg-[#fff3e7] px-3 py-2 text-sm text-[#9d4300]">
                {fastTrackNotice}
              </div>
            )}

            <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>

            <div className="flex justify-center pt-1">
              <button
                type="submit"
                className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702]"
              >
                <Mail size={18} className="shrink-0" />
                {t('Submit Your Interest')}
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
      <InvestmentMapModal
        open={isInvestmentMapOpen}
        onOpenChange={setIsInvestmentMapOpen}
        projects={filteredProjects}
        language={language}
        title={t('Investment Opportunity Map')}
        description={t('Explore the projects currently matching your filters in the interactive map workspace.')}
      />
    </div>
  );
}
