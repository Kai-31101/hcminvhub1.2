import React from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { getDemoUserIdForRole, useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { getProjectStageLabel, getProjectStatusTone } from '../../utils/projectStatus';

function getJobStatusMeta(status: string, t: (value: string) => string) {
  const normalizedStatus = status === 'complete' || status === 'completed' ? 'complete' : 'incomplete';
  return normalizedStatus === 'complete'
    ? { tone: 'success' as const, label: t('Completed') }
    : { tone: 'info' as const, label: t('Processing') };
}

function getDueDateMeta(status: string, dueDate: string, t: (value: string) => string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (status === 'complete' || status === 'completed') {
    return { tone: 'success' as const, label: `${t('Due date')}: ${dueDate}` };
  }
  if (daysUntilDue < 0) return { tone: 'danger' as const, label: `${t('Due date')}: ${dueDate} • ${t('Overdue')} ${Math.abs(daysUntilDue)} ${t('days')}` };
  if (daysUntilDue === 5 || daysUntilDue === 10) return { tone: 'warning' as const, label: `${t('Due date')}: ${dueDate} • ${t('Due in')} ${daysUntilDue} ${t('days')}` };
  return { tone: 'default' as const, label: `${t('Due date')}: ${dueDate}` };
}

export default function ProjectViewPage() {
  const { id } = useParams();
  const { language, projects, agencies, users, opportunities, projectJobs, getProjectProcessingSummary, role } = useApp();
  const project = projects.find((item) => item.id === id);
  const t = (value: string) => translateText(value, language);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const canManageProjects = role !== 'agency';
  const canAccessProject = project && (role !== 'gov_operator' || project.createdByUserId === getDemoUserIdForRole(role));

  if (!project || !canAccessProject) {
    return <Navigate to={`${workspaceBasePath}/projects`} replace />;
  }

  const overviewRows = [
    ['Name', project.name],
    ['Sector', project.sector],
    ['Province', project.province],
    ['Location', project.location],
    ['Budget (USD M)', String(project.budget)],
    ['Minimum Investment (USD M)', String(project.minInvestment)],
    ['Timeline', project.timeline],
    ['Expected IRR', project.returnRate],
    ['Land Area', project.landArea],
    ['Project Stage', project.stage],
  ];
  const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
  const processingSummary = getProjectProcessingSummary(project.id);
  const latestOpportunity = opportunities
    .filter((item) => item.projectId === project.id)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to={`${workspaceBasePath}/projects`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t('Project list')}
        </Link>
      </div>

      <section className="section-panel overflow-hidden p-0">
        <div className="relative h-80">
          <img src={project.image} alt={t(project.name)} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c2d4a]/92 via-[#0c2d4a]/64 to-[#0c2d4a]/18" />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone="info">{t(project.sector)}</StatusPill>
              <StatusPill tone="default">{t(project.province)}</StatusPill>
              <StatusPill tone={getProjectStatusTone(project.status, project.stage)}>
                {t(getProjectStageLabel(project.status, project.stage))}
              </StatusPill>
            </div>
            <h1 className="max-w-4xl text-white" style={{ fontSize: 'var(--text-3xl)' }}>{t(project.name)}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
              <MapPin size={14} />
              {t(project.location)}
            </div>
            {canManageProjects && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={`${workspaceBasePath}/projects/${project.id}/edit`} className="app-button">
                  {t('Edit project')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-6">
          <section className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Overview')}</h2>
              <StatusPill tone="info">{t('Standard project record')}</StatusPill>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {overviewRows.map(([label, value]) => (
                <DataRow key={label} className={label === 'Name' || label === 'Location' ? 'md:col-span-2' : ''}>
                  <div className="text-sm text-slate-500">{t(label)}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(value)}</div>
                </DataRow>
              ))}
              <div className="rounded-xl border border-border bg-slate-50 p-4 md:col-span-2">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Description')}</div>
                <div className="text-sm leading-7 text-slate-700">{t(project.description)}</div>
              </div>
            </div>
          </section>

          {latestOpportunity ? (
            <section className="section-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Investor Details')}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Representative')}</div>
                  <div className="text-sm font-semibold text-slate-900">{latestOpportunity.investorName}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Organization')}</div>
                  <div className="text-sm font-semibold text-slate-900">{latestOpportunity.investorCompany}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Country')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(latestOpportunity.investorCountry)}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Investor Type')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(latestOpportunity.investorType)}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Investment')}</div>
                  <div className="text-sm font-semibold text-slate-900">${latestOpportunity.amount}M</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Submitted At')}</div>
                  <div className="text-sm font-semibold text-slate-900">{latestOpportunity.submittedAt}</div>
                </DataRow>
                <DataRow className="md:col-span-2">
                  <div className="text-sm text-slate-500">{t('Last Updated At')}</div>
                  <div className="text-sm font-semibold text-slate-900">{latestOpportunity.updatedAt}</div>
                </DataRow>
              </div>
            </section>
          ) : null}

          <section className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Project Jobs')}</h2>
              <StatusPill tone={processingSummary.completed === processingSummary.total && processingSummary.total > 0 ? 'success' : 'info'}>
                {processingSummary.completed}/{processingSummary.total}
              </StatusPill>
            </div>
            <div className="space-y-3">
              {projectJobItems.length > 0 ? (
                projectJobItems.map((job) => {
                  const agency = agencies.find((item) => item.id === job.agencyId);
                  const personInCharge = agency?.peopleInCharge?.find((person) => person.id === job.userId);
                  const user = users.find((item) => item.id === job.userId);
                  const responsibleUserName = personInCharge?.name ?? user?.name ?? '-';
                  const statusMeta = getJobStatusMeta(job.status, t);
                  const dueDateMeta = getDueDateMeta(job.status, job.dueDate, t);
                  return (
                    <div key={job.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">{t(job.title)}</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                              <StatusPill tone={dueDateMeta.tone}>{dueDateMeta.label}</StatusPill>
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{t(job.description)}</div>
                          <div className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                            <div>{t('Responsible agency')}: {agency?.name ?? '-'}</div>
                            <div>{t('Responsible user')}: {responsibleUserName}</div>
                            <div>{t('Reminder timing')}: {job.reminderDaysBefore} {t('days before due date')}</div>
                          </div>
                          {job.note ? <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{t(job.note)}</div> : null}
                          <div className="mt-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Attachment list')}</div>
                            <div className="space-y-2">
                              {(job.attachments ?? []).length > 0 ? (
                                (job.attachments ?? []).map((file) => (
                                  <div key={`${file.fileName}-${file.lastUploadDate ?? ''}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="truncate">{t(file.fileName)}</span>
                                    <span className="shrink-0">{file.lastUploadDate || '-'}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-500">-</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                  {t('No project jobs have been defined for this project yet.')}
                </div>
              )}
            </div>
          </section>
      </div>
    </div>
  );
}
