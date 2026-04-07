import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Building2, Mail, PhoneCall, Plus, Search, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectCard } from '../../components/ProjectCard';
import { SeeAllButton } from '../../components/SeeAllButton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';
import projectKpiIcon from '../../assets/project-kpi-icon.svg';
import projectKpiTrend from '../../assets/project-kpi-trend.svg';

type ProjectJobFilter = 'all' | 'pending' | 'delayed' | 'upcoming';
const DEFAULT_LIST_COUNT = 6;
const PAGINATION_PAGE_SIZE = 10;

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
  const { projects, agencies, users, opportunities, issues, serviceRequests, createProject, publishProject, requiredDataAssignments, getProjectDataCompletenessSummary, projectJobs, getProjectProcessingSummary, addNotification, language, role, activeUserId } = useApp();
  const t = (value: string) => translateText(value, language);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectJobFilter, setProjectJobFilter] = useState<ProjectJobFilter>('all');
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [projectPage, setProjectPage] = useState(1);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [forwardedRequestIds, setForwardedRequestIds] = useState<string[]>([]);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const canManageProjects = role !== 'agency';
  const isAgencyWorkspace = role === 'agency';
  const isRequestManagementRoute = isAgencyWorkspace && location.pathname === '/agency/request-management';
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
  const totalProjectPages = Math.max(1, Math.ceil(filtered.length / PAGINATION_PAGE_SIZE));
  const visibleFilteredProjects = showAllProjects
    ? filtered.slice((projectPage - 1) * PAGINATION_PAGE_SIZE, projectPage * PAGINATION_PAGE_SIZE)
    : filtered.slice(0, DEFAULT_LIST_COUNT);
  const isVi = language === 'vi';
  const requestSearch = search.trim().toLowerCase();
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
  const requestItems = useMemo(() => {
    const findUserByOrg = (organization: string) => users.find((user) => user.organization === organization || user.name === organization);
    const findUserByName = (name?: string) => users.find((user) => user.name === name || user.organization === name);

    return [
      ...opportunities.map((item) => {
        const matchedUser = findUserByOrg(item.investorCompany) ?? findUserByName(item.investorName);
        return {
          id: `opportunity:${item.id}`,
          submitType: t('Investment Interest'),
          title: item.notes || `${t('Opportunity Intake')} ${item.investorCompany}`,
          projectName: item.projectName,
          submitter: item.investorCompany,
          contactName: item.investorName,
          contactEmail: item.intakeData.contactEmail || matchedUser?.email || '',
          contactPhone: item.intakeData.contactPhone || '',
          submittedAt: item.submittedAt,
          accent: 'bg-[#d5e3ff] text-[#001c3b]',
        };
      }),
      ...serviceRequests.map((item) => {
        const matchedUser = findUserByOrg(item.applicant);
        return {
          id: `service:${item.id}`,
          submitType: t('Service Request'),
          title: item.serviceName,
          projectName: item.projectName,
          submitter: item.applicant,
          contactName: matchedUser?.name || item.applicant,
          contactEmail: matchedUser?.email || '',
          contactPhone: '',
          submittedAt: item.submittedAt,
          accent: 'bg-[#eaf6ff] text-[#006398]',
        };
      }),
      ...issues.map((item) => {
        const matchedUser = findUserByName(item.reportedBy);
        return {
          id: `issue:${item.id}`,
          submitType: t('Support Request'),
          title: item.title,
          projectName: item.projectName,
          submitter: item.reportedBy || t('Unknown'),
          contactName: matchedUser?.name || item.reportedBy || t('Unknown'),
          contactEmail: matchedUser?.email || '',
          contactPhone: '',
          submittedAt: item.reportedAt,
          accent: 'bg-[#fff1e7] text-[#9d4300]',
        };
      }),
    ]
      .filter((item) => {
        if (!requestSearch) return true;
        return [item.submitType, item.title, item.projectName, item.submitter, item.contactName, item.contactEmail]
          .join(' ')
          .toLowerCase()
          .includes(requestSearch);
      })
      .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
  }, [issues, opportunities, requestSearch, serviceRequests, t, users]);
  const visibleRequestItems = showAllRequests ? requestItems : requestItems.slice(0, DEFAULT_LIST_COUNT);

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

  const handleStartContact = (request: (typeof requestItems)[number]) => {
    const target =
      request.contactEmail
        ? `mailto:${request.contactEmail}?subject=${encodeURIComponent(`${request.submitType} - ${request.projectName}`)}`
        : request.contactPhone
          ? `tel:${request.contactPhone}`
          : '';

    if (target) {
      window.open(target, '_blank');
      return;
    }

    addNotification({
      title: 'Contact information unavailable',
      message: `${request.submitter} does not have a saved email or phone in this demo workspace.`,
      type: 'warning',
      path: '/agency/projects',
    });
  };

  const handleSendToItpc = (request: (typeof requestItems)[number]) => {
    setForwardedRequestIds((current) => (current.includes(request.id) ? current : [...current, request.id]));
    addNotification({
      title: 'Sent to ITPC Communication Hub',
      message: `${request.title} from ${request.submitter} has been routed to ITPC Communication Hub.`,
      type: 'info',
      path: '/agency/projects',
    });
  };

  useEffect(() => {
    if (!showAllProjects) {
      setProjectPage(1);
      return;
    }

    if (projectPage > totalProjectPages) {
      setProjectPage(totalProjectPages);
    }
  }, [projectPage, showAllProjects, totalProjectPages]);

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="section-heading">{t(isRequestManagementRoute ? 'Request Management' : 'Project Management')}</h1>
          <p className="section-subheading">
            {t(
              isRequestManagementRoute
                ? 'Review submitted requests from all intake channels and route them to the right communication workflow.'
                : 'Standardize project onboarding, monitor publish readiness, and enforce minimum dataset quality.',
            )}
          </p>
        </div>
        {canManageProjects && !isRequestManagementRoute && (
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
          >
            <Plus size={16} />
            {t('Create Project')}
          </button>
        )}
      </div>

      {!isRequestManagementRoute && (
        <>
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
              <SeeAllButton
                label={t('See All')}
                onClick={() => {
                  setShowAllProjects(true);
                  setProjectPage(1);
                }}
              />
            )}
            {showAllProjects && filtered.length > PAGINATION_PAGE_SIZE && (
              <Pagination className="justify-center pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (projectPage > 1) {
                          setProjectPage((current) => current - 1);
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
                        }
                      }}
                      className={projectPage === totalProjectPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </>
      )}

      {isRequestManagementRoute && (
        <>
          <section className="section-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                {t('Submitted requests from all intake channels')}
              </div>
              <StatusPill tone="info">{requestItems.length} {t('visible')}</StatusPill>
            </div>
          </section>

          <section className="filter-bar flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search submit type, title, project, submitter, or contact')}
                className="app-input pl-9"
              />
            </div>
          </section>

          <div className="space-y-3">
            {visibleRequestItems.map((request) => {
              const hasBeenForwarded = forwardedRequestIds.includes(request.id);
              return (
                <div
                  key={request.id}
                  className="flex gap-6 overflow-hidden rounded-none border border-[rgba(236,238,240,1)] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[4px] bg-[#eceef0] text-[#455f87]">
                    <Building2 size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-[18px] font-bold leading-7 text-[#191c1e]">{request.title}</div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] ${request.accent}`}>
                        {request.submitType}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-[14px] text-[#455f87] lg:grid-cols-2">
                      <div><span className="font-semibold text-[#191c1e]">{t('Project')}:</span> {request.projectName}</div>
                      <div><span className="font-semibold text-[#191c1e]">{t('Submitter')}:</span> {request.submitter}</div>
                      <div><span className="font-semibold text-[#191c1e]">{t('Contact')}:</span> {request.contactName}</div>
                      <div><span className="font-semibold text-[#191c1e]">{t('Submitted')}:</span> {request.submittedAt}</div>
                      <div className="lg:col-span-2">
                        <span className="font-semibold text-[#191c1e]">{t('Contact details')}:</span>{' '}
                        {request.contactEmail || request.contactPhone
                          ? [request.contactEmail, request.contactPhone].filter(Boolean).join(' • ')
                          : t('Not available')}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartContact(request)}
                      className="inline-flex items-center gap-2 rounded-none border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] px-3 py-2 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
                    >
                      {request.contactEmail ? <Mail size={13} /> : <PhoneCall size={13} />}
                      {t('Start Contact')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendToItpc(request)}
                      disabled={hasBeenForwarded}
                      className={`inline-flex items-center gap-2 rounded-none px-4 py-2 text-xs font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] ${
                        hasBeenForwarded
                          ? 'cursor-not-allowed bg-[#455f87]/50'
                          : 'bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)]'
                      }`}
                    >
                      <Send size={13} />
                      {hasBeenForwarded ? t('Sent to ITPC') : t('Send to ITPC Communication Hub')}
                    </button>
                  </div>
                </div>
              );
            })}

            {requestItems.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {t('No submitted requests match the current filters.')}
              </div>
            )}
            {!showAllRequests && requestItems.length > DEFAULT_LIST_COUNT && (
              <SeeAllButton label={t('See All')} onClick={() => setShowAllRequests(true)} />
            )}
          </div>
        </>
      )}

    </div>
  );
}
