import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Headset, Landmark, Map, MapPin, Search, Send, Star, TrendingUp, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
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

function formatPortfolioValue(totalBudgetInMillions: number) {
  return `$${(totalBudgetInMillions / 1000).toFixed(2)}B`;
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
  const defaultSupportTopic = t('Project clarification and next-step coordination');
  const heroRef = useRef<HTMLElement | null>(null);
  const [selectedSector, setSelectedSector] = useState(ALL_OPTION);
  const [selectedLocation, setSelectedLocation] = useState(ALL_OPTION);
  const [selectedInvestmentRange, setSelectedInvestmentRange] = useState(ALL_OPTION);
  const [selectedProjectType, setSelectedProjectType] = useState(DEFAULT_PROJECT_TYPE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaginationMode, setIsPaginationMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const summaryTiles = useMemo(() => {
    const activeProjects = projects.filter((project) => {
      const status = normalizeProjectStatus(project.status, project.stage);
      return status === 'published' || status === 'processing';
    }).length;

    const totalValue = projects.reduce((sum, project) => sum + project.budget, 0);
    const totalSectors = new Set(projects.map((project) => project.sector)).size;

    return [
      { label: 'Active Projects', value: `${activeProjects}` },
      { label: 'Total Value', value: formatPortfolioValue(totalValue) },
      { label: 'Sectors', value: `${totalSectors}` },
      { label: 'Avg IRR', value: '12-15%' },
    ];
  }, [projects]);

  const keyStats = useMemo(
    () => [
      { label: 'Total Projects', value: `${projects.length}` },
      { label: 'Active Sectors', value: `${new Set(projects.map((project) => project.sector)).size}` },
      { label: 'Following Projects', value: `${watchlist.length}` },
      { label: 'Investment Value', value: formatPortfolioValue(projects.reduce((sum, project) => sum + project.budget, 0)) },
    ],
    [projects, watchlist.length],
  );

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
    openSupportFlow();
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

  return (
    <div className="bg-[#f7f9fb]" style={{ fontFamily: 'Inter, var(--font-body), sans-serif' }}>
      <div className="page-shell mx-auto max-w-[1280px] space-y-0 px-4 py-0 md:px-6">
        <section ref={heroRef} className="relative overflow-hidden bg-[#eceef0] px-6 pb-0 pt-10 md:px-10 md:pt-14">
          <div className="absolute inset-0 hidden overflow-hidden lg:block">
            <img src={designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(236,238,240,0.98)_0%,rgba(236,238,240,0.84)_28%,rgba(236,238,240,0.58)_52%,rgba(236,238,240,0.28)_74%,rgba(236,238,240,0.12)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.46)_100%)]" />
          </div>

          <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div className="max-w-[700px]">
              <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#455f87]">
                <TrendingUp size={13} className="text-[#9d4300]" />
                {t('Regional Focus')}
              </div>

              <h1 className="max-w-[760px] text-[40px] font-normal leading-[1.08] tracking-[-0.03em] text-[#191c1e] md:text-[56px]">
                {t('Accelerate Your Investment')}
                <br />
                <span className="text-[#9d4300]">{t('in Ho Chi Minh City')}</span>
              </h1>

              <p className="mt-5 max-w-[650px] text-[17px] leading-8 text-[#455f87]">
                {t('The economic heartbeat of Vietnam, providing a transparent and efficient investment environment. Access the most comprehensive pipeline of development opportunities.')}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={scrollToProjects}
                  className="inline-flex items-center justify-center rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5"
                >
                  {t('Explore Opportunities')}
                </button>
                <button
                  type="button"
                  onClick={openInterestFlow}
                  className="inline-flex items-center justify-center rounded-none bg-[#e6e8ea] px-8 py-4 text-[16px] font-medium text-[#3e5980] transition-colors hover:bg-[#dfe3e6]"
                >
                  {t('Submit Your Interest')}
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="ml-auto w-full max-w-[256px] rounded-none bg-white p-[17px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                <div className="mb-3 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[#455f87]">
                  <MapPin size={15} className="text-[#9d4300]" />
                  <span>{t('Regional Focus')}</span>
                </div>
                <div className="relative overflow-hidden rounded-none border border-[rgba(224,192,177,0.15)] bg-[#eceef0]">
                  <img src={designVietnamMap} alt={t('Vietnam investment map')} className="h-[220px] w-full object-cover" />
                  <div className="absolute bottom-3 left-3 rounded-none bg-[rgba(157,67,0,0.9)] px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-white">
                    {t('HCMC Highlighted')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryTiles.map((item) => (
              <div key={item.label} className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white/70 px-4 py-4 backdrop-blur-sm">
                <div className="text-[26px] font-normal leading-8 text-[#9d4300]">{item.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#455f87]">{t(item.label)}</div>
              </div>
            ))}
          </div>
          <div className="relative z-10 mt-10 border-t border-[rgba(224,192,177,0.28)] bg-[rgba(255,248,243,0.9)] px-6 py-6 md:-mx-10 md:px-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[24px] font-semibold leading-8 text-[#341100]">
                  {t("Can't find a suitable project?")}
                </h2>
                <p className="mt-1 text-[16px] leading-6 text-[#783200]">
                  {t("Tell us about your investment criteria and we'll find the right opportunity for you.")}
                </p>
              </div>

              <button
                type="button"
                onClick={openSupportFlow}
                className="inline-flex items-center justify-center rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-3 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5"
              >
                {t('Submit Your Request')}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-none border border-[rgba(224,192,177,0.05)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:p-8">
          <div className="grid gap-5">
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
                onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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
                onClick={resetFilters}
                className="justify-self-start border-b border-[rgba(157,67,0,0.2)] pb-1 text-[14px] font-medium text-[#9d4300] lg:justify-self-end"
              >
                {t('Clear all filters')}
              </button>
            </div>
          </div>
        </section>

        <section ref={listRef} className="space-y-10 px-1 py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-[680px]">
              <h2 className="text-[30px] font-normal leading-9 text-[#191c1e]">{t('Investment Opportunities')}</h2>
              <p className="mt-2 text-[16px] leading-7 text-[#455f87]">
                {t('Explore prioritized projects aligned with the HCMC 2030 development master plan.')}
              </p>
            </div>
          </div>

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
                  <h2 className="line-clamp-2 text-[20px] font-normal leading-7 text-[#191c1e]">
                    {t(project.name)}
                  </h2>
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-[#455f87]">
                    <MapPin size={13} />
                    <span className="line-clamp-1">{t(project.location)}</span>
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

        <section className="bg-[#455f87] px-6 py-16 text-white md:px-10">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {keyStats.map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-[44px] leading-[1.05] tracking-[-0.03em] text-[#f97316]">{item.value}</div>
                <div className="mt-2 text-[14px] uppercase tracking-[0.14em] text-white/70">{t(item.label)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10 px-1 py-16">
          <div className="text-center">
            <h2 className="text-[30px] font-normal leading-9 text-[#191c1e]">{t('Why Ho Chi Minh City?')}</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
            {cityInfoCards.map((card, index) => {
              const newsItem = investmentNews[index] ?? investmentNews[0];
              return (
                <a
                  key={card.title}
                  href={newsItem.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col bg-white"
                >
                  <div className="overflow-hidden bg-[#e0e3e5]">
                    <img
                      src={newsItem.image}
                      alt={t(card.title)}
                      className="h-[180px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-4 pb-4 pt-5">
                    <h3 className="text-[20px] font-normal leading-7 text-[#191c1e]">{t(card.title)}</h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-[#455f87]">{t(card.summary)}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-[#9d4300]">
                      {t('Read more')}
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="px-1 pb-16">
          <div className="mx-auto max-w-[832px] rounded-none bg-[#f2f4f6] px-6 py-12 text-center md:px-12">
            <div className="mx-auto mb-4 inline-flex min-h-[84px] min-w-[240px] items-center justify-center rounded-none bg-[#fff1e7] px-10 py-6 text-[24px] font-medium text-[#9d4300]">
              {t("We're here")}
            </div>
            <h2 className="text-[30px] font-normal leading-9 text-[#191c1e]">
              {t('Need assistance with your investment journey?')}
            </h2>
            <p className="mx-auto mt-4 max-w-[660px] text-[18px] leading-8 text-[#455f87]">
              {t('Our team is here to provide dedicated guidance and bureaucratic support at every single step of your project implementation.')}
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={openSupportFlow}
                className="inline-flex items-center justify-center rounded-none bg-[#455f87] px-10 py-4 text-[16px] font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                {t('Contact Support')}
              </button>
            </div>
          </div>
        </section>
      </div>


      {activeModal && (
        <div className="fixed inset-0 z-[140] overflow-y-auto bg-[rgba(15,23,42,0.72)] p-4 md:p-8">
          <div className="relative mx-auto w-full max-w-[1760px] overflow-hidden rounded-[40px] shadow-[0_32px_72px_rgba(15,23,42,0.35)]">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-6 top-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/90 bg-[rgba(255,255,255,0.06)] text-white backdrop-blur-sm transition-opacity hover:opacity-90"
            >
              <X size={28} />
            </button>

            <div className="grid min-h-[820px] bg-white lg:grid-cols-[1fr_1.08fr]">
              <div className="relative hidden lg:block">
                <img src={designHeroSkyline} alt="" className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-[rgba(7,17,31,0.62)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.22)_0%,rgba(7,17,31,0.68)_100%)]" />

                <div className="absolute inset-0 flex items-center justify-center px-12">
                  <div className="flex max-w-[640px] flex-col items-center text-center text-white">
                    <div className="inline-flex h-[124px] w-[124px] items-center justify-center rounded-[20px] bg-[#ffe6d8] text-[#f97316] shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                      {activeModal === 'interest' ? <Landmark size={54} /> : <Headset size={54} />}
                    </div>
                    <h2 className="mt-6 text-[34px] font-semibold leading-[1.2] text-white">
                      {activeModal === 'interest'
                        ? t('Ready to submit your investment interest?')
                        : t('Need assistance with your investment journey?')}
                    </h2>
                    <p className="mt-4 max-w-[640px] text-[19px] leading-[1.65] text-white/88">
                      {activeModal === 'interest'
                        ? t('Share your company profile and project intent. Our team will capture the request and coordinate the next step in the city investment workflow.')
                        : t('Our team is here to provide dedicated guidance and bureaucratic support at every single step of your project implementation.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white">
                <div className="bg-[#5872A0] px-8 py-8 text-center text-[32px] font-semibold text-white md:px-12 md:py-10">
                  {activeModal === 'interest' ? t('Investment Interest') : t('Investment Support')}
                </div>

                <div className="px-6 py-8 md:px-10 md:py-10">
                  {activeModal === 'interest' && interestStep === 'form' && (
                    <div className="space-y-6">
                      {interestError ? (
                        <div className="border border-[#f3c3a7] bg-[#fff1e7] px-4 py-3 text-[14px] text-[#9d4300]">
                          {interestError}
                        </div>
                      ) : null}

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Company Name')} <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            value={interestForm.companyName}
                            onChange={(event) => handleInterestFieldChange('companyName', event.target.value)}
                            placeholder={t('Enter company name')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Contact Person')} <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            value={interestForm.contactName}
                            onChange={(event) => handleInterestFieldChange('contactName', event.target.value)}
                            placeholder={t('Enter full name')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">Email <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            type="email"
                            value={interestForm.email}
                            onChange={(event) => handleInterestFieldChange('email', event.target.value)}
                            placeholder={t('Enter email address')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Phone Number')}</span>
                          <Input
                            value={interestForm.phone}
                            onChange={(event) => handleInterestFieldChange('phone', event.target.value)}
                            placeholder={t('Enter phone number')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Investment Size')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Investment Size')}
                            value={interestForm.investmentSize}
                            onChange={(value) => handleInterestFieldChange('investmentSize', value)}
                            placeholder={t('Select investment size')}
                            options={['< $10M', '$10M - $50M', '$50M - $200M', '>$200M'].map((option) => ({ value: option, label: option }))}
                            className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Investment Type')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Investment Type')}
                            value={interestForm.investmentType}
                            onChange={(value) => handleInterestFieldChange('investmentType', value)}
                            placeholder={t('Select investment type')}
                            options={['Equity', 'JV', 'PPP'].map((option) => ({ value: option, label: t(option) }))}
                            className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Project')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Project')}
                            value={interestForm.projectId}
                            onChange={(value) => handleInterestFieldChange('projectId', value)}
                            placeholder={t('Select project')}
                            options={projects.map((project) => ({ value: project.id, label: t(project.name) }))}
                            className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Investment Details')}</span>
                          <textarea
                            value={interestForm.notes}
                            onChange={(event) => handleInterestFieldChange('notes', event.target.value)}
                            rows={6}
                            placeholder={t('Enter your investment details')}
                            className="min-h-[190px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={handleInterestSubmit}
                          className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]"
                        >
                          <Send size={20} />
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
                    <div className="space-y-6">
                      {supportError ? (
                        <div className="border border-[#f3c3a7] bg-[#fff1e7] px-4 py-3 text-[14px] text-[#9d4300]">
                          {supportError}
                        </div>
                      ) : null}

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Company Name')} <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            value={supportForm.companyName}
                            onChange={(event) => handleSupportFieldChange('companyName', event.target.value)}
                            placeholder={t('Enter company name')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Contact Person')} <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            value={supportForm.contactName}
                            onChange={(event) => handleSupportFieldChange('contactName', event.target.value)}
                            placeholder={t('Enter full name')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">Email <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            type="email"
                            value={supportForm.email}
                            onChange={(event) => handleSupportFieldChange('email', event.target.value)}
                            placeholder={t('Enter email address')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Phone Number')} <span className="text-[#f97316]">(*)</span></span>
                          <Input
                            value={supportForm.phone}
                            onChange={(event) => handleSupportFieldChange('phone', event.target.value)}
                            placeholder={t('Enter phone number')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Support Topic')}</span>
                          <Input
                            value={supportForm.topic}
                            onChange={(event) => handleSupportFieldChange('topic', event.target.value)}
                            placeholder={t('Clarification on project scope and next coordination steps')}
                            className="h-14 rounded-[16px] border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Project')}</span>
                          <ClearableSelectField
                            ariaLabel={t('Project')}
                            value={supportForm.projectId}
                            onChange={(value) => handleSupportFieldChange('projectId', value)}
                            placeholder={t('Select project')}
                            options={projects.map((project) => ({ value: project.id, label: t(project.name) }))}
                            className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                          />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[14px] font-medium text-[#1a2755]">{t('Support Details')}</span>
                          <textarea
                            value={supportForm.details}
                            onChange={(event) => handleSupportFieldChange('details', event.target.value)}
                            rows={6}
                            placeholder={t('Enter your request details')}
                            className="min-h-[190px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                          />
                        </label>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={handleSupportSubmit}
                          className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]"
                        >
                          <Headset size={20} />
                          {t('Contact Support')}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


