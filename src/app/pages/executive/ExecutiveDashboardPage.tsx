import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Eye, FileText, FolderOpen, Search, Star, X } from 'lucide-react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ProjectCard } from '../../components/ProjectCard';
import { SeeAllButton } from '../../components/SeeAllButton';
import { DataRow } from '../../components/ui/data-row';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';
import { StatusPill } from '../../components/ui/status-pill';
import { ChartContainer, ChartTooltip } from '../../components/ui/chart';
import { useApp } from '../../context/AppContext';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
import { translateText } from '../../utils/localization';
import { getProjectStageLabel } from '../../utils/projectStatus';
import { formatFollowerCount, getProjectFollowerCount } from '../../utils/projectFollowers';

const DEFAULT_LIST_COUNT = 6;
const PAGINATION_PAGE_SIZE = 6;
const JOB_PAGE_SIZE = 5;
const UPCOMING_WINDOW_DAYS = 14;
const INVESTOR_MATCHED_PROJECT_COUNT = 4;
const DONUT_COLORS = ['#0f3557', '#1f6ea1', '#2f8cc8', '#7fb5de', '#c9dff0', '#9d4300', '#f59e0b'];
const COUNTRY_ENGAGEMENT_VIEW_COLOR = '#2563eb';
const COUNTRY_ENGAGEMENT_FOLLOW_COLOR = '#f97316';
const COUNTRY_ENGAGEMENT_ROWS = [
  { country: 'South Korea', countryVi: 'Hàn Quốc', flagCode: 'kr', views: 86, follows: 18 },
  { country: 'Japan', countryVi: 'Nhật Bản', flagCode: 'jp', views: 74, follows: 14 },
  { country: 'Singapore', countryVi: 'Singapore', flagCode: 'sg', views: 68, follows: 12 },
  { country: 'United States', countryVi: 'Hoa Kỳ', flagCode: 'us', views: 57, follows: 9 },
  { country: 'Germany', countryVi: 'Đức', flagCode: 'de', views: 43, follows: 7 },
  { country: 'Australia', countryVi: 'Úc', flagCode: 'au', views: 39, follows: 6 },
  { country: 'France', countryVi: 'Pháp', flagCode: 'fr', views: 34, follows: 5 },
  { country: 'Netherlands', countryVi: 'Hà Lan', flagCode: 'nl', views: 29, follows: 4 },
];
const VISITOR_TREND_ROWS = [
  { month: 'Jan', visitors: 860 },
  { month: 'Feb', visitors: 1120 },
  { month: 'Mar', visitors: 1380 },
  { month: 'Apr', visitors: 1640 },
  { month: 'May', visitors: 1980 },
  { month: 'Jun', visitors: 2260 },
  { month: 'Jul', visitors: 2410 },
];

type DashboardJobStatus = 'completed' | 'delayed' | 'upcoming' | 'in_progress';
type FilterType = 'location' | 'type' | 'project_status' | 'job_status';
type DashboardFilter = { type: FilterType; value: string } | null;
type InvestmentStatus = 'Investor Matched' | 'Calling for Investment';

type DashboardJobItem = {
  id: string;
  title: string;
  description: string;
  note?: string;
  dueDate: string;
  daysUntilDue: number;
  projectId: string;
  projectName: string;
  agencyName: string;
  status: 'complete' | 'incomplete';
  latestAttachmentName?: string;
  latestAttachmentDate?: string;
};

type ProjectCountryFollowRow = {
  country: string;
  countryVi: string;
  flagCode: string;
  follows: number;
};

