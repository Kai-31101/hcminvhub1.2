import React, { useMemo, useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { ProjectCard } from '../../components/ProjectCard';
import { SeeAllButton } from '../../components/SeeAllButton';
import { translateText } from '../../utils/localization';
import { PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';

const DEFAULT_LIST_COUNT = 6;

export default function InvestorExecutionListPage() {
  const { language, projects, opportunities, activeInvestorCompany, agencies, users, projectJobs, getProjectProcessingSummary } = useApp();
  const t = (value: string) => translateText(value, language);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAllProjects, setShowAllProjects] = useState(false);

  const joinedProjects = useMemo(() => {
    const latestByProject = new Map<string, typeof opportunities[number]>();
    opportunities
      .filter((item) => item.investorCompany === activeInvestorCompany)
      .forEach((opportunity) => {
        const current = latestByProject.get(opportunity.projectId);
        if (!current || new Date(opportunity.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
          latestByProject.set(opportunity.projectId, opportunity);
        }
      });

    return Array.from(latestByProject.values())
      .map((opportunity) => {
        const project = projects.find((item) => item.id === opportunity.projectId);
        return project ? { project, opportunity } : null;
      })
      .filter((item): item is { project: typeof projects[number]; opportunity: typeof opportunities[number] } => Boolean(item))
      .sort((left, right) => new Date(right.opportunity.updatedAt).getTime() - new Date(left.opportunity.updatedAt).getTime());
  }, [activeInvestorCompany, opportunities, projects]);

  const joinedProjectItems = useMemo(() => joinedProjects.map((item) => item.project), [joinedProjects]);

  function getProjectJobAlertSummary(projectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobs = projectJobs.filter((item) => item.projectId === projectId);
    let pending = 0;
    let delayed = 0;
    let upcoming = 0;

    jobs.forEach((job) => {
      if (job.status === 'complete' || job.status === 'completed') return;
      pending += 1;
      const dueDate = new Date(job.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) delayed += 1;
      if (daysUntilDue === 5 || daysUntilDue === 10) upcoming += 1;
    });

    return { pending, delayed, upcoming };
  }

  const projectAssignmentMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectItems.map((project) => {
          const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
          const primaryJob = projectJobItems.find((item) => item.status !== 'complete' && item.status !== 'completed') ?? projectJobItems[0];

          if (!primaryJob) {
            return [project.id, undefined];
          }

          const agency = agencies.find((item) => item.id === primaryJob.agencyId);
          const personInCharge = agency?.peopleInCharge?.find((person) => person.id === primaryJob.userId);
          const user = users.find((item) => item.id === primaryJob.userId);

          return [
            project.id,
            {
              agency: agency?.shortName ?? agency?.name ?? '-',
              agencyFullName: agency?.name ?? agency?.shortName ?? '-',
              person: personInCharge?.name ?? user?.name ?? '-',
            },
          ];
        }),
      ),
    [agencies, joinedProjectItems, projectJobs, users],
  );

  const projectAuditMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectItems.map((project) => {
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
    [joinedProjectItems, users],
  );

  const projectJobAlertMap = useMemo(
    () =>
      Object.fromEntries(
        joinedProjectItems.map((project) => [project.id, getProjectJobAlertSummary(project.id)]),
      ),
    [joinedProjectItems, projectJobs],
  );

  const filteredProjects = useMemo(
    () =>
      joinedProjectItems.filter((project) => {
        const matchSearch =
          !search || project.name.toLowerCase().includes(search.toLowerCase()) || project.location.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [joinedProjectItems, search, statusFilter],
  );

  const visibleProjects = showAllProjects ? filteredProjects : filteredProjects.slice(0, DEFAULT_LIST_COUNT);

  if (!joinedProjects.length) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center gap-4 p-12 text-center">
          <FolderOpen size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('No joined projects yet')}</div>
          <p className="max-w-xl text-sm text-slate-500">
            {t('Projects you join will appear here after your interest is recorded, so you can open the execution detail page for each one.')}
          </p>
          <Link to="/investor/explorer" className="app-button">
            {t('Explore projects')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('Execution Workspace')}</h1>
        <p className="section-subheading">{t('Review only the projects your organization has joined, then open the execution detail for each one.')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: t('All'), value: joinedProjectItems.length, tone: 'text-slate-900' },
          { label: t('Draft'), value: joinedProjectItems.filter((project) => project.status === 'draft').length, tone: 'text-slate-700' },
          { label: t('Published'), value: joinedProjectItems.filter((project) => project.status === 'published').length, tone: 'text-amber-700' },
          { label: t('Processing'), value: joinedProjectItems.filter((project) => project.status === 'processing').length, tone: 'text-sky-700' },
          { label: t('Completed'), value: joinedProjectItems.filter((project) => project.status === 'completed').length, tone: 'text-emerald-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {metric.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

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
      </section>

      <div className="space-y-3">
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            workspaceBasePath="/investor"
            canManageProjects={false}
            translate={t}
            viewHref={`/investor/execution/${project.id}`}
            assignmentSummary={projectAssignmentMap[project.id]}
            auditSummary={projectAuditMap[project.id]}
            processingSummary={getProjectProcessingSummary(project.id)}
            jobAlertSummary={projectJobAlertMap[project.id] ?? { pending: 0, delayed: 0, upcoming: 0 }}
          />
        ))}

        {filteredProjects.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
            {t('No projects match the current filters.')}
          </div>
        )}

        {!showAllProjects && filteredProjects.length > DEFAULT_LIST_COUNT && (
          <SeeAllButton label={t('See All')} onClick={() => setShowAllProjects(true)} />
        )}
      </div>
    </div>
  );
}
