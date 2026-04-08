import React, { useEffect, useMemo, useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import { ProjectCard } from '../../components/ProjectCard';
import { StatusPill } from '../../components/ui/status-pill';
import { ChartContainer, ChartTooltip } from '../../components/ui/chart';
import { SeeAllButton } from '../../components/SeeAllButton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { getProjectStageLabel } from '../../utils/projectStatus';
import {
  getMockFollowedProjects,
  getMockJoinedProjects,
  getOrderedInvestorExecutionProjects,
} from '../../utils/investorExecutionMockScenario';

const DEFAULT_LIST_COUNT = 6;
const PAGINATION_PAGE_SIZE = 6;
const UPCOMING_WINDOW_DAYS = 14;
const DONUT_COLORS = ['#0f3557', '#1f6ea1', '#2f8cc8', '#7fb5de', '#c9dff0', '#9d4300', '#f59e0b'];

type FilterType = 'sector' | 'project_status' | 'location';
type DashboardFilter = { type: FilterType; value: string } | null;

function formatPortfolioValue(totalBudgetInMillions: number) {
  return `$${(totalBudgetInMillions / 1000).toFixed(2)}B`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysUntilDue(dueDate: string) {
  const today = startOfToday();
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildCountGroups(values: string[]) {
  const total = values.length || 1;

  return Object.entries(
    values.reduce<Record<string, number>>((accumulator, value) => {
      accumulator[value] = (accumulator[value] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function getFilterLabel(filter: DashboardFilter, t: (value: string) => string) {
  if (!filter) return '';
  return t(filter.value);
}

function DashboardDonutChart({
  title,
  rows,
  filterType,
  activeFilter,
  onSelect,
  itemLabel,
  t,
}: {
  title: string;
  rows: Array<{ label: string; count: number; percentage: number }>;
  filterType: FilterType;
  activeFilter: DashboardFilter;
  onSelect: (nextFilter: DashboardFilter) => void;
  itemLabel: string;
  t: (value: string) => string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = rows.map((row, index) => ({
    ...row,
    fill: DONUT_COLORS[index % DONUT_COLORS.length],
    displayLabel: t(row.label),
    isActive: activeFilter?.type === filterType && activeFilter.value === row.label,
  }));

  return (
    <section className="section-panel p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-heading mb-0">{title}</h2>
        <StatusPill tone="default">{rows.length}</StatusPill>
      </div>
      {chartData.length > 0 ? (
        <>
          <ChartContainer
            config={Object.fromEntries(chartData.map((row) => [row.label, { label: row.displayLabel, color: row.fill }]))}
            className="mx-auto h-[240px] w-full max-w-[280px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload as typeof chartData[number];
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <div className="font-semibold text-slate-900">{item.displayLabel}</div>
                      <div className="mt-1 text-slate-600">{item.count} {itemLabel}</div>
                      <div className="text-slate-500">{item.percentage}%</div>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`${filterType}-${entry.label}`}
                    fill={entry.fill}
                    opacity={activeFilter && !entry.isActive ? 0.35 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelect({ type: filterType, value: entry.label })}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="mt-4 space-y-2">
            {chartData.map((row) => (
              <button
                key={`${filterType}-legend-${row.label}`}
                type="button"
                onClick={() => onSelect({ type: filterType, value: row.label })}
                className={`flex w-full items-center justify-between gap-3 rounded-[4px] border px-3 py-2 text-left text-sm transition-colors ${
                  row.isActive
                    ? 'border-[#9d4300] bg-[#fff4ec]'
                    : 'border-[rgba(224,192,177,0.14)] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.fill }} />
                  <span className="font-medium text-slate-800">{row.displayLabel}</span>
                </div>
                <span className="text-slate-500">{row.count} ({row.percentage}%)</span>
              </button>
            ))}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            {activeFilter?.type === filterType
              ? `${t('Active filter')}: ${getFilterLabel(activeFilter, t)}`
              : `${total} ${itemLabel}`}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-slate-500">
          {t('No grouped data is available for this section yet.')}
        </div>
      )}
    </section>
  );
}

function buildDashboardStats(
  projects: Array<{ sector: string; budget: number }>,
  t: (value: string) => string,
) {
  return [
    { label: t('Total Projects'), value: `${projects.length}`, tone: 'text-slate-900' },
    { label: t('Active Sectors'), value: `${new Set(projects.map((project) => project.sector)).size}`, tone: 'text-[#0f3557]' },
    { label: t('Investment Value'), value: formatPortfolioValue(projects.reduce((sum, project) => sum + project.budget, 0)), tone: 'text-[#9d4300]' },
  ];
}

export default function InvestorJoinedExecutionPage() {
  const {
    language,
    projects,
    watchlist,
    agencies,
    users,
    projectJobs,
    getProjectProcessingSummary,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  const orderedProjects = useMemo(() => getOrderedInvestorExecutionProjects(projects, watchlist), [projects, watchlist]);
  const followedProjects = useMemo(() => getMockFollowedProjects(orderedProjects), [orderedProjects]);
  const joinedProjects = useMemo(() => getMockJoinedProjects(followedProjects), [followedProjects]);
  const joinedProjectsForDisplay = useMemo(() => {
    if (!activeFilter) return joinedProjects;

    if (activeFilter.type === 'sector') {
      return joinedProjects.filter((project) => project.sector === activeFilter.value);
    }

    if (activeFilter.type === 'project_status') {
      return joinedProjects.filter((project) => getProjectStageLabel(project.status, project.stage) === activeFilter.value);
    }

    return joinedProjects.filter((project) => (project.location || project.province) === activeFilter.value);
  }, [activeFilter, joinedProjects]);

  const joinedKeyStats = useMemo(() => buildDashboardStats(joinedProjectsForDisplay, t), [joinedProjectsForDisplay, t]);

  const groupedJoinedBySector = useMemo(
    () => buildCountGroups(joinedProjectsForDisplay.map((project) => project.sector)),
    [joinedProjectsForDisplay],
  );

  const groupedJoinedByProjectStatus = useMemo(
    () => buildCountGroups(joinedProjectsForDisplay.map((project) => getProjectStageLabel(project.status, project.stage))),
    [joinedProjectsForDisplay],
  );

  const groupedJoinedByLocation = useMemo(
    () => buildCountGroups(joinedProjectsForDisplay.map((project) => project.location || project.province)),
    [joinedProjectsForDisplay],
  );

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(joinedProjectsForDisplay.map((project) => project.location || project.province)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [joinedProjectsForDisplay],
  );

  const projectStatusOptions = useMemo(
    () =>
      Array.from(new Set(joinedProjectsForDisplay.map((project) => getProjectStageLabel(project.status, project.stage))))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [joinedProjectsForDisplay],
  );

  function getProjectJobAlertSummary(projectId: string) {
    const jobs = projectJobs.filter((item) => item.projectId === projectId);
    let pending = 0;
    let delayed = 0;
    let upcoming = 0;

    jobs.forEach((job) => {
      if (job.status === 'complete' || job.status === 'completed') return;

      pending += 1;
      const daysUntilDue = getDaysUntilDue(job.dueDate);
      if (daysUntilDue < 0) delayed += 1;
      if (daysUntilDue >= 0 && daysUntilDue <= UPCOMING_WINDOW_DAYS) upcoming += 1;
    });

    return { pending, delayed, upcoming };
  }

  const projectAssignmentMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectsForDisplay.map((project) => {
          const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
          const primaryJob = projectJobItems.find((item) => item.status !== 'complete' && item.status !== 'completed') ?? projectJobItems[0];

          if (!primaryJob) {
            return [project.id, undefined];
          }

          const agency = agencies.find((item) => item.id === primaryJob.agencyId);
          const user = users.find((item) => item.id === primaryJob.userId);

          return [
            project.id,
            {
              agency: agency?.shortName ?? agency?.name ?? '-',
              agencyFullName: agency?.name ?? agency?.shortName ?? '-',
              person: user?.name ?? agency?.contactPerson ?? '-',
            },
          ];
        }),
      ),
    [agencies, joinedProjectsForDisplay, projectJobs, users],
  );

  const projectAuditMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectsForDisplay.map((project) => {
          const createdByUser = users.find((item) => item.id === project.createdByUserId);
          return [
            project.id,
            {
              createdBy: createdByUser?.name ?? '-',
              createdAt: project.createdAt ?? project.publishedAt ?? '-',
              updatedAt: project.updatedAt ?? project.createdAt ?? project.publishedAt ?? '-',
            },
          ];
        }),
      ),
    [joinedProjectsForDisplay, users],
  );

  const projectJobAlertMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectsForDisplay.map((project) => [project.id, getProjectJobAlertSummary(project.id)]),
      ),
    [joinedProjectsForDisplay, projectJobs],
  );

  const listFilteredProjects = useMemo(() => {
    const normalizedNameFilter = projectNameFilter.trim().toLowerCase();

    return joinedProjectsForDisplay.filter((project) => {
      const projectStatus = getProjectStageLabel(project.status, project.stage);
      const matchesName =
        normalizedNameFilter.length === 0 ||
        project.name.toLowerCase().includes(normalizedNameFilter) ||
        (project.nameVi ?? '').toLowerCase().includes(normalizedNameFilter);
      const matchesLocation = locationFilter === 'all' || (project.location || project.province) === locationFilter;
      const matchesStatus = projectStatusFilter === 'all' || projectStatus === projectStatusFilter;

      return matchesName && matchesLocation && matchesStatus;
    });
  }, [joinedProjectsForDisplay, locationFilter, projectNameFilter, projectStatusFilter]);

  const totalProjectPages = Math.max(1, Math.ceil(listFilteredProjects.length / PAGINATION_PAGE_SIZE));
  const visibleProjects = showAllProjects
    ? listFilteredProjects.slice((projectPage - 1) * PAGINATION_PAGE_SIZE, projectPage * PAGINATION_PAGE_SIZE)
    : listFilteredProjects.slice(0, DEFAULT_LIST_COUNT);

  useEffect(() => {
    setProjectPage(1);
    setShowAllProjects(false);
    setExpandedProjectId(null);
  }, [locationFilter, projectNameFilter, projectStatusFilter]);

  function handleFilterSelect(nextFilter: DashboardFilter) {
    setShowAllProjects(false);
    setProjectPage(1);
    setExpandedProjectId(null);
    setActiveFilter((current) =>
      current && nextFilter && current.type === nextFilter.type && current.value === nextFilter.value ? null : nextFilter,
    );
  }

  function resetFilter() {
    setShowAllProjects(false);
    setProjectPage(1);
    setExpandedProjectId(null);
    setActiveFilter(null);
  }

  function resetListFilters() {
    setProjectNameFilter('');
    setLocationFilter('all');
    setProjectStatusFilter('all');
    setExpandedProjectId(null);
  }

  if (!orderedProjects.length) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center gap-4 p-12 text-center">
          <FolderOpen size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('No projects available yet')}</div>
          <p className="max-w-xl text-sm text-slate-500">
            {t('Projects will appear here so you can monitor execution progress, joined status, and project jobs in one investor workspace.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-heading mb-0">{t('Execution Dashboard')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('Portfolio KPIs and grouped dashboards for the joined projects in this investor execution mockup.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="success">{joinedProjectsForDisplay.length}</StatusPill>
            {activeFilter ? (
              <>
                <StatusPill tone="warning">{`${t('Filter')}: ${getFilterLabel(activeFilter, t)}`}</StatusPill>
                <button
                  type="button"
                  onClick={resetFilter}
                  className="rounded-[4px] border border-[rgba(224,192,177,0.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
                >
                  {t('Reset filter')}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {joinedKeyStats.map((metric) => (
            <div key={metric.label} className="kpi-tile">
              <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {metric.value}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardDonutChart
          title={t('Projects by Sector')}
          rows={groupedJoinedBySector}
          filterType="sector"
          activeFilter={activeFilter}
          onSelect={handleFilterSelect}
          itemLabel={t('projects')}
          t={t}
        />
        <DashboardDonutChart
          title={t('Projects by Status')}
          rows={groupedJoinedByProjectStatus}
          filterType="project_status"
          activeFilter={activeFilter}
          onSelect={handleFilterSelect}
          itemLabel={t('projects')}
          t={t}
        />
        <DashboardDonutChart
          title={t('Project By Location')}
          rows={groupedJoinedByLocation}
          filterType="location"
          activeFilter={activeFilter}
          onSelect={handleFilterSelect}
          itemLabel={t('projects')}
          t={t}
        />
      </div>

      <section className="section-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-heading mb-0">{t('Joined Projects')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeFilter || projectNameFilter.trim() || locationFilter !== 'all' || projectStatusFilter !== 'all'
                ? `${t('Showing filtered results for')} ${[
                    activeFilter ? getFilterLabel(activeFilter, t) : '',
                    projectNameFilter.trim() ? `${t('Project name')}: ${projectNameFilter.trim()}` : '',
                    locationFilter !== 'all' ? `${t('Location')}: ${t(locationFilter)}` : '',
                    projectStatusFilter !== 'all' ? `${t('Project status')}: ${t(projectStatusFilter)}` : '',
                  ].filter(Boolean).join(' | ')}.`
                : t('Project cards mirror the ITPC list behavior, and this mockup list is capped at the joined-project execution scope.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="success">{listFilteredProjects.length}</StatusPill>
            {activeFilter ? (
              <button
                type="button"
                onClick={resetFilter}
                className="rounded-[4px] border border-[rgba(224,192,177,0.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
              >
                {t('Reset filter')}
              </button>
            ) : null}
          </div>
        </div>

        <section className="filter-bar mb-4 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={projectNameFilter}
              onChange={(event) => setProjectNameFilter(event.target.value)}
              placeholder={t('Search by project name')}
              className="h-11 w-full rounded-[4px] border border-[rgba(140,113,100,0.28)] bg-[#f2f4f6] pl-10 pr-4 text-sm text-[#191c1e] outline-none transition-colors placeholder:text-[#6b7280] focus:border-[#9d4300] focus:bg-white"
            />
          </div>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="h-11 min-w-[220px] rounded-[4px] border border-[rgba(140,113,100,0.28)] bg-[#f2f4f6] px-4 text-sm text-[#191c1e] outline-none transition-colors focus:border-[#9d4300] focus:bg-white"
          >
            <option value="all">{t('All locations')}</option>
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {t(option)}
              </option>
            ))}
          </select>
          <select
            value={projectStatusFilter}
            onChange={(event) => setProjectStatusFilter(event.target.value)}
            className="h-11 min-w-[220px] rounded-[4px] border border-[rgba(140,113,100,0.28)] bg-[#f2f4f6] px-4 text-sm text-[#191c1e] outline-none transition-colors focus:border-[#9d4300] focus:bg-white"
          >
            <option value="all">{t('All project statuses')}</option>
            {projectStatusOptions.map((option) => (
              <option key={option} value={option}>
                {t(option)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetListFilters}
            className="h-11 rounded-[4px] border border-[rgba(224,192,177,0.18)] bg-white px-4 text-sm font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
          >
            {t('Reset')}
          </button>
        </section>

        <div className="space-y-3">
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                workspaceBasePath="/investor"
                canManageProjects={false}
                translate={t}
                variant="managementExpandable"
                isExpanded={expandedProjectId === project.id}
                onToggleExpand={() =>
                  setExpandedProjectId((current) => (current === project.id ? null : project.id))
                }
                viewHref={`/investor/execution/${project.id}`}
                assignmentSummary={projectAssignmentMap[project.id]}
                auditSummary={projectAuditMap[project.id]}
                processingSummary={getProjectProcessingSummary(project.id)}
                jobAlertSummary={projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 }}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              {t('No joined projects match the current filter.')}
            </div>
          )}

          {!showAllProjects && listFilteredProjects.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton
              label={t('View More')}
              onClick={() => {
                setShowAllProjects(true);
                setProjectPage(1);
                setExpandedProjectId(null);
              }}
            />
          )}

          {showAllProjects && listFilteredProjects.length > PAGINATION_PAGE_SIZE && (
            <Pagination className="justify-center pt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (projectPage > 1) {
                        setProjectPage((current) => current - 1);
                        setExpandedProjectId(null);
                      }
                    }}
                    className={projectPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalProjectPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={projectPage === pageNumber}
                      onClick={(event) => {
                        event.preventDefault();
                        setProjectPage(pageNumber);
                        setExpandedProjectId(null);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (projectPage < totalProjectPages) {
                        setProjectPage((current) => current + 1);
                        setExpandedProjectId(null);
                      }
                    }}
                    className={projectPage === totalProjectPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </section>

      <section className="section-panel p-6">
        <div className="flex items-start gap-4">
          <FolderOpen size={20} className="mt-1 text-slate-400" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{t('Execution scope')}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {t('This mockup intentionally focuses on the joined projects so investors can manage their narrower execution portfolio separately from the broader watchlist workspace.')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
