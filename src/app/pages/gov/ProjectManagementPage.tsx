import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectCard } from '../../components/ProjectCard';
import { SeeAllButton } from '../../components/SeeAllButton';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';
import projectKpiIcon from '../../assets/project-kpi-icon.svg';
import projectKpiTrend from '../../assets/project-kpi-trend.svg';

type ProjectJobFilter = 'all' | 'pending' | 'delayed' | 'upcoming';
const DEFAULT_LIST_COUNT = 6;

type ManagementKpiCardProps = {
  labelLines: string[];
  value: number;
  tone: string;
  support: string;
  onClick?: () => void;
  isActive?: boolean;
};

function ManagementKpiCard({ labelLines, value, tone, support, onClick, isActive = false }: ManagementKpiCardProps) {
  const sharedClassName = `flex min-h-[168px] w-full flex-col gap-[8px] border-l-4 px-6 py-6 text-left shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition-all ${
    isActive
      ? 'border-[#9d4300] bg-white ring-2 ring-[#9d4300]/20'
      : 'border-[#9d4300] bg-[#f2f4f6]'
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="pr-4 text-[16px] font-bold uppercase leading-6 tracking-[0.05em] text-[#455f87]">
          {labelLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <img src={projectKpiIcon} alt="" className="mt-0.5 h-[18px] w-5 shrink-0" />
      </div>
      <div className={`pt-[8px] text-[30px] font-bold leading-9 ${tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
      <div className="mt-auto flex items-center gap-[6px] text-[12px] leading-4 text-[#006398]">
        <img src={projectKpiTrend} alt="" className="h-[6px] w-[10px] shrink-0" />
        <span>{support}</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${sharedClassName} hover:-translate-y-0.5 hover:bg-white`}>
        {content}
      </button>
    );
  }

  return <div className={sharedClassName}>{content}</div>;
}

export default function ProjectManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, agencies, users, createProject, publishProject, requiredDataAssignments, getProjectDataCompletenessSummary, projectJobs, getProjectProcessingSummary, language, role, activeUserId } = useApp();
  const t = (value: string) => translateText(value, language);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectJobFilter, setProjectJobFilter] = useState<ProjectJobFilter>('all');
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const canManageProjects = role !== 'agency';
  const visibleProjects = useMemo(() => {
    if (role === 'gov_operator') {
      return projects.filter((project) => {
        const projectJobItems = projectJobs.filter((job) => job.projectId === project.id);
        const primaryJob = projectJobItems.find((job) => job.status !== 'complete') ?? projectJobItems[0];
        return primaryJob ? `${primaryJob.agencyId}:${primaryJob.userId}` === activeUserId : false;
      });
    }
    return projects;
  }, [activeUserId, projectJobs, projects, role]);

  function getProjectJobAlertSummary(projectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobs = projectJobs.filter((item) => item.projectId === projectId);
    let pending = 0;
    let delayed = 0;
    let upcoming = 0;

    jobs.forEach((job) => {
      if (job.status === 'complete') return;
      pending += 1;
      const dueDate = new Date(job.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) delayed += 1;
      if (daysUntilDue === 5 || daysUntilDue === 10) upcoming += 1;
    });

    return { pending, delayed, upcoming, total: jobs.length };
  }

  const projectJobAlertMap = useMemo(
    () =>
      Object.fromEntries(
        visibleProjects.map((project) => [project.id, getProjectJobAlertSummary(project.id)]),
      ),
    [projectJobs, visibleProjects],
  );

  const projectAssignmentMap = useMemo(
    () =>
      Object.fromEntries(
        visibleProjects.map((project) => {
          const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
          const primaryJob = projectJobItems.find((item) => item.status !== 'complete') ?? projectJobItems[0];

          if (!primaryJob) {
            return [project.id, undefined];
          }

          const agency = agencies.find((item) => item.id === primaryJob.agencyId);
          const user = users.find((item) => item.id === primaryJob.userId);

          return [
            project.id,
            {
              agencyId: agency?.id ?? '',
              agency: agency?.shortName ?? agency?.name ?? '-',
              agencyFullName: agency?.name ?? agency?.shortName ?? '-',
            },
          ];
        }),
      ),
    [agencies, projectJobs, users, visibleProjects],
  );

  const projectAuditMap = useMemo(
    () =>
      Object.fromEntries(
        visibleProjects.map((project) => {
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
    [users, visibleProjects],
  );

  const assignmentAgencyOptions = useMemo(
    () =>
      visibleProjects
        .map((project) => projectAssignmentMap[project.id])
        .filter((item): item is NonNullable<typeof item> => Boolean(item?.agencyId))
        .reduce<Array<{ id: string; label: string; fullName: string }>>((accumulator, item) => {
          if (accumulator.some((option) => option.id === item.agencyId)) {
            return accumulator;
          }
          return [
            ...accumulator,
            {
              id: item.agencyId,
              label: item.agency,
              fullName: item.agencyFullName ?? item.agency,
            },
          ];
        }, [])
        .sort((left, right) => left.label.localeCompare(right.label)),
    [projectAssignmentMap, visibleProjects],
  );

  const filtered = useMemo(() => visibleProjects.filter((project) => {
    const matchSearch = !search || project.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || project.status === statusFilter;
    const assignmentSummary = projectAssignmentMap[project.id];
    const matchAgency =
      selectedAgencyIds.length === 0
        ? true
        : Boolean(assignmentSummary?.agencyId && selectedAgencyIds.includes(assignmentSummary.agencyId));
    const jobAlertSummary = projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 };
    const matchProjectJobFilter =
      projectJobFilter === 'all'
        ? true
        : projectJobFilter === 'pending'
          ? jobAlertSummary.pending > 0
          : projectJobFilter === 'delayed'
            ? jobAlertSummary.delayed > 0
            : jobAlertSummary.upcoming > 0;
    return matchSearch && matchStatus && matchAgency && matchProjectJobFilter;
  }), [projectAssignmentMap, projectJobAlertMap, projectJobFilter, selectedAgencyIds, visibleProjects, search, statusFilter]);

  const toggleAgencyFilter = (agencyId: string) => {
    setSelectedAgencyIds((current) =>
      current.includes(agencyId) ? current.filter((item) => item !== agencyId) : [...current, agencyId],
    );
  };

  const projectJobFilterCards = [
    { id: 'all' as const, label: t('All Projects'), value: visibleProjects.length, tone: 'text-slate-900' },
    {
      id: 'pending' as const,
      label: t('Processing Jobs'),
      value: visibleProjects.filter((project) => (projectJobAlertMap[project.id]?.pending ?? 0) > 0).length,
      tone: 'text-slate-700',
    },
    {
      id: 'delayed' as const,
      label: t('Delayed Jobs'),
      value: visibleProjects.filter((project) => (projectJobAlertMap[project.id]?.delayed ?? 0) > 0).length,
      tone: 'text-red-700',
    },
    {
      id: 'upcoming' as const,
      label: t('Upcoming Alerts'),
      value: visibleProjects.filter((project) => (projectJobAlertMap[project.id]?.upcoming ?? 0) > 0).length,
      tone: 'text-amber-700',
    },
  ];
  const visibleFilteredProjects = showAllProjects ? filtered : filtered.slice(0, DEFAULT_LIST_COUNT);
  const isVi = language === 'vi';
  const portfolioMetrics = [
    {
      labelLines: isVi ? ['Tổng', 'dự án'] : ['Total', 'Projects'],
      value: visibleProjects.length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Danh mục đang theo dõi' : 'Tracked in this workspace',
    },
    {
      labelLines: isVi ? ['Dự án', 'nháp'] : ['Draft', 'Projects'],
      value: visibleProjects.filter((project) => project.status === 'draft').length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Chờ hoàn thiện dữ liệu' : 'Awaiting data readiness',
    },
    {
      labelLines: isVi ? ['Dự án', 'công bố'] : ['Published', 'Projects'],
      value: visibleProjects.filter((project) => project.status === 'published').length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Hiển thị cho nhà đầu tư' : 'Visible to investors',
    },
    {
      labelLines: isVi ? ['Dự án', 'xử lý'] : ['Processing', 'Projects'],
      value: visibleProjects.filter((project) => project.status === 'processing').length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Đang phối hợp thực thi' : 'Under active coordination',
    },
    {
      labelLines: isVi ? ['Dự án', 'hoàn tất'] : ['Completed', 'Projects'],
      value: visibleProjects.filter((project) => project.status === 'completed').length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Đã đóng giai đoạn xử lý' : 'Closed delivery stage',
    },
    {
      labelLines: isVi ? ['Dự án', 'hủy'] : ['Cancelled', 'Projects'],
      value: visibleProjects.filter((project) => project.status === 'cancelled').length,
      tone: 'text-[#191c1e]',
      support: isVi ? 'Ngừng hoặc rút khỏi quy trình' : 'Stopped or withdrawn',
    },
  ];
  const projectJobFilterCardDetails: Record<ProjectJobFilter, { labelLines: string[]; support: string }> = {
    all: {
      labelLines: isVi ? ['Tất cả', 'dự án'] : ['All', 'Projects'],
      support: isVi ? 'Xem toàn bộ danh mục dự án' : 'View the full project set',
    },
    pending: {
      labelLines: isVi ? ['Việc xử lý', 'đang mở'] : ['Processing', 'Jobs'],
      support: isVi ? 'Có việc cần tiếp tục theo dõi' : 'Need continued coordination',
    },
    delayed: {
      labelLines: isVi ? ['Việc', 'trễ hạn'] : ['Delayed', 'Jobs'],
      support: isVi ? 'Ưu tiên xử lý ngay' : 'Require immediate attention',
    },
    upcoming: {
      labelLines: isVi ? ['Cảnh báo', 'sắp tới'] : ['Upcoming', 'Alerts'],
      support: isVi ? 'Sắp đến mốc nhắc việc' : 'Approaching reminder windows',
    },
  };

  const handleCreateProject = () => {
    const projectId = createProject({
      name: 'Dự án mới',
      sector: 'Infrastructure',
      location: 'Ho Chi Minh City',
      province: 'Ho Chi Minh City',
      budget: 0,
      minInvestment: 0,
      status: 'draft',
      stage: 'Draft',
      description: 'Mô tả chi tiết dự án',
      timeline: 'TBD',
      landArea: 'TBD',
      returnRate: 'TBD',
      jobs: 0,
    });
    navigate(`${workspaceBasePath}/projects/${projectId}/edit`);
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="section-heading">{t('Project Management')}</h1>
          <p className="section-subheading">{t('Standardize project onboarding, monitor publish readiness, and enforce minimum dataset quality.')}</p>
        </div>
        {canManageProjects && (
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
          >
            <Plus size={16} />
            {t('Create Project')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {portfolioMetrics.map((metric) => (
          <ManagementKpiCard
            key={metric.labelLines.join('-')}
            labelLines={metric.labelLines}
            value={metric.value}
            tone={metric.tone}
            support={metric.support}
          />
        ))}
      </div>

      <>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Job Alerts')}</h2>
              <div className="text-xs text-slate-500">{t('Click a KPI card to filter the project list')}</div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {projectJobFilterCards.map((metric) => {
                const isActive = projectJobFilter === metric.id;
                return (
                  <ManagementKpiCard
                    key={metric.id}
                    onClick={() => setProjectJobFilter(metric.id)}
                    isActive={isActive}
                    labelLines={projectJobFilterCardDetails[metric.id].labelLines}
                    value={metric.value}
                    tone={metric.tone}
                    support={projectJobFilterCardDetails[metric.id].support}
                  />
                );
              })}
            </div>
          </section>

          <section className="filter-bar flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search projects...')}
                className="app-input pl-9"
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input w-auto min-w-44">
              <option value="all">{t('All Statuses')}</option>
              {PROJECT_STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage.toLowerCase()}>
                  {t(stage)}
                </option>
              ))}
            </select>
            <details className="relative min-w-56">
              <summary className="app-input flex cursor-pointer list-none items-center justify-between gap-3">
                <span>
                  {selectedAgencyIds.length === 0
                    ? t('All agencies in charge')
                    : `${selectedAgencyIds.length} ${t('agencies selected')}`}
                </span>
                <span className="text-slate-400">▾</span>
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordinating Unit')}</div>
                  {selectedAgencyIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAgencyIds([])}
                      className="text-xs font-semibold text-primary hover:text-[var(--color-primary-700)]"
                    >
                      {t('Clear')}
                    </button>
                  )}
                </div>
                <div className="max-h-64 space-y-2 overflow-auto">
                  {assignmentAgencyOptions.map((agency) => (
                    <label key={agency.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedAgencyIds.includes(agency.id)}
                        onChange={() => toggleAgencyFilter(agency.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{agency.label}</span>
                        <span className="block text-xs text-slate-500">{agency.fullName}</span>
                      </span>
                    </label>
                  ))}
                  {assignmentAgencyOptions.length === 0 && (
                    <div className="px-2 py-2 text-sm text-slate-500">{t('No agencies available')}</div>
                  )}
                </div>
              </div>
            </details>
          </section>

          <div className="space-y-3">
            {visibleFilteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                workspaceBasePath={workspaceBasePath}
                canManageProjects={canManageProjects}
                translate={t}
                variant="managementExpandable"
                isExpanded={expandedProjectId === project.id}
                onToggleExpand={() =>
                  setExpandedProjectId((current) => (current === project.id ? null : project.id))
                }
                assignmentSummary={projectAssignmentMap[project.id]}
                auditSummary={projectAuditMap[project.id]}
                processingSummary={getProjectProcessingSummary(project.id)}
                jobAlertSummary={projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 }}
                onPublish={publishProject}
              />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {t('No projects match the current filters.')}
              </div>
            )}
            {!showAllProjects && filtered.length > DEFAULT_LIST_COUNT && (
              <SeeAllButton label={t('See All')} onClick={() => setShowAllProjects(true)} />
            )}
          </div>
      </>

    </div>
  );
}
