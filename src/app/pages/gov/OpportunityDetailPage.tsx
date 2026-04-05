import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, Building2, ChevronRight, ClipboardCheck, MessageSquare } from 'lucide-react';
import { getDemoUserIdForRole, useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { translateText } from '../../utils/localization';

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { opportunities, projects, updateOpportunity, language, role } = useApp();
  const t = (value: string) => translateText(value, language);
  const opportunity = opportunities.find((item) => item.id === id);
  const relatedProject = projects.find((project) => project.id === opportunity?.projectId);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const canAccessOpportunity = opportunity && relatedProject && (role !== 'gov_operator' || relatedProject.createdByUserId === getDemoUserIdForRole(role));
  const [activities, setActivities] = useState(opportunity?.activities ?? []);
  const [newNote, setNewNote] = useState('');

  if (!opportunity) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
          <AlertCircle size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('Opportunity not found')}</div>
          <Link to={`${workspaceBasePath}/opportunities`} className="app-button-secondary">
            {t('Back to pipeline')}
          </Link>
        </div>
      </div>
    );
  }

  if (!canAccessOpportunity) {
    return <Navigate to={`${workspaceBasePath}/opportunities`} replace />;
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    const activity = {
      id: `${Date.now()}`,
      type: 'note',
      description: newNote.trim(),
      by: 'Nguyen Van Anh',
      at: new Date().toLocaleString(),
    };
    setActivities((currentActivities) => [...currentActivities, activity]);
    updateOpportunity(opportunity.id, {}, activity);
    setNewNote('');
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to={`${workspaceBasePath}/opportunities`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t('Pipeline')}
        </Link>
        <ChevronRight size={12} />
        <span>{opportunity.investorCompany}</span>
      </div>

      <section className="section-panel p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{opportunity.investorCountry}</div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{opportunity.investorType}</div>
            </div>
            <div>
              <h1 className="section-heading mb-1">{opportunity.investorCompany}</h1>
              <p className="section-subheading">{opportunity.investorName} {t('leading a proposed')} ${opportunity.amount}M {t('commitment into')} {opportunity.projectName}.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: t('Investment'), value: `$${opportunity.amount}M` },
                { label: t('Submitted'), value: opportunity.submittedAt },
                { label: t('Last Updated'), value: opportunity.updatedAt },
                { label: t('Activities'), value: `${activities.length}` },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-slate-50 px-4 py-4">
                  <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 xl:items-end">
            <div className="w-full rounded-xl border border-border bg-slate-50 p-4 text-sm text-slate-600 xl:max-w-sm">
              {t('The operator flow keeps investor profile, internal notes, and project matching context in one place for coordinated follow-up.')}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <section className="section-panel p-5">
            <h2 className="section-heading mb-4">{t('Investor Intake Profile')}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [t('Representative'), opportunity.investorName],
                [t('Country'), opportunity.investorCountry],
                [t('Investor Type'), opportunity.investorType],
                [t('Investment Structure'), opportunity.intakeData.investmentStructure],
                [t('Timeline'), opportunity.intakeData.timeline],
                [t('Fund Source'), opportunity.intakeData.fundSource],
                [t('Experience'), opportunity.intakeData.experience],
                [t('Email'), opportunity.intakeData.contactEmail],
                [t('Phone'), opportunity.intakeData.contactPhone],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <h2 className="section-heading mb-4">{t('Project Match')}</h2>
            <div className="space-y-3">
              <DataRow className="items-start">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{opportunity.projectName}</div>
                    <div className="mt-1 text-xs text-slate-500">{relatedProject?.province ?? t('Province not available')}</div>
                  </div>
                </div>
                {relatedProject && (
                  <Link to={`${workspaceBasePath}/projects/${relatedProject.id}`} className="app-button-secondary">
                    {t('Open project')}
                  </Link>
                )}
              </DataRow>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                {opportunity.notes}
              </div>
            </div>
          </section>

          <section className="section-panel p-5">
            <h2 className="section-heading mb-4">{t('Operator Note')}</h2>
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(event) => setNewNote(event.target.value)}
                rows={4}
                className="app-input min-h-28"
                placeholder={t('Record meeting outcomes, due diligence findings, or escalation notes')}
              />
              <button type="button" onClick={handleAddNote} className="app-button">
                <MessageSquare size={14} />
                {t('Add activity note')}
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="section-panel p-5">
            <h2 className="section-heading mb-4">{t('Decision Support')}</h2>
            <div className="space-y-3">
              {[
                t('Validate investor capacity and fund source.'),
                t('Confirm project alignment with execution readiness.'),
                t('Capture all material changes before final decision.'),
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-border bg-slate-50 px-4 py-3">
                  <ClipboardCheck size={16} className="mt-0.5 text-sky-700" />
                  <div className="text-sm text-slate-700">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Activity Timeline')}</h2>
              <div className="text-sm font-medium text-slate-500">{activities.length} {t('events')}</div>
            </div>
            <div className="space-y-3">
              {[...activities].reverse().map((activity) => (
                <div key={activity.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{t(activity.description)}</div>
                  <div className="mt-1 text-xs text-slate-500">{activity.by} • {activity.at}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
