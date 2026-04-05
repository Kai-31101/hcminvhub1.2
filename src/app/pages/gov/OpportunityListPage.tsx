import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, ArrowRight, DollarSign, Calendar } from 'lucide-react';
import { getDemoUserIdForRole, useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';
import { DataRow } from '../../components/ui/data-row';
import { SeeAllButton } from '../../components/SeeAllButton';

const mockToday = new Date('2024-03-20');
const DEFAULT_LIST_COUNT = 6;

function getDaysInStage(updatedAt: string) {
  const updated = new Date(updatedAt);
  return Math.max(1, Math.round((mockToday.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function OpportunityListPage() {
  const { opportunities, projects, language, role } = useApp();
  const [search, setSearch] = useState('');
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [showAllList, setShowAllList] = useState(false);
  const t = (value: string) => translateText(value, language);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const visibleProjectIds = useMemo(() => {
    if (role === 'gov_operator') {
      const currentUserId = getDemoUserIdForRole(role);
      return new Set(projects.filter((project) => project.createdByUserId === currentUserId).map((project) => project.id));
    }
    return new Set(projects.map((project) => project.id));
  }, [projects, role]);

  const visibleOpportunities = useMemo(
    () => opportunities.filter((opportunity) => visibleProjectIds.has(opportunity.projectId)),
    [opportunities, visibleProjectIds],
  );

  const filtered = useMemo(() => visibleOpportunities.filter((opportunity) => {
    const matchSearch = !search
      || opportunity.investorCompany.toLowerCase().includes(search.toLowerCase())
      || opportunity.projectName.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  }), [search, visibleOpportunities]);

  const overdue = filtered.filter((opportunity) => getDaysInStage(opportunity.updatedAt) > 14);
  const unassigned = filtered.filter((opportunity) => !opportunity.notes);
  const totalPipeline = filtered.reduce((sum, opportunity) => sum + opportunity.amount, 0);
  const averageDaysSinceUpdate = filtered.length
    ? Math.round(filtered.reduce((sum, opportunity) => sum + getDaysInStage(opportunity.updatedAt), 0) / filtered.length)
    : 0;
  const visibleAttentionItems = showAllAttention ? overdue : overdue.slice(0, Math.min(3, DEFAULT_LIST_COUNT));
  const visibleListItems = showAllList ? filtered : filtered.slice(0, DEFAULT_LIST_COUNT);

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
          {visibleAttentionItems.map((item) => (
            <Link key={item.id} to={`${workspaceBasePath}/opportunities/${item.id}`} className="block">
              <DataRow className="border-red-200 bg-white">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.investorCompany}</div>
                  <div className="text-xs text-slate-500">{item.projectName}</div>
                </div>
                <UrgencyBadge days={getDaysInStage(item.updatedAt)} label={`${getDaysInStage(item.updatedAt)} days since update`} />
              </DataRow>
            </Link>
          ))}
          {overdue.length === 0 && unassigned.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('No overdue or unassigned opportunities require immediate action.')}
            </div>
          )}
          {!showAllAttention && overdue.length > 3 && (
            <SeeAllButton label={t('See All')} onClick={() => setShowAllAttention(true)} />
          )}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Opportunities', value: filtered.length, tone: 'text-sky-700' },
          { label: 'Requires Attention', value: overdue.length + unassigned.length, tone: 'text-red-700' },
          { label: 'Total Pipeline Value', value: `$${totalPipeline}M`, tone: 'text-emerald-700' },
          { label: 'Avg Days Since Update', value: averageDaysSinceUpdate, tone: 'text-slate-800' },
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
      </div>

      <div className="space-y-3">
        {visibleListItems.map((opportunity) => (
          <Link key={opportunity.id} to={`${workspaceBasePath}/opportunities/${opportunity.id}`} className="block">
            <DataRow>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm font-semibold text-slate-900">{opportunity.investorCompany}</div>
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
        {!showAllList && filtered.length > DEFAULT_LIST_COUNT && (
          <SeeAllButton label={t('See All')} onClick={() => setShowAllList(true)} />
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-slate-600">
        {t('Total pipeline value')}: <span className="font-semibold text-slate-900">${totalPipeline}M</span>
      </div>
    </div>
  );
}
