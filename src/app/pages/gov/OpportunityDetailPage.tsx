import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, ChevronRight, ClipboardCheck, MessageSquare, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

const stages = [
  { id: 'new', label: 'New Intake' },
  { id: 'review', label: 'Initial Review' },
  { id: 'due_diligence', label: 'Due Diligence' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'approved', label: 'Approved' },
];

function getStageTone(stage: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (stage === 'approved') return 'success';
  if (stage === 'negotiation') return 'warning';
  if (stage === 'due_diligence' || stage === 'review') return 'info';
  if (stage === 'rejected') return 'danger';
  return 'default';
}

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { opportunities, projects, updateOpportunity, language } = useApp();
  const t = (value: string) => translateText(value, language);
  const opportunity = opportunities.find((item) => item.id === id);
  const relatedProject = projects.find((project) => project.id === opportunity?.projectId);
  const [currentStage, setCurrentStage] = useState(opportunity?.stage ?? 'new');
  const [activities, setActivities] = useState(opportunity?.activities ?? []);
  const [newNote, setNewNote] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);

  const currentStageIndex = stages.findIndex((stage) => stage.id === currentStage);
  const approved = currentStage === 'approved';

  const stageSummary = useMemo(
    () =>
      stages.map((stage, index) => ({
        ...stage,
        complete: index < currentStageIndex || (approved && stage.id === 'approved'),
        current: stage.id === currentStage,
      })),
    [approved, currentStage, currentStageIndex],
  );

  if (!opportunity) {
    return (
      <div className="page-shell">
        <div className="section-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
          <AlertCircle size={36} className="text-slate-300" />
          <div className="text-base font-semibold text-slate-900">{t('Opportunity not found')}</div>
          <Link to="/gov/opportunities" className="app-button-secondary">
            {t('Back to pipeline')}
          </Link>
        </div>
      </div>
    );
  }

  function handleAdvanceStage() {
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1];
      setCurrentStage(nextStage.id);
      const activity = {
        id: `${Date.now()}`,
        type: 'stage_change',
        description: `Stage advanced to ${nextStage.label}.`,
        by: 'Nguyen Van Anh',
        at: new Date().toLocaleString(),
      };
      setActivities((currentActivities) => [...currentActivities, activity]);
      updateOpportunity(opportunity.id, { stage: nextStage.id }, activity);
    }
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

  function handleApprove() {
    setCurrentStage('approved');
    setShowApproveModal(false);
    const activity = {
      id: `${Date.now()}`,
      type: 'approved',
      description: 'Opportunity approved. Execution workspace created automatically.',
      by: 'Director Hoang Minh Duc',
      at: new Date().toLocaleString(),
    };
    setActivities((currentActivities) => [...currentActivities, activity]);
    updateOpportunity(opportunity.id, { stage: 'approved' }, activity);
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/gov/opportunities" className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
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
              <StatusPill tone={getStageTone(currentStage)}>{t(currentStage.replace('_', ' '))}</StatusPill>
              <StatusPill tone="info">{opportunity.investorCountry}</StatusPill>
              <StatusPill tone="default">{opportunity.investorType}</StatusPill>
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
            {!approved && currentStageIndex < stages.length - 1 && (
              <button type="button" onClick={handleAdvanceStage} className="app-button w-full xl:w-auto">
                <ChevronRight size={14} />
                {t('Advance stage')}
              </button>
            )}
            {!approved && currentStage === 'negotiation' && (
              <button type="button" onClick={() => setShowApproveModal(true)} className="app-button w-full bg-emerald-700 hover:bg-emerald-800 xl:w-auto">
                <ThumbsUp size={14} />
                {t('Approve opportunity')}
              </button>
            )}
            {approved && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={16} />
                {t('Approved and routed to execution')}
              </div>
            )}
            <div className="w-full rounded-xl border border-border bg-slate-50 p-4 text-sm text-slate-600 xl:max-w-sm">
              {t('The operator flow keeps approval intent, investor profile, and execution handoff in one place so the team does not lose context between stages.')}
            </div>
          </div>
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Decision Pipeline')}</h2>
          <StatusPill tone={getStageTone(currentStage)}>{t(stages[Math.max(currentStageIndex, 0)]?.label ?? 'Unknown stage')}</StatusPill>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {stageSummary.map((stage, index) => (
            <div
              key={stage.id}
              className={[
                'rounded-xl border px-4 py-4',
                stage.current ? 'border-sky-300 bg-sky-50' : stage.complete ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-card',
              ].join(' ')}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Stage')} {index + 1}</div>
              <div className="text-sm font-semibold text-slate-900">{t(stage.label)}</div>
              <div className="mt-2 text-xs text-slate-500">
                {stage.complete ? t('Completed') : stage.current ? t('Current focus') : t('Pending')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Investor Intake Profile')}</h2>
              <StatusPill tone="info">{t('Decision-ready')}</StatusPill>
            </div>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Project Match')}</h2>
              <StatusPill tone="warning">{t('Active review')}</StatusPill>
            </div>
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
                  <Link to={`/gov/projects/${relatedProject.id}`} className="app-button-secondary">
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Operator Note')}</h2>
              <StatusPill tone="default">{t('Activity log update')}</StatusPill>
            </div>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Decision Support')}</h2>
              <StatusPill tone="warning">{approved ? t('Approved') : t('Pending sign-off')}</StatusPill>
            </div>
            <div className="space-y-3">
              {[
                t('Validate investor capacity and fund source.'),
                t('Confirm project alignment with execution readiness.'),
                t('Capture all negotiation changes before approval.'),
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
              <StatusPill tone="info">{activities.length} {t('events')}</StatusPill>
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

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
                <ThumbsUp size={20} />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-900">{t('Approve this opportunity?')}</div>
                <div className="text-sm text-slate-500">{t('Execution workspace will be created for')} {opportunity.investorCompany}.</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowApproveModal(false)} className="app-button-secondary flex-1">
                {t('Cancel')}
              </button>
              <button type="button" onClick={handleApprove} className="app-button flex-1 bg-emerald-700 hover:bg-emerald-800">
                {t('Confirm approval')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
