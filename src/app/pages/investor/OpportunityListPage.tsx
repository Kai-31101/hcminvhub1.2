import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Calendar, DollarSign, FolderKanban } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';

function getStageTone(stage: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (stage === 'approved') return 'success';
  if (stage === 'negotiation') return 'warning';
  if (stage === 'due_diligence' || stage === 'review' || stage === 'new') return 'info';
  if (stage === 'rejected') return 'danger';
  return 'default';
}

export default function InvestorOpportunityListPage() {
  const { opportunities, activeInvestorCompany } = useApp();

  const myOpportunities = useMemo(
    () => opportunities.filter((opportunity) => opportunity.investorCompany === activeInvestorCompany),
    [activeInvestorCompany, opportunities],
  );

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">My Opportunities</h1>
        <p className="section-subheading">Track every submitted intake as it moves from review through due diligence, negotiation, and approval.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total', value: myOpportunities.length, tone: 'text-sky-700' },
          { label: 'Under Review', value: myOpportunities.filter((item) => ['new', 'review', 'due_diligence'].includes(item.stage)).length, tone: 'text-amber-700' },
          { label: 'Approved', value: myOpportunities.filter((item) => item.stage === 'approved').length, tone: 'text-emerald-700' },
          { label: 'Negotiation', value: myOpportunities.filter((item) => item.stage === 'negotiation').length, tone: 'text-slate-700' },
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
          {myOpportunities.map((opportunity) => (
            <DataRow key={opportunity.id}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">{opportunity.projectName}</div>
                  <StatusPill tone={getStageTone(opportunity.stage)}>{opportunity.stage.replace('_', ' ')}</StatusPill>
                </div>
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
        </div>
      </section>
    </div>
  );
}
