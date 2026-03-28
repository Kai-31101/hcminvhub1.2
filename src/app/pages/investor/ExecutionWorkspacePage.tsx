import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Calendar, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';
import { translateText } from '../../utils/localization';

const mockToday = new Date('2024-03-20');

function daysUntil(deadline: string) {
  const dueDate = new Date(deadline);
  return Math.round((dueDate.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getJobTone(status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'complete' || status === 'completed') return 'success';
  return 'warning';
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function getRequestTone(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  if (status === 'info_required') return 'warning' as const;
  return 'info' as const;
}

export default function ExecutionWorkspacePage() {
  const {
    opportunities,
    projects,
    issues,
    serviceRequests,
    projectJobs,
    agencies,
    users,
    getProjectProcessingSummary,
    activeInvestorCompany,
    createIssue,
    language,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const myOpportunities = useMemo(
    () => opportunities.filter((opportunity) => opportunity.investorCompany === activeInvestorCompany),
    [activeInvestorCompany, opportunities],
  );
  const myActiveExecutionOptions = myOpportunities.filter(
    (opportunity) => opportunity.stage === 'approved' || opportunity.stage === 'negotiation',
  );
  const globalActiveExecutionOptions = opportunities.filter(
    (opportunity) => opportunity.stage === 'approved' || opportunity.stage === 'negotiation',
  );
  const usingFallbackExecutionScope = myActiveExecutionOptions.length === 0;
  const activeExecutionOptions = usingFallbackExecutionScope ? globalActiveExecutionOptions : myActiveExecutionOptions;
  const [activeProject, setActiveProject] = useState(activeExecutionOptions[0]?.projectId ?? '');
  const [supportNote, setSupportNote] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  useEffect(() => {
    if (!activeExecutionOptions.length) {
      setActiveProject('');
      return;
    }
    if (!activeExecutionOptions.some((item) => item.projectId === activeProject)) {
      setActiveProject(activeExecutionOptions[0].projectId);
    }
  }, [activeExecutionOptions, activeProject]);

  const project = projects.find((item) => item.id === activeProject);
  const opportunity = activeExecutionOptions.find((item) => item.projectId === activeProject);
  const projectExecutionJobs = projectJobs
    .filter((job) => job.projectId === activeProject)
    .sort((left, right) => daysUntil(left.dueDate) - daysUntil(right.dueDate));
  const projectIssues = issues.filter((issue) => issue.projectId === activeProject && issue.status !== 'resolved' && issue.status !== 'closed');
  const projectB2gRequests = serviceRequests.filter((request) => request.projectId === activeProject);
  const processingSummary = getProjectProcessingSummary(activeProject);

  const averageProgress = useMemo(() => processingSummary.percentage, [processingSummary.percentage]);

  function handleSupportSubmit() {
    if (!supportNote.trim() || !project) return;
    createIssue({
      projectId: project.id,
      projectName: project.name,
      title: `Investor support request: ${project.name}`,
      description: supportNote.trim(),
      priority: 'high',
      status: 'open',
      assignedTo: 'Investor Operations Team',
      category: 'Support',
    });
    setSupportSubmitted(true);
    setSupportNote('');
  }

  if (activeExecutionOptions.length === 0) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center gap-4 p-12 text-center">
          <AlertTriangle size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('No active execution workspaces yet')}</div>
          <p className="max-w-xl text-sm text-slate-500">{t('Once your opportunity is approved or moved into the final coordination phase, this workspace will show progress, risks, and support actions.')}</p>
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
        <p className="section-subheading">{t('Investor-facing delivery cockpit for project progress, support requests, and execution risk visibility.')}</p>
      </div>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Portfolio Selection')}</h2>
          <StatusPill tone="info">{activeExecutionOptions.length} {t('active items')}</StatusPill>
        </div>
        {usingFallbackExecutionScope && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('No active execution item matched the selected investor profile. Showing available demo execution items instead.')}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeExecutionOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveProject(item.projectId)}
              className={[
                'rounded-xl border px-4 py-4 text-left transition-colors',
                item.projectId === activeProject ? 'border-sky-300 bg-sky-50' : 'border-border bg-card hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">{item.projectName}</div>
                <StatusPill tone={item.stage === 'approved' ? 'success' : 'warning'}>{t(item.stage.replace('_', ' '))}</StatusPill>
              </div>
              <div className="text-xs text-slate-500">{item.investorName}</div>
              <div className="mt-3 text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>${item.amount}M</div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('Average Progress'), value: `${averageProgress}%`, tone: 'text-sky-700' },
          { label: t('Milestones'), value: `${projectExecutionJobs.length}`, tone: 'text-amber-700' },
          { label: t('Open Issues'), value: `${projectIssues.length}`, tone: 'text-red-700' },
          { label: t('Investment'), value: `$${opportunity?.amount ?? 0}M`, tone: 'text-emerald-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <div className="space-y-6">
          {project && (
            <section className="section-panel overflow-hidden p-0">
              <img src={project.image} alt={project.name} className="h-56 w-full object-cover" />
              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone="info">{project.sector}</StatusPill>
                  <StatusPill tone="default">{project.location}</StatusPill>
                </div>
                <h2 className="section-heading mb-2">{project.name}</h2>
                <p className="section-subheading">{project.description}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    [t('Expected Return'), project.returnRate],
                    [t('Timeline'), project.timeline],
                    [t('Land Area'), project.landArea],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Execution Milestones')}</h2>
              <StatusPill tone="info">{projectExecutionJobs.length} {t('tracked')}</StatusPill>
            </div>
            <div className="space-y-3">
              {projectExecutionJobs.length > 0 ? (
                projectExecutionJobs.map((job) => {
                  const agency = agencies.find((item) => item.id === job.agencyId);
                  const user = users.find((item) => item.id === job.userId);
                  const dueIn = daysUntil(job.dueDate);
                  return (
                    <DataRow key={job.id} className="items-start">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{t(job.title)}</div>
                          <StatusPill tone={getJobTone(job.status)}>{t(formatStatusLabel(job.status))}</StatusPill>
                          {job.status !== 'complete' && (
                            <UrgencyBadge
                              days={Math.max(1, Math.abs(dueIn))}
                              label={dueIn < 0 ? `${Math.abs(dueIn)} ${t('days overdue')}` : `${dueIn} ${t('days left')}`}
                            />
                          )}
                        </div>
                        <div className="text-xs text-slate-600">{t(job.description)}</div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            {t('Due')} {job.dueDate}
                          </div>
                          <div>{t('Responsible agency')}: {t(agency?.name ?? '-')}</div>
                          <div>{t('Responsible user')}: {t(user?.name ?? '-')}</div>
                        </div>
                      </div>
                    </DataRow>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                  {t('No project jobs have been defined for this project yet.')}
                </div>
              )}
            </div>
          </section>

          {false && (
            <section className="section-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Coordination History')}</h2>
                <StatusPill tone="default">{opportunity.activities.length} {t('updates')}</StatusPill>
              </div>
              <div className="space-y-3">
                {[...opportunity.activities].reverse().map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-border bg-card px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{t(activity.description)}</div>
                    <div className="mt-1 text-xs text-slate-500">{activity.by} • {activity.at}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('B2G Request')}</h2>
              <StatusPill tone={projectB2gRequests.length > 0 ? 'info' : 'default'}>{projectB2gRequests.length}</StatusPill>
            </div>
            <div className="space-y-3">
              {projectB2gRequests.length > 0 ? (
                projectB2gRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center justify-end">
                      <StatusPill tone={getRequestTone(request.status)}>{t(formatStatusLabel(request.status))}</StatusPill>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                      <div><span className="font-semibold text-slate-700">{t('Request type')}:</span> {t(request.serviceName)}</div>
                      <div><span className="font-semibold text-slate-700">{t('Status')}:</span> {t(formatStatusLabel(request.status))}</div>
                      <div><span className="font-semibold text-slate-700">{t('Request By')}:</span> {t(request.applicant)}</div>
                      <div><span className="font-semibold text-slate-700">{t('RequestTime')}:</span> {request.submittedAt}</div>
                      <div><span className="font-semibold text-slate-700">{t('PIC/Agency in charge')}:</span> {t(request.assignedAgency)}</div>
                      <div><span className="font-semibold text-slate-700">{t('Due Date')}:</span> {request.deadline}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                  {t('No B2G requests for this project yet.')}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Current Risks')}</h2>
              <StatusPill tone={projectIssues.length > 0 ? 'danger' : 'success'}>{projectIssues.length}</StatusPill>
            </div>
            <div className="space-y-3">
              {projectIssues.length > 0 ? (
                projectIssues.map((issue) => (
                  <DataRow key={issue.id}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900">{issue.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{issue.category} • Updated {issue.updatedAt}</div>
                    </div>
                    <StatusPill tone={issue.priority === 'critical' ? 'danger' : issue.priority === 'high' ? 'warning' : 'default'}>
                      {t(issue.priority)}
                    </StatusPill>
                  </DataRow>
                ))
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {t('No open execution risks are currently logged for this project.')}
                </div>
              )}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Quick Actions')}</h2>
              <StatusPill tone="default">{t('Investor tools')}</StatusPill>
            </div>
            <div className="space-y-3">
              {[
                { label: t('Open project dossier'), path: `/investor/project/${activeProject}` },
                { label: t('Browse B2G services'), path: '/investor/services' },
                { label: t('Review support requests'), path: '/investor/support' },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="block">
                  <DataRow>
                    <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                    <MessageSquare size={14} className="text-slate-400" />
                  </DataRow>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Support Request')}</h2>
          <StatusPill tone="warning">{t('Direct to operations')}</StatusPill>
        </div>
        {supportSubmitted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
            <CheckCircle2 size={24} className="mx-auto text-emerald-700" />
            <div className="mt-2 text-sm font-semibold text-emerald-900">{t('Support request submitted')}</div>
            <div className="mt-1 text-xs text-emerald-700">{t('The operations team will respond within 24 hours.')}</div>
            <button
              type="button"
              onClick={() => setSupportSubmitted(false)}
              className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {t('Submit another request')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={supportNote}
              onChange={(event) => setSupportNote(event.target.value)}
              rows={5}
              className="app-input min-h-32"
              placeholder={t('Describe the support need, permit blocker, documentation issue, or coordination request')}
            />
            <button
              type="button"
              onClick={handleSupportSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1"
            >
              <Send size={14} className="shrink-0" />
              {t('Submit support request')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
