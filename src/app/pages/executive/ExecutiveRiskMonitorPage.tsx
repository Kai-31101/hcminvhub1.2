import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';

const mockToday = new Date('2024-03-20');

function daysUntil(deadline: string) {
  const dueDate = new Date(deadline);
  return Math.round((dueDate.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getIssueTone(status: string) {
  if (status === 'resolved' || status === 'closed') return 'success' as const;
  if (status === 'in_progress') return 'warning' as const;
  return 'danger' as const;
}

export default function ExecutiveRiskMonitorPage() {
  const { language, issues, permits, serviceRequests, requiredDataAssignments, projectJobs, projects } = useApp();
  const t = (value: string) => translateText(value, language);

  const openIssues = issues.filter((issue) => issue.status === 'open' || issue.status === 'in_progress');
  const criticalIssues = openIssues.filter((issue) => issue.priority === 'critical');

  const atRiskPermits = useMemo(
    () =>
      permits.filter((permit) => {
        const days = daysUntil(permit.deadline);
        return days <= 14 && days >= 0 && permit.status !== 'approved' && permit.status !== 'rejected';
      }),
    [permits],
  );

  const atRiskServiceRequests = serviceRequests.filter(
    (item) => item.slaStatus === 'at_risk' || item.slaStatus === 'breached',
  );

  const overdueRequiredData = requiredDataAssignments.filter((item) => item.status !== 'complete' && daysUntil(item.dueDate) < 0);
  const overdueProjectJobs = projectJobs.filter((item) => item.status !== 'complete' && daysUntil(item.dueDate) < 0);

  const topRiskProjects = useMemo(() => {
    return projects
      .map((project) => {
        const issueCount = openIssues.filter((item) => item.projectId === project.id).length;
        const permitCount = atRiskPermits.filter((item) => item.projectId === project.id).length;
        const requestCount = atRiskServiceRequests.filter((item) => item.projectId === project.id).length;
        const overdueDataCount = overdueRequiredData.filter((item) => item.projectId === project.id).length;
        const overdueJobCount = overdueProjectJobs.filter((item) => item.projectId === project.id).length;
        return {
          project,
          total: issueCount + permitCount + requestCount + overdueDataCount + overdueJobCount,
        };
      })
      .filter((item) => item.total > 0)
      .sort((left, right) => right.total - left.total)
      .slice(0, 6);
  }, [atRiskPermits, atRiskServiceRequests, openIssues, overdueProjectJobs, overdueRequiredData, projects]);

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel border-red-200 bg-red-50/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="section-heading">{t('Risk Monitor')}</h1>
            <p className="section-subheading">{t('Lean risk view across issues, permits, SLA, and overdue execution tasks.')}</p>
          </div>
          <StatusPill tone="danger">
            {criticalIssues.length + atRiskPermits.length + atRiskServiceRequests.length + overdueRequiredData.length + overdueProjectJobs.length} {t('alerts')}
          </StatusPill>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Critical Issues', value: criticalIssues.length, tone: 'text-rose-700' },
          { label: 'Open Issues', value: openIssues.length, tone: 'text-amber-700' },
          { label: 'Permits At Risk', value: atRiskPermits.length, tone: 'text-orange-700' },
          { label: 'SLA At Risk', value: atRiskServiceRequests.length, tone: 'text-indigo-700' },
          { label: 'Overdue Tasks', value: overdueRequiredData.length + overdueProjectJobs.length, tone: 'text-red-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{t('Immediate Escalations')}</h2>
            <StatusPill tone="danger">{criticalIssues.length + atRiskPermits.length}</StatusPill>
          </div>
          <div className="space-y-3">
            {criticalIssues.slice(0, 4).map((issue) => (
              <DataRow key={issue.id}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{t(issue.title)}</div>
                  <div className="mt-1 text-xs text-slate-500">{t(issue.projectName)}</div>
                </div>
                <StatusPill tone={getIssueTone(issue.status)}>{t(issue.priority)}</StatusPill>
              </DataRow>
            ))}
            {atRiskPermits.slice(0, 4).map((permit) => (
              <DataRow key={permit.id}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{t(permit.type)}</div>
                  <div className="mt-1 text-xs text-slate-500">{t(permit.projectName)}</div>
                </div>
                <UrgencyBadge days={Math.max(1, daysUntil(permit.deadline))} label={`${daysUntil(permit.deadline)} days left`} />
              </DataRow>
            ))}
            {criticalIssues.length === 0 && atRiskPermits.length === 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {t('No immediate escalations at this time.')}
              </div>
            )}
          </div>
        </section>

        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{t('Risk by Project')}</h2>
            <StatusPill tone="warning">{topRiskProjects.length}</StatusPill>
          </div>
          <div className="space-y-3">
            {topRiskProjects.map((item) => (
              <DataRow key={item.project.id}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{t(item.project.name)}</div>
                  <div className="mt-1 text-xs text-slate-500">{t(item.project.sector)} / {t(item.project.province)}</div>
                </div>
                <StatusPill tone="warning">{item.total} {t('risks')}</StatusPill>
              </DataRow>
            ))}
            {topRiskProjects.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t('No active project-level risk concentration detected.')}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="section-panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <h2 className="section-heading mb-0">{t('Overdue Ownership & Jobs')}</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{t('Required Data Overdue')}</div>
            <div className="text-2xl font-bold text-amber-800">{overdueRequiredData.length}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">{t('Project Jobs Overdue')}</div>
            <div className="text-2xl font-bold text-rose-800">{overdueProjectJobs.length}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
