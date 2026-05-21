import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, ChevronDown, Headset, Landmark, Mail, Map, MapPin, Search, Send, Star, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
import { ExplorerActionModal } from '../../components/ExplorerActionModal';
import { InvestmentMapModal } from '../../components/InvestmentMapModal';
import { ArobidLogo } from '../../components/ArobidLogo';
import { Input } from '../../components/ui/input';
import { ClearableSelectField } from '../../components/ui/clearable-select-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SeeAllButton } from '../../components/SeeAllButton';
import { translateText } from '../../utils/localization';
import { normalizeProjectStatus } from '../../utils/projectStatus';
import { investmentNews } from '../../data/investmentNews';
import designHeroSkyline from '../../assets/design-hero-skyline.png';
import designVietnamMap from '../../assets/design-vietnam-map.png';

const ALL_OPTION = '__all__';
const DEFAULT_LIST_COUNT = 6;
const PAGINATION_PAGE_SIZE = 9;
const DEFAULT_PROJECT_TYPE = 'public';
const DEFAULT_SUPPORT_PRIORITY = 'high';
const HERO_VIDEO_ID = 'LjDjXXM62Xg';
const HERO_VIDEO_SRC = `https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_VIDEO_ID}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&vq=hd1080`;

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

const cityInfoCards = [
  {
    title: 'Economy',
    summary: 'Leading Vietnam in output, consumption, and digital-sector momentum with a deep pipeline of urban and industrial demand.',
  },
  {
    title: 'Investment',
    summary: 'Foreign investors gain structured incentives, stronger institutional coordination, and faster access to project-ready opportunities.',
  },
  {
    title: 'Infrastructure',
    summary: 'Metro expansion, logistics upgrades, and new strategic corridors continue to improve large-scale project delivery capacity.',
  },
  {
    title: 'Momentum',
    summary: 'The city keeps attracting capital into high technology, advanced manufacturing, logistics, and financial services.',
  },
] as const;

type ExplorerModal = 'interest' | 'support' | null;

const initialInterestForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  projectId: '',
  investmentSize: '',
  investmentType: '',
  notes: '',
};

const initialSupportForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  topic: '',
  projectId: '',
  details: '',
};

