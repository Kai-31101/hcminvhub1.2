import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BarChart3, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { CompletionMeter } from '../../components/ui/completion-meter';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function ExecutiveDashboardPage() {
  const {
    language,
    projects,
    opportunities,
    issues,
    permits,
    serviceRequests,
    getProjectDataCompletenessSummary,
    getProjectProcessingSummary,
  } = useApp();
  const t = (value: string) => translateText(value, language);

  const totalPipelineValue = opportunities.reduce((sum, item) => sum + item.amount, 0);
  const riskItems =
    issues.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length +
    permits.filter((item) => !['approved', 'rejected'].includes(item.status)).length +
    serviceRequests.filter((item) => item.slaStatus === 'at_risk' || item.slaStatus === 'breached').length;

  const averageDataCompleteness = getAverage(
    projects.map((project) => getProjectDataCompletenessSummary(project.id).percentage),
  );
  const averageProjectProcessing = getAverage(
    projects.map((project) => getProjectProcessingSummary(project.id).percentage),
  );

  const snapshotProjects = useMemo(
    () =>
      [...projects]
        .sort((left, right) => {
          const leftScore = left.status === 'published' ? 2 : left.status === 'review' ? 1 : 0;
          const rightScore = right.status === 'published' ? 2 : right.status === 'review' ? 1 : 0;
          if (leftScore !== rightScore) return rightScore - leftScore;
          return right.budget - left.budget;
        })
        .slice(0, 6),
    [projects],
  );

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading">{t('Executive Dashboard')}</h1>
            <p className="section-subheading">
              {t('Lean executive overview: portfolio value, readiness, and immediate risk signals in one screen.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/executive/analytics" className="app-button-secondary">
              <BarChart3 size={14} />
              {t('Analytics')}
            </Link>
            <Link to="/executive/risks" className="app-button-secondary">
              <ShieldAlert size={14} />
              {t('Risk Monitor')}
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Published Projects', value: projects.filter((item) => item.status === 'published').length, tone: 'text-sky-700' },
          { label: 'Pipeline Value', value: `$${totalPipelineValue}M`, tone: 'text-emerald-700' },
          { label: 'Avg Data Completeness', value: `${averageDataCompleteness}%`, tone: 'text-indigo-700' },
          { label: 'Open Risk Items', value: riskItems, tone: 'text-rose-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {metric.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <section className="section-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Portfolio Snapshot')}</h2>
          <StatusPill tone="info">{snapshotProjects.length} {t('projects')}</StatusPill>
        </div>
        <div className="space-y-3">
          {snapshotProjects.map((project) => {
            const dataSummary = getProjectDataCompletenessSummary(project.id);
            const processingSummary = getProjectProcessingSummary(project.id);
            return (
              <DataRow key={project.id} className="items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{t(project.name)}</div>
                    <StatusPill tone={project.status === 'published' ? 'success' : project.status === 'review' ? 'warning' : 'default'}>
                      {t(project.status.replace('_', ' '))}
                    </StatusPill>
                  </div>
                  <div className="text-xs text-slate-500">{t(project.sector)} / {t(project.province)} / ${project.budget}M</div>
                </div>
                <div className="w-full max-w-56 space-y-3">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Data Completeness')}</div>
                    <CompletionMeter value={dataSummary.percentage} />
                    <div className="mt-1 text-xs text-slate-500">{dataSummary.completed}/{dataSummary.total}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Processing')}</div>
                    <CompletionMeter value={processingSummary.percentage} />
                    <div className="mt-1 text-xs text-slate-500">{processingSummary.completed}/{processingSummary.total}</div>
                  </div>
                </div>
              </DataRow>
            );
          })}
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/executive/analytics" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-900 transition-colors hover:bg-sky-100">
            <div className="text-sm font-semibold">{t('Go to Analytics')}</div>
            <div className="mt-1 text-xs text-sky-700">{t('Dive into funnel, sectors, and trend performance.')}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
              {t('Open')} <ArrowRight size={12} />
            </div>
          </Link>
          <Link to="/executive/risks" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900 transition-colors hover:bg-rose-100">
            <div className="text-sm font-semibold">{t('Go to Risk Monitor')}</div>
            <div className="mt-1 text-xs text-rose-700">{t('Review critical issues, permits, and SLA risks.')}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
              {t('Open')} <ArrowRight size={12} />
            </div>
          </Link>
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Execution Readiness')}</div>
        <div className="mt-2 text-sm text-slate-700">
          {t('Portfolio-level processing readiness is')} <span className="font-semibold text-slate-900">{averageProjectProcessing}%</span>.
        </div>
      </section>
    </div>
  );
}
