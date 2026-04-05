import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Calendar, DollarSign, FolderKanban } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { SeeAllButton } from '../../components/SeeAllButton';
import { StatusPill } from '../../components/ui/status-pill';
const DEFAULT_LIST_COUNT = 6;

export default function InvestorOpportunityListPage() {
  const { opportunities, activeInvestorCompany } = useApp();
  const [showAll, setShowAll] = useState(false);

  const myOpportunities = useMemo(
    () => opportunities.filter((opportunity) => opportunity.investorCompany === activeInvestorCompany),
    [activeInvestorCompany, opportunities],
  );
  const totalInvestment = myOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0);
  const latestSubmittedAt = myOpportunities
    .map((opportunity) => opportunity.submittedAt)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const visibleOpportunities = showAll ? myOpportunities : myOpportunities.slice(0, DEFAULT_LIST_COUNT);

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">My Opportunities</h1>
        <p className="section-subheading">Track every submitted intake and the project workspaces associated with your company.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total', value: myOpportunities.length, tone: 'text-sky-700' },
          { label: 'Total Investment', value: `$${totalInvestment}M`, tone: 'text-emerald-700' },
          { label: 'Latest Submission', value: latestSubmittedAt ?? '-', tone: 'text-amber-700' },
          { label: 'Execution Workspaces', value: myOpportunities.filter((item) => ['approved', 'negotiation'].includes(item.stage)).length, tone: 'text-slate-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {metric.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">Pipeline Visibility</h2>
          <StatusPill tone="info">{activeInvestorCompany}</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleOpportunities.map((opportunity) => (
            <DataRow key={opportunity.id}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm font-semibold text-slate-900">{opportunity.projectName}</div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <DollarSign size={11} />
                    ${opportunity.amount}M
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Submitted {opportunity.submittedAt}
                  </span>
                  <span>{opportunity.id}</span>
                </div>
              </div>
              <Link to="/investor/execution" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Open workspace
                <ArrowRight size={14} />
              </Link>
            </DataRow>
          ))}

          {myOpportunities.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              <FolderKanban size={20} className="mx-auto mb-3 text-slate-300" />
              No submitted opportunities yet. Start from a project detail page and submit an intake to create one.
            </div>
          )}
          {!showAll && myOpportunities.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton label="See All" onClick={() => setShowAll(true)} />
          )}
        </div>
      </section>
    </div>
  );
}