export default function ExplorerPage() {
  const { language, projects, watchlist, toggleWatchlist, activeInvestorCompany, setActiveInvestorCompany, createIssue, createOpportunity } = useApp();
  const t = (value: string) => translateText(value, language);
  const location = useLocation();
  const navigate = useNavigate();
  const defaultSupportTopic = t('Project clarification and next-step coordination');
  const heroRef = useRef<HTMLElement | null>(null);
  const [selectedSector, setSelectedSector] = useState(ALL_OPTION);
  const [selectedLocation, setSelectedLocation] = useState(ALL_OPTION);
  const [selectedInvestmentRange, setSelectedInvestmentRange] = useState(ALL_OPTION);
  const [selectedProjectType, setSelectedProjectType] = useState(DEFAULT_PROJECT_TYPE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaginationMode, setIsPaginationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInvestmentMapOpen, setIsInvestmentMapOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ExplorerModal>(null);
  const [interestForm, setInterestForm] = useState({
    ...initialInterestForm,
    companyName: activeInvestorCompany,
  });
  const [interestStep, setInterestStep] = useState<'form' | 'success'>('form');
  const [submittedOpportunityId, setSubmittedOpportunityId] = useState('');
  const [submittedInterestIssueId, setSubmittedInterestIssueId] = useState('');
  const [interestError, setInterestError] = useState('');
  const [supportForm, setSupportForm] = useState({
    ...initialSupportForm,
    companyName: activeInvestorCompany,
    topic: defaultSupportTopic,
  });
  const [supportStep, setSupportStep] = useState<'form' | 'success'>('form');
  const [submittedSupportId, setSubmittedSupportId] = useState('');
  const [supportError, setSupportError] = useState('');
  const listRef = useRef<HTMLElement | null>(null);

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
      ...administrativeLocationOptions.map((location) => ({
        value: location,
        label: getAdministrativeLocationLabel(location, language),
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

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGINATION_PAGE_SIZE));
  const visibleProjects = isPaginationMode
    ? filteredProjects.slice((currentPage - 1) * PAGINATION_PAGE_SIZE, currentPage * PAGINATION_PAGE_SIZE)
    : filteredProjects.slice(0, DEFAULT_LIST_COUNT);

  const summaryTiles = useMemo(() => {
    const activeProjects = projects.filter((project) => {
      const status = normalizeProjectStatus(project.status, project.stage);
      return status === 'published' || status === 'processing';
    }).length;

    const totalValue = projects.reduce((sum, project) => sum + project.budget, 0);
    const totalSectors = new Set(projects.map((project) => project.sector)).size;

    return [
      { label: 'Active Projects', value: `${activeProjects}` },
      { label: 'Total Value', value: formatPortfolioValue(totalValue, language) },
      { label: 'Sectors', value: `${totalSectors}` },
      { label: 'Avg IRR', value: '12-15%' },
    ];
  }, [language, projects]);

  const keyStats = useMemo(
    () => [
      { label: 'Total Projects', value: `${projects.length}` },
      { label: 'Active Sectors', value: `${new Set(projects.map((project) => project.sector)).size}` },
      { label: 'Following Projects', value: `${watchlist.length}` },
      { label: 'Investment Value', value: formatPortfolioValue(projects.reduce((sum, project) => sum + project.budget, 0), language) },
    ],
    [language, projects, watchlist.length],
  );
  const investmentMetrics = useMemo(() => {
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
    const averageBudget = projects.length > 0 ? totalBudget / projects.length : 0;

    return [
      { label: 'TOTAL INVESTMENT PROJECTS', value: `${projects.length}` },
      { label: 'TOTAL REGISTERED CAPITAL (USD)', value: formatPortfolioValue(totalBudget, language) },
      { label: 'ACTIVE SECTORS', value: `${new Set(projects.map((project) => project.sector)).size}` },
      { label: 'AVG DEAL SIZE / RANGE', value: formatInvestmentAmount(averageBudget, language) },
    ];
  }, [language, projects]);

  function handleToggleWatchlist(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleWatchlist(id);
  }

  function scrollToProjects() {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetFilters() {
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

  function openInterestFlow() {
    setInterestForm({
      ...initialInterestForm,
      companyName: activeInvestorCompany,
      projectId: '',
    });
    setInterestStep('form');
    setSubmittedOpportunityId('');
    setSubmittedInterestIssueId('');
    setInterestError('');
    setActiveModal('interest');
  }

  function openSupportFlow() {
    setSupportForm({
      ...initialSupportForm,
      companyName: activeInvestorCompany,
      topic: defaultSupportTopic,
      projectId: '',
    });
    setSupportStep('form');
    setSubmittedSupportId('');
    setSupportError('');
    setActiveModal('support');
  }

  function closeModal() {
    setActiveModal(null);
    setInterestStep('form');
    setSubmittedOpportunityId('');
    setSubmittedInterestIssueId('');
    setInterestError('');
    setSupportStep('form');
    setSubmittedSupportId('');
    setSupportError('');
  }

  function handleInterestFieldChange<K extends keyof typeof initialInterestForm>(key: K, value: (typeof initialInterestForm)[K]) {
    setInterestForm((current) => ({ ...current, [key]: value }));
  }

  function handleSupportFieldChange<K extends keyof typeof initialSupportForm>(key: K, value: (typeof initialSupportForm)[K]) {
    setSupportForm((current) => ({ ...current, [key]: value }));
  }

  function handleInterestSubmit() {
    const selectedProject = projects.find((project) => project.id === interestForm.projectId);
    if (!selectedProject || !interestForm.companyName.trim() || !interestForm.contactName.trim() || !interestForm.email.trim()) {
      setInterestError(t('Please complete company name, contact name, email, and project.'));
      return;
    }

    setInterestError('');
    setActiveInvestorCompany(interestForm.companyName.trim());

    const opportunityId = createOpportunity({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      investorName: interestForm.contactName.trim(),
      investorCompany: interestForm.companyName.trim(),
      investorCountry: 'Vietnam',
      investorType: 'Corporate',
      amount:
        interestForm.investmentSize === '< $10M'
          ? 8
          : interestForm.investmentSize === '$10M - $50M'
            ? 30
            : interestForm.investmentSize === '$50M - $200M'
              ? 120
              : 250,
      stage: 'new',
      notes: interestForm.notes.trim() || 'Submitted from investor explorer popup.',
      intakeData: {
        investmentStructure: interestForm.investmentType,
        timeline: 'Submitted from explorer popup',
        fundSource: 'To be confirmed',
        experience: interestForm.notes.trim() || 'Popup intake submission',
        contactEmail: interestForm.email.trim(),
        contactPhone: interestForm.phone.trim() || 'Not provided',
      },
    });

    const issueId = createIssue({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      title: `Project intake submission - ${interestForm.companyName.trim()}`,
      description: interestForm.notes.trim() || 'Investor submitted project intake from the explorer popup.',
      priority: DEFAULT_SUPPORT_PRIORITY,
      status: 'open',
      assignedTo: 'ITPC Communication Portal',
      reportedBy: interestForm.contactName.trim(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Support',
    });

    setSubmittedOpportunityId(opportunityId);
    setSubmittedInterestIssueId(issueId);
    setInterestStep('success');
  }

  function handleSupportSubmit() {
    const selectedProject = projects.find((project) => project.id === supportForm.projectId);
    if (!selectedProject || !supportForm.companyName.trim() || !supportForm.contactName.trim() || !supportForm.email.trim() || !supportForm.phone.trim() || !supportForm.details.trim()) {
      setSupportError(t('Please complete company, contact, email, project, and request details.'));
      return;
    }

    setSupportError('');
    setActiveInvestorCompany(supportForm.companyName.trim());

    const requestId = createIssue({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      title: `Investor support request: ${selectedProject.name}`,
      description: [
        `Company: ${supportForm.companyName.trim()}`,
        `Contact: ${supportForm.contactName.trim()}`,
        `Email: ${supportForm.email.trim()}`,
        `Phone: ${supportForm.phone.trim()}`,
        `Topic: ${supportForm.topic.trim()}`,
        `Request: ${supportForm.details.trim()}`,
      ].join(' | '),
      priority: DEFAULT_SUPPORT_PRIORITY,
      status: 'open',
      assignedTo: 'Investor Operations Team',
      reportedBy: supportForm.contactName.trim(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Support',
    });

    setSubmittedSupportId(requestId);
    setSupportStep('success');
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedInvestmentRange, selectedLocation, selectedProjectType, selectedSector]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('fastTrack') !== '1') return;
    openInterestFlow();
    navigate('/investor/explorer', { replace: true });
  }, [location.search]);

  return (
    <div className="bg-[#f9fafb]" style={{ fontFamily: 'Inter, var(--font-body), sans-serif' }}>
      <div className="mx-auto max-w-[1192px] px-4 py-4 md:px-8">
        <section ref={heroRef} className="relative min-h-[321px] overflow-hidden rounded-lg bg-[#071423] py-6">
          <iframe
            title={t('Ho Chi Minh City hero background video')}
            src={HERO_VIDEO_SRC}
            className="pointer-events-none absolute left-1/2 top-[calc(50%-70px)] aspect-video h-[calc(100%+160px)] w-[calc(100%+220px)] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative z-10 mx-6 grid min-h-[273px] items-center gap-6 md:mx-[91px] lg:grid-cols-[384px_minmax(0,1fr)]">
          <div className="flex w-full max-w-[384px] flex-col items-center justify-center gap-2 rounded-lg bg-black/25 p-6 text-center shadow-[0_0_8px_rgba(237,98,3,0.12)] backdrop-blur-sm">
            <div className="text-[18px] leading-7 text-white">{t('Need tailor support')}</div>
            <div className="text-[24px] font-bold leading-8 text-white">{t('FAST-TRACK')}</div>
            <button type="button" onClick={openInterestFlow} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 py-2.5 text-[14px] font-medium leading-5 text-white">
              <Send size={20} />
              {t('Submit Investment Interest')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {investmentMetrics.map((metric) => (
              <div key={metric.label} className="flex min-h-[118px] flex-col items-center justify-center rounded-lg border border-white/25 bg-white/10 px-3 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                <div className="text-[32px] font-semibold leading-10 text-white">{metric.value}</div>
                <div className="mt-1 text-[12px] font-medium uppercase leading-4 text-white/85">{t(metric.label)}</div>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="mt-4 grid min-h-[354px] items-center overflow-hidden rounded-lg bg-white p-6 shadow-[0_0_6px_rgba(0,0,0,0.08)] lg:grid-cols-[451px_1fr] lg:pl-14 lg:pr-0">
          <div className="relative z-10 flex max-w-[451px] flex-col justify-center gap-3">
            <h1 className="text-[28px] font-bold leading-9 text-[#ed6203]">{t('Smart Investing, Visually Mapped')}</h1>
            <p className="max-w-[424px] text-[12px] leading-4 text-[#6b7280]">
              {t('Explore global opportunities with real-time data and intuitive map-based insights. Navigate the complexity of markets with precision.')}
            </p>
            <button type="button" onClick={() => setIsInvestmentMapOpen(true)} className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
              <Map size={20} />
              {t('View on map')}
            </button>
          </div>
          <img src="/figma-homepage/map-visual.png" alt="" className="mt-6 h-[300px] w-full rounded-md object-cover lg:mt-0 lg:h-[322px]" />
        </section>

        <section ref={listRef} className="mt-4 bg-white p-4">
          <div className="relative">
            <div className="flex min-h-[62px] flex-col gap-4 rounded-lg border border-[#ed6203] bg-white px-3 py-2.5 shadow-[0_0_8px_rgba(0,0,0,0.08)] lg:flex-row lg:items-center">
              <div className="relative min-w-[260px] flex-1">
                <Search size={20} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('Search by project name, ID, or keywords...')}
                  className="h-[42px] border-0 bg-transparent pl-8 text-[14px] font-normal text-[#4b5563] shadow-none focus-visible:ring-0"
                />
              </div>
              {[
                { label: 'Sector', value: selectedSector, set: setSelectedSector, options: sectorOptions },
                { label: 'Location', value: selectedLocation, set: setSelectedLocation, options: locationOptions },
                { label: 'Investment size', value: selectedInvestmentRange, set: setSelectedInvestmentRange, options: investmentRangeOptions },
                { label: 'Project type', value: selectedProjectType, set: setSelectedProjectType, options: [{ value: 'public', label: t('Public') }, { value: 'private', label: t('Private') }] },
              ].map((filter) => (
                <Select key={filter.label} value={filter.value} onValueChange={filter.set}>
                  <div className="min-w-[143px] border-l border-[#e5e7eb] pl-3">
                    <span className="block text-[14px] font-semibold leading-5 text-[#030712]">{t(filter.label)}</span>
                    <SelectTrigger className="mt-1 h-8 rounded-md border border-[#d1d5db] bg-white px-3 text-left text-[14px] font-normal text-[#4b5563] shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                  </div>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              <button type="button" onClick={resetFilters} className="text-[12px] font-medium text-[#6b7280]">{t('Clear All Filter')}</button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
              <SelectTrigger className="h-11 w-[170px] rounded-md border border-[#d1d5db] bg-white text-[14px] text-[#4b5563] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('Public')}</SelectItem>
                <SelectItem value="private">{t('Private')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 text-[16px] leading-6 text-[#6b7280]">
              <span>{t('Showing')} {filteredProjects.length} {t('projects')}</span>
              <span className="h-8 w-px bg-[#e5e7eb]" />
              <button type="button" onClick={() => setIsInvestmentMapOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
                <Map size={20} />
                {t('View Map')}
              </button>
            </div>
          </div>

          <h2 className="mt-6 text-[28px] font-semibold leading-9 text-[#ed6203]">{t('Featured investment projects')}</h2>

          <div className="mt-5 grid gap-6 xl:grid-cols-3">
            {visibleProjects.map((project) => {
          const isWatching = watchlist.includes(project.id);
          const followerCount = getMockFollowerCount(project.id, project.budget);
          const locationLabel = getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language);

          return (
            <Link
              key={project.id}
              to={`/investor/project/${project.id}`}
              className="group rounded-xl bg-white p-3 shadow-[0_0_6px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5"
            >
              <div className="relative aspect-[1080/608] overflow-hidden rounded-md bg-[#e0e3e5]">
                <img
                  src={project.image}
                  alt={t(project.name)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                  <div className="rounded-md bg-white/80 px-3 py-1 text-[10px] text-[#1f2937] shadow-sm">
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
                  <h2 className="line-clamp-2 text-[18px] font-semibold leading-7 text-[#030712]">
                    {t(project.name)}
                  </h2>
                  <p className="mt-2 line-clamp-2 min-h-[40px] text-[14px] leading-5 text-[#1f2937]">
                    {t(project.description)}
                  </p>
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
                  <button
                    type="button"
                    onClick={(event) => handleToggleWatchlist(project.id, event)}
                    className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
                      isWatching
                        ? 'bg-[#fff1e7] text-[#9d4300]'
                        : 'bg-[#f2f4f6] text-[#455f87] hover:bg-[#e6eaee]'
                    }`}
                  >
                    {isWatching ? t('Watching') : t('Follow')}
                  </button>
                  <div className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#ed6203]">
                    {t('Discovery Now')}
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          );
            })}
          </div>

          {!isPaginationMode && filteredProjects.length > DEFAULT_LIST_COUNT && (
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

        <section className="relative overflow-hidden bg-[#1e40af] px-6 py-8 text-white md:px-10">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-30 [background-image:url('/figma-homepage/support-pattern.png')] [background-size:280px_auto]" />
          <div className="relative grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {investmentMetrics.map((item, index) => (
              <div key={item.label} className="text-center">
                <div className="text-[40px] font-semibold leading-10 text-white">{item.value}</div>
                <div className="mt-1 text-[14px] uppercase leading-5 text-white/80">{t(item.label)}</div>
                {index < investmentMetrics.length - 1 ? <div className="absolute top-4 hidden h-[114px] w-px bg-white/25 xl:block" style={{ left: `${25 * (index + 1)}%` }} /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-10">
          <h2 className="text-[28px] font-semibold leading-9 text-[#ed6203]">{t('Why Ho Chi Minh City?')}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {['Market Access', 'Economy', 'Infrastructure', 'Talent & Innovation', 'Quality of Life'].map((tab, index) => (
              <button key={tab} type="button" className={`h-[31px] rounded-md px-4 text-[14px] font-medium ${index === 0 ? 'bg-[#ed6203] text-white' : 'bg-[#f3f4f6] text-[#4b5563]'}`}>
                {t(tab)}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-[536px_1fr]">
            <a href={investmentNews[0]?.href} target="_blank" rel="noreferrer" className="relative h-[341px] overflow-hidden rounded-md">
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
              {cityInfoCards.map((card, index) => (
                <a key={card.title} href={(investmentNews[index] ?? investmentNews[0])?.href} target="_blank" rel="noreferrer" className="relative min-h-[165px] overflow-hidden rounded-md">
                  <img src="/figma-homepage/why-card.png" alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="rounded-md bg-black/35 p-3 backdrop-blur-sm">
                      <span className="rounded-full bg-[#ecfeff] px-2.5 py-1.5 text-[10px] text-[#075985]">{t(card.title)}</span>
                      <div className="mt-2 line-clamp-2 text-[14px] leading-5">{t(card.summary)}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button type="button" className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
              {t('View More')}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white px-4 py-10">
          <div className="absolute inset-0 opacity-20 [background-image:url('/figma-homepage/support-pattern.png')] [background-size:260px_auto]" />
          <div className="relative grid gap-10 lg:grid-cols-[444px_1fr]">
            <div>
              <h2 className="max-w-[390px] text-[30px] font-bold leading-9 text-[#ed6203]">
                {t('Need assistance with your investment journey?')}
              </h2>
              <p className="mt-7 max-w-[444px] text-[16px] leading-6 text-[#6b7280]">
                {t('Our team is here to provide dedicated guidance and bureaucratic support at every single step of your project implementation.')}
              </p>
              <img src="/figma-homepage/support-journey.png" alt="" className="mt-7 h-[173px] w-[284px] rounded-md object-cover" />
            </div>
            <div className="rounded-lg bg-white p-6 shadow-[0_0_8px_rgba(0,0,0,0.08)]">
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={supportForm.companyName} onChange={(event) => handleSupportFieldChange('companyName', event.target.value)} placeholder={t('Company Name')} className="h-12 rounded-md border-[#d1d5db] font-normal" />
                <Input value={supportForm.contactName} onChange={(event) => handleSupportFieldChange('contactName', event.target.value)} placeholder={t('Contact Person')} className="h-12 rounded-md border-[#d1d5db] font-normal" />
                <Input type="email" value={supportForm.email} onChange={(event) => handleSupportFieldChange('email', event.target.value)} placeholder={t('Email')} className="h-12 rounded-md border-[#d1d5db] font-normal" />
                <Input value={supportForm.phone} onChange={(event) => handleSupportFieldChange('phone', event.target.value)} placeholder={t('Phone Number')} className="h-12 rounded-md border-[#d1d5db] font-normal" />
                <Input value={supportForm.topic} onChange={(event) => handleSupportFieldChange('topic', event.target.value)} placeholder={t('Support Topic')} className="h-12 rounded-md border-[#d1d5db] font-normal md:col-span-2" />
                <textarea value={supportForm.details} onChange={(event) => handleSupportFieldChange('details', event.target.value)} rows={5} placeholder={t('Enter your request details')} className="min-h-[150px] rounded-md border border-[#d1d5db] px-3 py-3 text-[14px] font-normal text-[#111827] outline-none md:col-span-2" />
              </div>
              <div className="mt-5 flex justify-center">
                <button type="button" onClick={openSupportFlow} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#ed6203] px-5 text-[14px] font-medium text-white">
                  <Headset size={20} />
                  {t('Contact Support')}
                </button>
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
      </div>


      {activeModal && (
        <ExplorerActionModal
          onClose={closeModal}
          closeLabel={t('Close')}
          panelTitle={activeModal === 'interest' ? t('Investment Interest') : activeModal === 'support' ? t('Investor Question') : t('Investment Support')}
          variant={activeModal === 'interest' ? 'investment-interest' : activeModal === 'support' ? 'investor-question' : 'default'}
          leftIcon={activeModal === 'interest' ? <Landmark size={44} /> : <Headset size={44} />}
          leftTitle={
            activeModal === 'interest'
              ? t('Ready to submit your investment interest?')
              : t('Need clarification before moving forward?')
          }
          leftDescription={
            activeModal === 'interest'
              ? t('Share your company profile and project intent. Our team will capture the request and coordinate the next step in the city investment workflow.')
              : t('Send a structured question to the project response queue and keep the due-diligence conversation inside the investor workflow.')
          }
        >
          {activeModal === 'interest' && interestStep === 'form' && (
                    <div className="space-y-3">
                      {interestError ? (
                        <div className="rounded-lg border border-[#f3c3a7] bg-[#fff1e7] px-3 py-2 text-[14px] text-[#9d4300]">
                          {interestError}
                        </div>
                      ) : null}

                      <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span>
                          <Input
                            value={interestForm.companyName}
                            onChange={(event) => handleInterestFieldChange('companyName', event.target.value)}
                            placeholder={t('Enter company name')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Contact Name')}<span className="text-[#dc2626]">*</span></span>
                          <Input
                            value={interestForm.contactName}
                            onChange={(event) => handleInterestFieldChange('contactName', event.target.value)}
                            placeholder={t('Enter full name')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Email')}<span className="text-[#dc2626]">*</span></span>
                          <Input
                            type="email"
                            value={interestForm.email}
                            onChange={(event) => handleInterestFieldChange('email', event.target.value)}
                            placeholder={t('Enter email address')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Phone Number')}</span>
                          <Input
                            value={interestForm.phone}
                            onChange={(event) => handleInterestFieldChange('phone', event.target.value)}
                            placeholder={t('Enter phone number')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Size')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Investment Size')}
                            value={interestForm.investmentSize}
                            onChange={(value) => handleInterestFieldChange('investmentSize', value)}
                            placeholder={t('Select investment size')}
                            options={['< $10M', '$10M - $50M', '$50M - $200M', '>$200M'].map((option) => ({ value: option, label: t(option) }))}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Type')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Investment Type')}
                            value={interestForm.investmentType}
                            onChange={(value) => handleInterestFieldChange('investmentType', value)}
                            placeholder={t('Select investment type')}
                            options={['Equity', 'JV', 'PPP'].map((option) => ({ value: option, label: t(option) }))}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Associated Project')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Project')}
                            value={interestForm.projectId}
                            onChange={(value) => handleInterestFieldChange('projectId', value)}
                            placeholder={t('Select project')}
                            options={projects.map((project) => ({ value: project.id, label: t(project.name) }))}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Notes')}</span>
                          <textarea
                            value={interestForm.notes}
                            onChange={(event) => handleInterestFieldChange('notes', event.target.value)}
                            rows={6}
                            placeholder={t('Enter your investment details')}
                            className="h-[152px] w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]"
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>

                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={handleInterestSubmit}
                          className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702]"
                        >
                          <Send size={20} className="shrink-0" />
                          {t('Submit Your Interest')}
                        </button>
                      </div>
                    </div>
          )}

          {activeModal === 'interest' && interestStep === 'success' && (
                    <div className="space-y-6">
                      <div className="rounded-[24px] border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6">
                        <div className="text-[28px] font-semibold text-[#1a2755]">{t('Your interest has been submitted')}</div>
                        <div className="mt-3 text-[16px] leading-7 text-[#617086]">
                          {t('The intake has been recorded and routed to the responsible investment support desk.')}
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="rounded-[18px] bg-white px-5 py-5">
                            <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Opportunity')}</div>
                            <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedOpportunityId}</div>
                          </div>
                          <div className="rounded-[18px] bg-white px-5 py-5">
                            <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Support request')}</div>
                            <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedInterestIssueId}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex min-w-[240px] items-center justify-center rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white"
                        >
                          {t('Close')}
                        </button>
                      </div>
                    </div>
          )}

          {activeModal === 'support' && supportStep === 'form' && (
                    <div className="space-y-3">
                      {supportError ? (
                        <div className="rounded-lg border border-[#f3c3a7] bg-[#fff1e7] px-3 py-2 text-[14px] text-[#9d4300]">
                          {supportError}
                        </div>
                      ) : null}

                      <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span>
                          <Input
                            value={supportForm.companyName}
                            onChange={(event) => handleSupportFieldChange('companyName', event.target.value)}
                            placeholder={t('Enter company name')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Contact Person')}<span className="text-[#dc2626]">*</span></span>
                          <div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937]"><button type="button" className="inline-flex shrink-0 items-center gap-1 pr-2 text-[#030712]"><span>Mr</span><ChevronDown size={16} className="text-[#6b7280]" /></button><input value={supportForm.contactName} onChange={(event) => handleSupportFieldChange('contactName', event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter full name')} /></div>
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Email')}<span className="text-[#dc2626]">*</span></span>
                          <Input
                            type="email"
                            value={supportForm.email}
                            onChange={(event) => handleSupportFieldChange('email', event.target.value)}
                            placeholder={t('Enter email address')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Phone Number')}<span className="text-[#dc2626]">*</span></span>
                          <div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937]"><button type="button" className="inline-flex shrink-0 items-center gap-1 pr-2 text-[#030712]"><span>VN</span><ChevronDown size={16} className="text-[#6b7280]" /></button><span className="shrink-0 border-l border-[#e5e7eb] px-2 text-[#030712]">+84</span><input value={supportForm.phone} onChange={(event) => handleSupportFieldChange('phone', event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder="000-000-000" /></div>
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Support Topic')}</span>
                          <Input
                            value={supportForm.topic}
                            onChange={(event) => handleSupportFieldChange('topic', event.target.value)}
                            placeholder={t('Clarification on project scope and next coordination steps')}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]"
                          />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Associated Project')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Project')}
                            value={supportForm.projectId}
                            onChange={(value) => handleSupportFieldChange('projectId', value)}
                            placeholder={t('Select project')}
                            options={projects.map((project) => ({ value: project.id, label: t(project.name) }))}
                            className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investor Question')}<span className="text-[#dc2626]">*</span></span>
                          <textarea
                            value={supportForm.details}
                            onChange={(event) => handleSupportFieldChange('details', event.target.value)}
                            rows={6}
                            placeholder={t('Enter your request details')}
                            className="h-[152px] w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]"
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>

                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={handleSupportSubmit}
                          className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702]"
                        >
                          <Send size={20} className="shrink-0" />
                          {t('Submit Question')}
                        </button>
                      </div>
                    </div>
          )}

          {activeModal === 'support' && supportStep === 'success' && (
                    <div className="space-y-6">
                      <div className="rounded-[24px] border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6">
                        <div className="text-[28px] font-semibold text-[#1a2755]">{t('Support request submitted')}</div>
                        <div className="mt-3 text-[16px] leading-7 text-[#617086]">
                          {t('Support request logged. The appropriate desk has been notified for follow-up.')}
                        </div>
                        <div className="mt-6 rounded-[18px] bg-white px-5 py-5">
                          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Support request')}</div>
                          <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedSupportId}</div>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex min-w-[240px] items-center justify-center rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white"
                        >
                          {t('Close')}
                        </button>
                      </div>
                    </div>
          )}
        </ExplorerActionModal>
      )}
      <InvestmentMapModal
        open={isInvestmentMapOpen}
        onOpenChange={setIsInvestmentMapOpen}
        projects={filteredProjects}
        language={language}
        title={t('Investment Opportunity Map')}
        description={t('Explore the projects currently matching your explorer filters in the interactive map workspace.')}
      />
    </div>
  );
}


