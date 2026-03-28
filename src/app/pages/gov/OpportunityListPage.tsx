import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, ArrowRight, DollarSign, Globe, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';
import { DataRow } from '../../components/ui/data-row';

const stages = ['new', 'review', 'due_diligence', 'negotiation', 'approved', 'rejected'] as const;
type Stage = typeof stages[number];

const stageConfig: Record<Stage, { label: string; tone: 'info' | 'warning' | 'default' | 'success' | 'danger' }> = {
  new: { label: 'New', tone: 'info' },
  review: { label: 'Initial Review', tone: 'warning' },
  due_diligence: { label: 'Due Diligence', tone: 'default' },
  negotiation: { label: 'Negotiation', tone: 'default' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const mockToday = new Date('2024-03-20');

function getDaysInStage(updatedAt: string) {
  const updated = new Date(updatedAt);
  return Math.max(1, Math.round((mockToday.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function OpportunityListPage() {
  const { opportunities, language } = useApp();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('list');
  const [stageFilter, setStageFilter] = useState('all');
  const t = (value: string) => translateText(value, language);

  const filtered = useMemo(() => opportunities.filter((opportunity) => {
    const matchSearch = !search
      || opportunity.investorCompany.toLowerCase().includes(search.toLowerCase())
      || opportunity.projectName.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || opportunity.stage === stageFilter;
    return matchSearch && matchStage;
  }), [search, stageFilter]);

  const overdue = filtered.filter((opportunity) => getDaysInStage(opportunity.updatedAt) > 14);
  const unassigned = filtered.filter((opportunity) => !opportunity.notes);
  const totalPipeline = filtered.reduce((sum, opportunity) => sum + opportunity.amount, 0);

  return (
    <div className="page-shell">
      <div className="mb-6">
        <h1 className="section-heading">{t('Opportunity Pipeline')}</h1>
        <p className="section-subheading">{t('Action-first monitoring for new leads, aging opportunities, and coordination handoffs.')}</p>
      </div>

      <section className="section-panel mb-6 border-red-200 bg-red-50/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-red-900">{t('Requires Attention')}</h2>
          <StatusPill tone="danger">{overdue.length + unassigned.length} {t('items')}</StatusPill>
        </div>
        <div className="space-y-3">
          {overdue.slice(0, 3).map((item) => (
            <Link key={item.id} to={`/gov/opportunities/${item.id}`} className="block">
              <DataRow className="border-red-200 bg-white">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.investorCompany}</div>
                  <div className="text-xs text-slate-500">{item.projectName}</div>
                </div>
                <UrgencyBadge days={getDaysInStage(item.updatedAt)} label={`${getDaysInStage(item.updatedAt)} days in stage`} />
              </DataRow>
            </Link>
          ))}
          {overdue.length === 0 && unassigned.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('No overdue or unassigned opportunities require immediate action.')}
            </div>
          )}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active Opportunities', value: filtered.filter((item) => !['approved', 'rejected'].includes(item.stage)).length, tone: 'text-sky-700' },
          { label: 'This Month New', value: filtered.filter((item) => item.stage === 'new').length, tone: 'text-amber-700' },
          { label: 'Conversion Rate', value: `${Math.round((opportunities.filter((item) => item.stage === 'approved').length / opportunities.length) * 100)}%`, tone: 'text-emerald-700' },
          { label: 'Avg Days to Close', value: '12', tone: 'text-slate-800' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {metric.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search investor or project...')}
            className="app-input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="app-input w-auto min-w-44"
          >
            <option value="all">{t('All Stages')}</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>{t(stageConfig[stage].label)}</option>
            ))}
          </select>
          <div className="overflow-hidden rounded-md border border-border bg-white">
            {[
              { id: 'list', label: 'List' },
              { id: 'kanban', label: 'Kanban' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setView(option.id as 'list' | 'kanban')}
                className={`px-4 py-2.5 text-sm ${view === option.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.filter((stage) => stage !== 'rejected').map((stage) => {
            const items = filtered.filter((opportunity) => opportunity.stage === stage);
            const config = stageConfig[stage];

            return (
              <div key={stage} className="w-72 flex-shrink-0">
                <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <StatusPill tone={config.tone}>{t(config.label)}</StatusPill>
                  <span className="text-xs font-semibold text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((opportunity) => (
                    <Link key={opportunity.id} to={`/gov/opportunities/${opportunity.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:bg-slate-50">
                      <div className="mb-2 text-sm font-semibold text-slate-900">{opportunity.investorCompany}</div>
                      <div className="mb-3 text-xs text-slate-500">{opportunity.projectName}</div>
                      <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1"><DollarSign size={11} /> ${opportunity.amount}M</span>
                        <span className="flex items-center gap-1"><Globe size={11} /> {opportunity.investorCountry}</span>
                      </div>
                      <UrgencyBadge days={getDaysInStage(opportunity.updatedAt)} label={`${getDaysInStage(opportunity.updatedAt)} days in stage`} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((opportunity) => (
            <Link key={opportunity.id} to={`/gov/opportunities/${opportunity.id}`} className="block">
              <DataRow>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{opportunity.investorCompany}</div>
                    <StatusPill tone={stageConfig[opportunity.stage].tone}>{t(stageConfig[opportunity.stage].label)}</StatusPill>
                  </div>
                  <div className="text-xs text-slate-500">{opportunity.projectName}</div>
                </div>
                <div className="hidden items-center gap-4 text-xs text-slate-600 md:flex">
                  <span className="flex items-center gap-1"><DollarSign size={11} /> ${opportunity.amount}M</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {opportunity.updatedAt}</span>
                </div>
                <UrgencyBadge days={getDaysInStage(opportunity.updatedAt)} label={`${getDaysInStage(opportunity.updatedAt)}d`} />
                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                  {t('View')}
                  <ArrowRight size={12} />
                </div>
              </DataRow>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-slate-600">
        {t('Total pipeline value')}: <span className="font-semibold text-slate-900">${totalPipeline}M</span>
      </div>
    </div>
  );
}
