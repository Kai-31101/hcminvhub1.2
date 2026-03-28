import React from 'react';
import { Link } from 'react-router';
import { Activity, AlertTriangle, Calendar, Clock, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';
import { CompletionMeter } from '../../components/ui/completion-meter';
import { translateText } from '../../utils/localization';

const mockToday = new Date('2024-03-20');

function daysUntil(deadline: string) {
  const date = new Date(deadline);
  return Math.round((date.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getProjectHealth(projectId: string, issues: Array<{ projectId: string; status: string; priority: string }>): { label: string; tone: 'success' | 'warning' | 'danger' } {
  const openProjectIssues = issues.filter((issue) => issue.projectId === projectId && (issue.status === 'open' || issue.status === 'in_progress'));
  if (openProjectIssues.some((issue) => issue.priority === 'critical')) {
    return { label: 'Delayed', tone: 'danger' };
  }
  if (openProjectIssues.some((issue) => issue.priority === 'high')) {
    return { label: 'At Risk', tone: 'warning' };
  }
  return { label: 'On Track', tone: 'success' };
}

export default function ExecutionDashboardPage() {
  const { projects, milestones, issues, permits, language } = useApp();
  const t = (value: string) => translateText(value, language);
  const activeProjects = projects.filter((project) => project.status === 'published' || project.status === 'execution');
  const openIssues = issues.filter((issue) => issue.status === 'open' || issue.status === 'in_progress');
  const pendingPermits = permits.filter((permit) => permit.status === 'pending' || permit.status === 'in_review' || permit.status === 'info_required');
  const activeMilestones = milestones.filter((milestone) => milestone.status === 'in_progress');

  const overduePermits = pendingPermits.filter((permit) => daysUntil(permit.deadline) < 0);
  const criticalIssues = openIssues.filter((issue) => issue.priority === 'critical');
  const coordinationQueue = pendingPermits
    .slice()
    .sort((left, right) => daysUntil(left.deadline) - daysUntil(right.deadline))
    .slice(0, 5);

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('Execution Monitor')}</h1>
        <p className="section-subheading">{t('Operational dashboard for active projects, overdue signals, and cross-agency coordination.')}</p>
      </div>

      <section className="section-panel border-red-200 bg-red-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-red-900">{t('Requires Attention')}</h2>
          <StatusPill tone="danger">{overduePermits.length + criticalIssues.length} {t('alerts')}</StatusPill>
        </div>
        <div className="space-y-3">
          {criticalIssues.slice(0, 2).map((issue) => (
            <DataRow key={issue.id} className="border-red-200 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{issue.title}</div>
                <div className="mt-1 text-xs text-slate-500">{issue.projectName}</div>
              </div>
              <StatusPill tone="danger">{t('Critical issue')}</StatusPill>
            </DataRow>
          ))}
          {overduePermits.slice(0, 3).map((permit) => (
            <DataRow key={permit.id} className="border-red-200 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{permit.type}</div>
                <div className="mt-1 text-xs text-slate-500">{permit.projectName}</div>
              </div>
              <UrgencyBadge days={Math.abs(daysUntil(permit.deadline))} label={`${t('Overdue by')} ${Math.abs(daysUntil(permit.deadline))} ${t('days')}`} />
            </DataRow>
          ))}
          {criticalIssues.length === 0 && overduePermits.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('No critical execution blockers at this time.')}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('Active Projects'), value: activeProjects.length, tone: 'text-sky-700' },
          { label: t('Open Issues'), value: openIssues.length, tone: 'text-red-700' },
          { label: t('Pending Permits'), value: pendingPermits.length, tone: 'text-amber-700' },
          { label: t('In Progress Milestones'), value: activeMilestones.length, tone: 'text-emerald-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <div className="space-y-6">
          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Project Health Overview')}</h2>
              <StatusPill tone="info">{activeProjects.length} {t('tracked projects')}</StatusPill>
            </div>
            <div className="space-y-3">
              {activeProjects.map((project) => {
                const health = getProjectHealth(project.id, issues);
                const projectMilestones = milestones.filter((milestone) => milestone.projectId === project.id);
                const avgProgress = projectMilestones.length > 0
                  ? Math.round(projectMilestones.reduce((sum, milestone) => sum + milestone.progress, 0) / projectMilestones.length)
                  : 0;
                const pendingProjectPermits = permits.filter((permit) => permit.projectId === project.id && permit.status !== 'approved');

                return (
                  <Link key={project.id} to={`/gov/projects/${project.id}`} className="block">
                    <DataRow className="items-start">
                      <div className="flex items-start gap-3">
                        <img src={project.image} alt={project.name} className="h-16 w-20 rounded-md object-cover" />
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">{project.name}</div>
                            <StatusPill tone={health.tone}>{t(health.label)}</StatusPill>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin size={12} />
                            {project.province}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                            <span>{projectMilestones.length} {t('milestones')}</span>
                            <span>{issues.filter((issue) => issue.projectId === project.id && issue.status !== 'resolved').length} {t('open issues')}</span>
                            <span>{pendingProjectPermits.length} {t('permit actions')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full max-w-40">
                        <CompletionMeter value={avgProgress} />
                      </div>
                    </DataRow>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="section-panel p-5">
            <h2 className="section-heading">{t('Milestone Tracker')}</h2>
            <div className="mt-4 space-y-3">
              {activeMilestones.map((milestone) => (
                <DataRow key={milestone.id}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{t(milestone.phase)}: {t(milestone.description)}</div>
                    <div className="mt-1 text-xs text-slate-500">{milestone.projectName}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} />
                    {milestone.dueDate}
                  </div>
                  <div className="w-full max-w-32">
                    <CompletionMeter value={milestone.progress} />
                  </div>
                </DataRow>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Coordination Queue')}</h2>
              <StatusPill tone="warning">{coordinationQueue.length} {t('items')}</StatusPill>
            </div>
            <div className="space-y-3">
              {coordinationQueue.map((permit) => (
                <DataRow key={permit.id}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{permit.type}</div>
                    <div className="mt-1 text-xs text-slate-500">{permit.projectName}</div>
                  </div>
                  <UrgencyBadge
                    days={Math.max(1, Math.abs(daysUntil(permit.deadline)))}
                    label={daysUntil(permit.deadline) >= 0 ? `${daysUntil(permit.deadline)} ${t('days left')}` : `${Math.abs(daysUntil(permit.deadline))} ${t('days overdue')}`}
                  />
                </DataRow>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Open Issues')}</h2>
              <StatusPill tone="danger">{openIssues.length}</StatusPill>
            </div>
            <div className="space-y-3">
              {openIssues.slice(0, 5).map((issue) => (
                <DataRow key={issue.id}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{issue.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{issue.projectName}</div>
                  </div>
                  <StatusPill tone={issue.priority === 'critical' ? 'danger' : issue.priority === 'high' ? 'warning' : 'default'}>
                    {t(issue.priority)}
                  </StatusPill>
                </DataRow>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="flex items-center gap-3 rounded-lg bg-[linear-gradient(135deg,#0c2d4a_0%,#0c4a6e_100%)] px-4 py-4 text-white">
              <Activity size={18} className="text-emerald-300" />
              <div>
                <div className="text-sm font-semibold">{t('Execution summary')}</div>
                <div className="text-xs text-sky-100">{t('Track project delivery, permit workload, and critical blockers in one operational view.')}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
