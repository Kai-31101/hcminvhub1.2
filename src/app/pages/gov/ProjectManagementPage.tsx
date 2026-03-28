import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Plus, Search, Edit, Eye, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusPill } from '../../components/ui/status-pill';
import { CompletionMeter } from '../../components/ui/completion-meter';
import { DataRow } from '../../components/ui/data-row';
import { translateText } from '../../utils/localization';

const statusTone: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
  published: 'success',
  review: 'warning',
  draft: 'default',
  execution: 'info',
};

const statusLabel: Record<string, string> = {
  published: 'Published',
  review: 'Under Review',
  draft: 'Draft',
  execution: 'In Execution',
};

export default function ProjectManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, createProject, publishProject, requiredDataAssignments, getProjectDataCompletenessSummary, projectJobs, getProjectProcessingSummary, language } = useApp();
  const t = (value: string) => translateText(value, language);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const isDataQualityRoute = location.pathname === '/gov/data-quality';

  const filtered = useMemo(() => projects.filter((project) => {
    const matchSearch = !search || project.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchSearch && matchStatus;
  }), [projects, search, statusFilter]);

  const lowQualityProjects = projects.filter((project) => {
    const projectAssignments = requiredDataAssignments.filter((item) => item.projectId === project.id);
    const hasOwnershipGap = projectAssignments.length === 0 || projectAssignments.some((item) => !item.agencyId || !item.userId || item.status !== 'complete');
    const processingGap = projectJobs.filter((item) => item.projectId === project.id).some((item) => item.status !== 'complete');
    return project.dataCompleteness < 80 || hasOwnershipGap || processingGap;
  });

  function getAssignmentDeadlineSummary(projectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignments = requiredDataAssignments.filter((item) => item.projectId === projectId);
    let overdue = 0;
    let dueSoon = 0;

    assignments.forEach((assignment) => {
      if (assignment.status === 'complete') return;
      const dueDate = new Date(assignment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) overdue += 1;
      if (daysUntilDue === 5 || daysUntilDue === 10) dueSoon += 1;
    });

    return { overdue, dueSoon };
  }

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
    navigate(`/gov/projects/${projectId}/edit`);
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="section-heading">{t('Project Management')}</h1>
          <p className="section-subheading">{t('Standardize project onboarding, monitor publish readiness, and enforce minimum dataset quality.')}</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={16} />
          {t('Create Project')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('Total Projects'), value: projects.length, tone: 'text-sky-700' },
          { label: t('Published'), value: projects.filter((project) => project.status === 'published').length, tone: 'text-emerald-700' },
          { label: t('Under Review'), value: projects.filter((project) => project.status === 'review').length, tone: 'text-amber-700' },
          { label: t('Draft'), value: projects.filter((project) => project.status === 'draft').length, tone: 'text-slate-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      {isDataQualityRoute ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <strong>{t('Data Governance')}:</strong> {t('Projects must achieve at least 80% completeness and have accountable ownership before publishing.')}
          </div>
          {projects.map((project) => (
            <Link key={project.id} to={`/gov/projects/${project.id}/edit?focus=data-quality`} className="block">
              <DataRow className={project.dataCompleteness < 80 ? 'border-amber-200' : ''}>
                {(() => {
                  const projectAssignments = requiredDataAssignments.filter((item) => item.projectId === project.id);
                  const completedAssignments = getProjectDataCompletenessSummary(project.id).completed;
                  const processingSummary = getProjectProcessingSummary(project.id);
                  const projectJobCount = projectJobs.filter((item) => item.projectId === project.id).length;
                  const ownerCoverage = projectAssignments.filter((item) => item.agencyId && item.userId).length;
                  const deadlineSummary = getAssignmentDeadlineSummary(project.id);
                  return (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{project.name}</div>
                          <StatusPill tone={statusTone[project.status]}>{t(statusLabel[project.status])}</StatusPill>
                          {project.dataCompleteness < 80 && <StatusPill tone="warning">{t('Below threshold')}</StatusPill>}
                          {projectAssignments.length === 0 && <StatusPill tone="warning">{t('No ownership matrix')}</StatusPill>}
                          {deadlineSummary.dueSoon > 0 && <StatusPill tone="warning">{deadlineSummary.dueSoon} {t('Due soon')}</StatusPill>}
                          {deadlineSummary.overdue > 0 && <StatusPill tone="danger">{deadlineSummary.overdue} {t('Overdue')}</StatusPill>}
                        </div>
                        <div className="text-xs text-slate-500">{project.province}</div>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                          <span>{t('Required data items')}: {projectAssignments.length}</span>
                          <span>{t('Owned items')}: {ownerCoverage}</span>
                          <span>{t('Completed items')}: {completedAssignments}/{projectAssignments.length}</span>
                          <span>{t('Project jobs')}: {processingSummary.completed}/{projectJobCount}</span>
                          <span>{t('Overdue items')}: {deadlineSummary.overdue}</span>
                        </div>
                      </div>
                      <div className="w-full max-w-44">
                        <CompletionMeter value={project.dataCompleteness} />
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <Edit size={12} />
                        {t('Fix Missing Data')}
                      </div>
                    </>
                  );
                })()}
              </DataRow>
            </Link>
          ))}
        </div>
      ) : (
        <>
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
              <option value="published">{t('Published')}</option>
              <option value="review">{t('Under Review')}</option>
              <option value="draft">{t('Draft')}</option>
              <option value="execution">{t('In Execution')}</option>
            </select>
          </section>

          <div className="space-y-3">
            {filtered.map((project) => (
              <DataRow
                key={project.id}
                className="items-start gap-4 cursor-pointer"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/gov/projects/${project.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/gov/projects/${project.id}`);
                  }
                }}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <img src={project.image} alt={project.name} className="h-14 w-16 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{t(project.name)}</div>
                      <StatusPill tone={statusTone[project.status]}>{t(statusLabel[project.status])}</StatusPill>
                      <StatusPill tone="info">{t(project.sector)}</StatusPill>
                    </div>
                    <div className="text-xs text-slate-500">{t(project.province)}</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                      <span>{t('Budget')} ${project.budget}M</span>
                      <span>{getProjectDataCompletenessSummary(project.id).completed}/{getProjectDataCompletenessSummary(project.id).total} {t('data items')}</span>
                      <span>{getProjectProcessingSummary(project.id).completed}/{getProjectProcessingSummary(project.id).total} {t('jobs')}</span>
                      <span>{project.publishedAt || t('Not published')}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex min-h-[4.5rem] flex-col items-end justify-between gap-2 self-stretch">
                  <div className="flex items-start gap-2">
                    <div className="w-full min-w-36 max-w-36">
                      <CompletionMeter value={project.dataCompleteness} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/gov/projects/${project.id}`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-primary"
                        title={t('View')}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/gov/projects/${project.id}/edit`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-amber-700"
                        title={t('Edit')}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Edit size={15} />
                      </Link>
                    </div>
                  </div>
                  {project.status !== 'published' && project.status !== 'execution' && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        publishProject(project.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
                    >
                      <Globe size={12} />
                      {t('Publish')}
                    </button>
                  )}
                </div>
              </DataRow>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