function buildProjectCountryFollows(projectId: string, totalFollows: number): ProjectCountryFollowRow[] {
  if (totalFollows <= 0) return [];

  const seed = Array.from(projectId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const rotatedRows = COUNTRY_ENGAGEMENT_ROWS.map((_, index, rows) => rows[(index + seed) % rows.length]);
  const weights = [0.36, 0.24, 0.18, 0.13, 0.09];
  let allocated = 0;

  return rotatedRows.slice(0, 5).map((row, index) => {
    const follows = index === 4
      ? Math.max(0, totalFollows - allocated)
      : Math.max(1, Math.round(totalFollows * weights[index]));
    allocated += follows;

    return {
      country: row.country,
      countryVi: row.countryVi,
      flagCode: row.flagCode,
      follows,
    };
  }).sort((left, right) => right.follows - left.follows || left.country.localeCompare(right.country));
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

function getJobStatusKey(job: DashboardJobItem): DashboardJobStatus {
  if (job.status === 'complete') return 'completed';
  if (job.daysUntilDue < 0) return 'delayed';
  if (job.daysUntilDue <= UPCOMING_WINDOW_DAYS) return 'upcoming';
  return 'in_progress';
}

function getInvestmentStatus(projectId: string, investorMatchedProjectIds: Set<string>): InvestmentStatus {
  return investorMatchedProjectIds.has(projectId) ? 'Investor Matched' : 'Calling for Investment';
}

function DashboardDonutChart({
  title,
  rows,
  filterType,
  activeFilter,
  onSelect,
  itemLabel,
  formatLabel,
  t,
}: {
  title: string;
  rows: Array<{ label: string; count: number; percentage: number }>;
  filterType: FilterType;
  activeFilter: DashboardFilter;
  onSelect: (nextFilter: DashboardFilter) => void;
  itemLabel: string;
  formatLabel: (value: string) => string;
  t: (value: string) => string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chartData = rows.map((row, index) => ({
    ...row,
    fill: DONUT_COLORS[index % DONUT_COLORS.length],
    displayLabel: formatLabel(row.label),
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
              ? `${t('Active filter')}: ${formatLabel(activeFilter.value)}`
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

function CountryEngagementChart({
  rows,
  language,
  t,
}: {
  rows: typeof COUNTRY_ENGAGEMENT_ROWS;
  language: 'en' | 'vi';
  t: (value: string) => string;
}) {
  const chartData = rows.map((row) => ({
    ...row,
    label: language === 'vi' ? row.countryVi : row.country,
  }));
  const chartWidth = Math.max(chartData.length, 5) * 210;
  const renderCountryTick = ({
    x = 0,
    y = 0,
    payload,
  }: {
    x?: number;
    y?: number;
    payload?: { value: string };
  }) => {
    const row = chartData.find((item) => item.label === payload?.value);
    if (!row) return null;
    const clipPathId = `country-flag-${row.flagCode}`;
    const flagUrl = `https://flagcdn.com/w40/${row.flagCode}.png`;

    return (
      <g transform={`translate(${x},${y})`}>
        <defs>
          <clipPath id={clipPathId}>
            <circle cx={-42} cy={14} r={12} />
          </clipPath>
        </defs>
        <circle cx={-42} cy={14} r={13} fill="#ffffff" stroke="#dbeafe" strokeWidth={1.5} />
        <image
          href={flagUrl}
          x={-54}
          y={2}
          width={24}
          height={24}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipPathId})`}
        />
        <text x={-24} y={18} textAnchor="start" fill="#475569" fontSize={12}>
          {row.label}
        </text>
      </g>
    );
  };

  return (
    <section className="section-panel p-6 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-heading mb-1">{t('Views and Follows by Country')}</h2>
          <p className="text-sm text-slate-500">{t('Mock investor engagement by country')}</p>
        </div>
        <StatusPill tone="info">{rows.length}</StatusPill>
      </div>

      <div className="overflow-x-auto pb-2">
        <ChartContainer
          config={{
            views: { label: t('Views'), color: COUNTRY_ENGAGEMENT_VIEW_COLOR },
            follows: { label: t('Follows'), color: COUNTRY_ENGAGEMENT_FOLLOW_COLOR },
          }}
          className="h-[310px]"
          style={{ width: chartWidth, minWidth: '100%' }}
        >
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 18 }}>
            <CartesianGrid vertical={false} stroke="#dbeafe" />
            <XAxis
              dataKey="label"
              tick={renderCountryTick}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={52}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
            <ChartTooltip
              cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold text-slate-900">{label}</div>
                    {payload.map((item) => (
                      <div key={item.dataKey} className="mt-1 flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name === 'views' ? t('Views') : t('Follows')}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="views" name="views" fill={COUNTRY_ENGAGEMENT_VIEW_COLOR} radius={[4, 4, 0, 0]} barSize={38} />
            <Bar dataKey="follows" name="follows" fill={COUNTRY_ENGAGEMENT_FOLLOW_COLOR} radius={[4, 4, 0, 0]} barSize={38} />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COUNTRY_ENGAGEMENT_VIEW_COLOR }} />
          {t('Views')}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COUNTRY_ENGAGEMENT_FOLLOW_COLOR }} />
          {t('Follows')}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {chartData.map((row) => (
          <div key={`country-number-${row.flagCode}`} className="rounded-[6px] border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <img src={`https://flagcdn.com/w40/${row.flagCode}.png`} alt="" className="h-5 w-5 rounded-full object-cover" />
              <div className="truncate text-sm font-semibold text-slate-900">{row.label}</div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="font-bold text-[#2563eb]">{row.views}</div>
                <div className="text-slate-500">{t('Visitors')}</div>
              </div>
              <div>
                <div className="font-bold text-[#f97316]">{row.follows}</div>
                <div className="text-slate-500">{t('Follows')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VisitorTrendChart({
  rows,
  t,
}: {
  rows: typeof VISITOR_TREND_ROWS;
  t: (value: string) => string;
}) {
  const chartData = rows.map((row) => ({ ...row, label: t(row.month) }));
  return (
    <section className="section-panel p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-heading mb-1">{t('Visitor trend')}</h2>
          <p className="text-sm text-slate-500">{t('Monthly visitor volume for executive monitoring')}</p>
        </div>
        <StatusPill tone="info">{t('Line chart')}</StatusPill>
      </div>
      <ChartContainer
        config={{ visitors: { label: t('Visitors'), color: '#2563eb' } }}
        className="h-[280px] w-full"
      >
        <LineChart data={chartData} margin={{ top: 10, right: 18, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#dbeafe" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={56} />
          <ChartTooltip
            cursor={{ stroke: '#93c5fd', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                  <div className="font-semibold text-slate-900">{label}</div>
                  <div className="mt-1 text-slate-600">{t('Visitors')}: {payload[0]?.value}</div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}

function TopFollowedProjectsList({
  rows,
  language,
  t,
}: {
  rows: Array<{ id: string; name: string; agency: string; follows: number; countryFollows: ProjectCountryFollowRow[] }>;
  language: 'en' | 'vi';
  t: (value: string) => string;
}) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  return (
    <section className="section-panel p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-heading mb-1">{t('Top 5 followed projects')}</h2>
          <p className="text-sm text-slate-500">{t('Projects ranked by number of followers')}</p>
        </div>
        <StatusPill tone="warning">{rows.length}</StatusPill>
      </div>
      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((project, index) => {
            const isExpanded = expandedProjectId === project.id;

            return (
              <div key={project.id} className="rounded-[6px] border border-[rgba(224,192,177,0.14)] bg-white">
                <div className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#fff7ed]">
                  <button
                    type="button"
                    onClick={() => setExpandedProjectId((current) => (current === project.id ? null : project.id))}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff4ec] text-xs font-bold text-[#9d4300]">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {project.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {t('Project Owner (Agency)')}: {t(project.agency)}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <div className="text-base font-bold text-[#9d4300]">{formatFollowerCount(project.follows)}</div>
                      <div className="text-xs text-slate-500">{t('Follows')}</div>
                    </div>
                    <Link
                      to={`/gov/projects/${project.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-[4px] border border-slate-200 bg-white px-3 text-xs font-semibold text-[#455f87] transition-colors hover:border-[#9d4300] hover:text-[#9d4300]"
                    >
                      {t('View Detail')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setExpandedProjectId((current) => (current === project.id ? null : project.id))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-[#9d4300]"
                      aria-label={isExpanded ? t('Collapse') : t('Expand')}
                      aria-expanded={isExpanded}
                    >
                      <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t('Top 5 countries following this project')}
                    </div>
                    <div className="space-y-2">
                      {project.countryFollows.map((country) => (
                        <div key={`${project.id}-${country.flagCode}`} className="flex items-center justify-between gap-3 rounded-[4px] bg-white px-3 py-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <img
                              src={`https://flagcdn.com/w40/${country.flagCode}.png`}
                              alt=""
                              className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="truncate text-sm font-semibold text-slate-800">
                              {language === 'vi' ? country.countryVi : country.country}
                            </span>
                          </div>
                          <div className="shrink-0 text-sm font-bold text-[#9d4300]">
                            {formatFollowerCount(country.follows)} {t('Follows')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
          {t('No followed projects are available yet.')}
        </div>
      )}
    </section>
  );
}

export default function ExecutiveDashboardPage() {
  const { language, projects, projectJobs, agencies, users, getProjectProcessingSummary } = useApp();
  const t = (value: string) => translateText(value, language);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<DashboardJobItem | null>(null);
  const [upcomingJobPage, setUpcomingJobPage] = useState(1);
  const [delayedJobPage, setDelayedJobPage] = useState(1);
  const investorMatchedProjectIds = useMemo(
    () => new Set(projects.slice(0, INVESTOR_MATCHED_PROJECT_COUNT).map((project) => project.id)),
    [projects],
  );

  const projectJobAlertMap = useMemo(
    () =>
      Object.fromEntries(
        projects.map((project) => {
          const projectSpecificJobs = projectJobs.filter((item) => item.projectId === project.id);
          let pending = 0;
          let delayed = 0;
          let upcoming = 0;

          projectSpecificJobs.forEach((job) => {
            if (job.status === 'complete' || job.status === 'completed') return;

            pending += 1;
            const daysUntilDue = getDaysUntilDue(job.dueDate);
            if (daysUntilDue < 0) delayed += 1;
            if (daysUntilDue >= 0 && daysUntilDue <= UPCOMING_WINDOW_DAYS) upcoming += 1;
          });

          return [project.id, { pending, delayed, upcoming }];
        }),
      ),
    [projectJobs, projects],
  );

  const dashboardProjects = useMemo(() => {
    if (!activeFilter) return projects;

    return projects.filter((project) => {
      if (activeFilter.type === 'location') {
        return getProjectAdministrativeLocation(project) === activeFilter.value;
      }

      if (activeFilter.type === 'type') {
        return project.sector === activeFilter.value;
      }

      if (activeFilter.type === 'project_status') {
        return getInvestmentStatus(project.id, investorMatchedProjectIds) === activeFilter.value;
      }

      const projectJobSummary = projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 };
      if (activeFilter.value === 'completed') {
        return getProjectProcessingSummary(project.id).total > 0 && projectJobSummary.pending === 0;
      }
      if (activeFilter.value === 'delayed') {
        return projectJobSummary.delayed > 0;
      }
      if (activeFilter.value === 'upcoming') {
        return projectJobSummary.upcoming > 0;
      }
      return projectJobSummary.pending > 0 && projectJobSummary.delayed === 0 && projectJobSummary.upcoming === 0;
    });
  }, [activeFilter, getProjectProcessingSummary, investorMatchedProjectIds, projectJobAlertMap, projects]);

  const dashboardProjectIds = useMemo(() => new Set(dashboardProjects.map((project) => project.id)), [dashboardProjects]);

  const dashboardJobs = useMemo<DashboardJobItem[]>(
    () =>
      projectJobs
        .filter((job) => dashboardProjectIds.has(job.projectId))
        .map((job) => {
          const project = projects.find((item) => item.id === job.projectId);
          const agency = agencies.find((item) => item.id === job.agencyId);

          return {
            id: job.id,
            title: job.title,
            description: job.description,
            note: job.note,
            dueDate: job.dueDate,
            daysUntilDue: getDaysUntilDue(job.dueDate),
            projectId: job.projectId,
            projectName: project?.name ?? job.projectId,
            agencyName: agency?.nameEn ?? agency?.name ?? '-',
            status: job.status,
            latestAttachmentName: job.attachments?.[0]?.fileName,
            latestAttachmentDate: job.attachments?.[0]?.lastUploadDate,
          };
        })
        .sort((left, right) => left.daysUntilDue - right.daysUntilDue),
    [agencies, dashboardProjectIds, projectJobs, projects],
  );

  const delayedJobs = useMemo(
    () => dashboardJobs.filter((job) => job.status !== 'complete' && job.daysUntilDue < 0),
    [dashboardJobs],
  );
  const upcomingJobs = useMemo(
    () => dashboardJobs.filter((job) => job.status !== 'complete' && job.daysUntilDue >= 0 && job.daysUntilDue <= UPCOMING_WINDOW_DAYS),
    [dashboardJobs],
  );
  const activeJobs = useMemo(
    () => dashboardJobs.filter((job) => job.status !== 'complete').length,
    [dashboardJobs],
  );
  const totalUpcomingJobPages = Math.max(1, Math.ceil(upcomingJobs.length / JOB_PAGE_SIZE));
  const totalDelayedJobPages = Math.max(1, Math.ceil(delayedJobs.length / JOB_PAGE_SIZE));
  const visibleUpcomingJobs = upcomingJobs.slice((upcomingJobPage - 1) * JOB_PAGE_SIZE, upcomingJobPage * JOB_PAGE_SIZE);
  const visibleDelayedJobs = delayedJobs.slice((delayedJobPage - 1) * JOB_PAGE_SIZE, delayedJobPage * JOB_PAGE_SIZE);

  const groupedByType = useMemo(
    () => buildCountGroups(dashboardProjects.map((project) => project.sector)),
    [dashboardProjects],
  );
  const groupedByProjectStatus = useMemo(
    () => buildCountGroups(dashboardProjects.map((project) => getInvestmentStatus(project.id, investorMatchedProjectIds))),
    [dashboardProjects, investorMatchedProjectIds],
  );

  const keyStats = useMemo(
    () => [
      { label: t('Total Projects'), value: `${dashboardProjects.length}`, tone: 'text-slate-900' },
      { label: t('Active Project Jobs'), value: `${activeJobs}`, tone: 'text-[#0f3557]' },
      { label: t('Upcoming Project Jobs'), value: `${upcomingJobs.length}`, tone: 'text-[#9d4300]' },
      { label: t('Delayed Project Jobs'), value: `${delayedJobs.length}`, tone: 'text-rose-700' },
    ],
    [activeJobs, dashboardProjects.length, delayedJobs.length, t, upcomingJobs.length],
  );

  const followedProjectRows = useMemo(
    () =>
      dashboardProjects
        .map((project) => ({
          id: project.id,
          name: language === 'vi' && project.nameVi ? project.nameVi : project.name,
          agency: project.agency,
          sector: project.sector,
          location: getProjectAdministrativeLocation(project),
          follows: project.followers || getProjectFollowerCount(project),
          countryFollows: buildProjectCountryFollows(project.id, project.followers || getProjectFollowerCount(project)),
        }))
        .filter((project) => project.follows > 0)
        .sort((left, right) => right.follows - left.follows || left.name.localeCompare(right.name)),
    [dashboardProjects, language],
  );

  const topFollowedProjects = useMemo(() => followedProjectRows.slice(0, 5), [followedProjectRows]);

  const executiveAnalyticsStats = useMemo(() => {
    const totalVisitors = COUNTRY_ENGAGEMENT_ROWS.reduce((sum, row) => sum + row.views, 0);
    const totalFollows = followedProjectRows.reduce((sum, row) => sum + row.follows, 0);
    const topProject = followedProjectRows[0];

    return [
      {
        label: t('Total visitors'),
        value: formatFollowerCount(totalVisitors),
        tone: 'text-[#0f3557]',
        icon: Eye,
      },
      {
        label: t('Total follows'),
        value: formatFollowerCount(totalFollows),
        tone: 'text-[#9d4300]',
        icon: Star,
      },
      {
        label: t('Most followed project'),
        value: topProject ? formatFollowerCount(topProject.follows) : '0',
        detail: topProject?.name ?? t('No followed projects'),
        tone: 'text-rose-700',
        icon: FolderOpen,
      },
    ];
  }, [followedProjectRows, t]);

  const executiveAssignmentMap = useMemo(
    () =>
      Object.fromEntries(
        dashboardProjects.map((project) => {
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
    [agencies, dashboardProjects, projectJobs, users],
  );

  const projectAuditMap = useMemo(
    () =>
      Object.fromEntries(
        dashboardProjects.map((project) => {
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
    [dashboardProjects, users],
  );

  const locationOptions = useMemo(
    () =>
      administrativeLocationOptions.filter((option) =>
        dashboardProjects.some((project) => getProjectAdministrativeLocation(project) === option),
      ),
    [dashboardProjects],
  );
  const projectStatusOptions = useMemo(
    () =>
      Array.from(new Set(dashboardProjects.map((project) => getInvestmentStatus(project.id, investorMatchedProjectIds))))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [dashboardProjects, investorMatchedProjectIds],
  );

  const listFilteredProjects = useMemo(() => {
    const normalizedNameFilter = projectNameFilter.trim().toLowerCase();

    return dashboardProjects.filter((project) => {
      const projectStatus = getInvestmentStatus(project.id, investorMatchedProjectIds);
      const projectLocation = getProjectAdministrativeLocation(project);
      const matchesName =
        normalizedNameFilter.length === 0 ||
        project.name.toLowerCase().includes(normalizedNameFilter) ||
        (project.nameVi ?? '').toLowerCase().includes(normalizedNameFilter);
      const matchesLocation = locationFilter === 'all' || projectLocation === locationFilter;
      const matchesStatus = projectStatusFilter === 'all' || projectStatus === projectStatusFilter;

      return matchesName && matchesLocation && matchesStatus;
    });
  }, [dashboardProjects, investorMatchedProjectIds, locationFilter, projectNameFilter, projectStatusFilter]);

  const totalProjectPages = Math.max(1, Math.ceil(listFilteredProjects.length / PAGINATION_PAGE_SIZE));
  const visibleProjects = showAllProjects
    ? listFilteredProjects.slice((projectPage - 1) * PAGINATION_PAGE_SIZE, projectPage * PAGINATION_PAGE_SIZE)
    : listFilteredProjects.slice(0, DEFAULT_LIST_COUNT);

  useEffect(() => {
    setProjectPage(1);
    setShowAllProjects(false);
    setExpandedProjectId(null);
  }, [locationFilter, projectNameFilter, projectStatusFilter]);

  useEffect(() => {
    setUpcomingJobPage(1);
    setDelayedJobPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (upcomingJobPage > totalUpcomingJobPages) {
      setUpcomingJobPage(totalUpcomingJobPages);
    }
  }, [totalUpcomingJobPages, upcomingJobPage]);

  useEffect(() => {
    if (delayedJobPage > totalDelayedJobPages) {
      setDelayedJobPage(totalDelayedJobPages);
    }
  }, [delayedJobPage, totalDelayedJobPages]);

  function getJobStatusLabel(status: DashboardJobStatus) {
    switch (status) {
      case 'completed':
        return t('Completed');
      case 'delayed':
        return t('Delayed');
      case 'upcoming':
        return t('Upcoming');
      case 'in_progress':
      default:
        return t('In progress');
    }
  }

  function getJobStatusTone(status: DashboardJobStatus): 'success' | 'warning' | 'info' | 'danger' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'delayed':
        return 'danger';
      case 'upcoming':
        return 'warning';
      case 'in_progress':
      default:
        return 'info';
    }
  }

  function getDueLabel(daysUntilDue: number) {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} ${t('days overdue')}`;
    if (daysUntilDue === 0) return t('Due today');
    if (daysUntilDue === 1) return t('Due tomorrow');
    return `${t('Due in')} ${daysUntilDue} ${t('days')}`;
  }

  function formatDashboardFilterLabel(filter: DashboardFilter) {
    if (!filter) return '';
    if (filter.type === 'location') return getAdministrativeLocationLabel(filter.value, language);
    if (filter.type === 'job_status') return getJobStatusLabel(filter.value as DashboardJobStatus);
    return t(filter.value);
  }

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

  function renderJobPagination(currentPage: number, totalPages: number, onPageChange: (page: number) => void) {
    if (totalPages <= 1) return null;
    const leadingPages = Array.from({ length: Math.min(4, totalPages) }, (_, index) => index + 1);
    const showCurrentPage = currentPage > 4 && currentPage < totalPages;
    const showTrailingEllipsis = totalPages > 5 && (!showCurrentPage || currentPage < totalPages - 1);

    return (
      <Pagination className="justify-end overflow-hidden pt-2">
        <PaginationContent className="max-w-full flex-wrap justify-end gap-1">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {leadingPages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={currentPage === pageNumber}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {totalPages > 4 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {showCurrentPage && (
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(event) => {
                  event.preventDefault();
                }}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>
          )}
          {showTrailingEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {totalPages > 4 && (
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={currentPage === totalPages}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(totalPages);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  function renderJobSection({
    title,
    jobs,
    totalCount,
    emptyMessage,
    statusTone,
    hoverTone,
    currentPage,
    totalPages,
    onPageChange,
  }: {
    title: string;
    jobs: DashboardJobItem[];
    totalCount: number;
    emptyMessage: string;
    statusTone: 'warning' | 'danger';
    hoverTone: 'sky' | 'rose';
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) {
    const hoverClass = hoverTone === 'rose'
      ? 'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
      : 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700';

    return (
      <section className="section-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{title}</h2>
          <StatusPill tone={statusTone}>{totalCount}</StatusPill>
        </div>
        <div className="space-y-3">
          {jobs.length ? (
            jobs.map((job) => {
              const jobStatus = getJobStatusKey(job);
              return (
                <DataRow key={job.id}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{t(job.title)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={getJobStatusTone(jobStatus)}>{getJobStatusLabel(jobStatus)}</StatusPill>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition ${hoverClass}`}
                      aria-label={t('View job details')}
                      title={t('View job details')}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </DataRow>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
          )}
          {renderJobPagination(currentPage, totalPages, onPageChange)}
        </div>
      </section>
    );
  }

  if (!projects.length) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center gap-4 p-12 text-center">
          <FolderOpen size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('No projects available yet')}</div>
          <p className="max-w-xl text-sm text-slate-500">
            {t('Projects will appear here so the executive team can monitor portfolio concentration, project status, and project jobs in one dashboard.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-heading mb-1">{t('Executive Dashboard')}</h2>
            <p className="text-sm text-slate-500">
              {t('Investor traffic, country reach, and project follow analytics for leadership monitoring.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">{t('Analytics')}</StatusPill>
            {activeFilter ? (
              <>
                <StatusPill tone="warning">{`${t('Filter')}: ${formatDashboardFilterLabel(activeFilter)}`}</StatusPill>
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

        <div className="grid gap-4 lg:grid-cols-3">
          {executiveAnalyticsStats.map((metric) => {
            const Icon = metric.icon;
            return (
            <div key={metric.label} className="kpi-tile">
              <div className="flex items-start justify-between gap-3">
                <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
                  {metric.value}
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4ec] text-[#9d4300]">
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
              {'detail' in metric && metric.detail ? (
                <div className="mt-2 truncate text-sm font-semibold text-slate-700" title={metric.detail}>
                  {metric.detail}
                </div>
              ) : null}
            </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <VisitorTrendChart rows={VISITOR_TREND_ROWS} t={t} />
        <CountryEngagementChart
          rows={COUNTRY_ENGAGEMENT_ROWS}
          language={language}
          t={t}
        />
        <TopFollowedProjectsList rows={topFollowedProjects} language={language} t={t} />
      </div>

      <section className="section-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-heading mb-0">{t('Executive Project Portfolio')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeFilter || projectNameFilter.trim() || locationFilter !== 'all' || projectStatusFilter !== 'all'
                ? `${t('Showing filtered results for')} ${[
                    activeFilter ? formatDashboardFilterLabel(activeFilter) : '',
                    projectNameFilter.trim() ? `${t('Project name')}: ${projectNameFilter.trim()}` : '',
                    locationFilter !== 'all' ? `${t('Location')}: ${getAdministrativeLocationLabel(locationFilter, language)}` : '',
                    projectStatusFilter !== 'all' ? `${t('Project status')}: ${t(projectStatusFilter)}` : '',
                  ].filter(Boolean).join(' â€¢ ')}.`
                : t('Project cards follow the same expandable management behavior as the watchlist page, tailored for executive review.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">{listFilteredProjects.length}</StatusPill>
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
                {getAdministrativeLocationLabel(option, language)}
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
                workspaceBasePath="/executive"
                canManageProjects={false}
                language={language}
                translate={t}
                variant="managementExpandable"
                isExpanded={expandedProjectId === project.id}
                onToggleExpand={() => setExpandedProjectId((current) => (current === project.id ? null : project.id))}
                viewHref={`/gov/projects/${project.id}`}
                assignmentSummary={executiveAssignmentMap[project.id]}
                auditSummary={projectAuditMap[project.id]}
                processingSummary={getProjectProcessingSummary(project.id)}
                jobAlertSummary={projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 }}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              {t('No projects match the current filter.')}
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

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="text-base font-semibold text-slate-900">{t(selectedJob.title)}</div>
                <div className="mt-1 text-sm text-slate-500">{t(selectedJob.projectName)}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={t('Close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={getJobStatusTone(getJobStatusKey(selectedJob))}>{getJobStatusLabel(getJobStatusKey(selectedJob))}</StatusPill>
                <StatusPill tone={selectedJob.daysUntilDue < 0 ? 'danger' : 'warning'}>
                  {getDueLabel(selectedJob.daysUntilDue)}
                </StatusPill>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t('Job description')}
                </div>
                <div className="text-sm leading-7 text-slate-700">{t(selectedJob.description)}</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Coordinating Unit')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.agencyName)}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Due date')}</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedJob.dueDate}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Project')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.projectName)}</div>
                </DataRow>
              </div>

              {selectedJob.note ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                    {t('Executive note')}
                  </div>
                  <div className="text-sm leading-7 text-amber-900">{t(selectedJob.note)}</div>
                </div>
              ) : null}

              {selectedJob.latestAttachmentName ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                    <FileText size={14} />
                    {t('Latest attachment')}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.latestAttachmentName)}</div>
                  {selectedJob.latestAttachmentDate ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {t('Updated')}: {selectedJob.latestAttachmentDate}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

