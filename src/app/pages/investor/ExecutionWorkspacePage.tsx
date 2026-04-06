import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Send, X } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { ExplorerActionModal } from '../../components/ExplorerActionModal';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { getProjectStageLabel, getProjectStatusTone } from '../../utils/projectStatus';

type DetailAction = 'question' | 'meeting';
type MeetingType = 'Online' | 'Onsite';

const initialQuestionForm = {
  question: '',
};

const initialMeetingForm = {
  preferredDate: '',
  preferredTime: '',
  meetingType: 'Online' as MeetingType,
  participants: '',
  agenda: '',
  notes: '',
  assignedAgency: 'Department of Planning and Investment',
};

function getJobStatusMeta(status: string, t: (value: string) => string) {
  const normalizedStatus = status === 'complete' || status === 'completed' ? 'complete' : 'incomplete';
  return normalizedStatus === 'complete'
    ? { tone: 'success' as const, label: t('Completed') }
    : { tone: 'info' as const, label: t('Processing') };
}

function getDueDateMeta(status: string, dueDate: string, t: (value: string) => string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (status === 'complete' || status === 'completed') {
    return { tone: 'success' as const, label: `${t('Due date')}: ${dueDate}` };
  }
  if (daysUntilDue < 0) return { tone: 'danger' as const, label: `${t('Due date')}: ${dueDate} • ${t('Overdue')} ${Math.abs(daysUntilDue)} ${t('days')}` };
  if (daysUntilDue === 5 || daysUntilDue === 10) return { tone: 'warning' as const, label: `${t('Due date')}: ${dueDate} • ${t('Due in')} ${daysUntilDue} ${t('days')}` };
  return { tone: 'default' as const, label: `${t('Due date')}: ${dueDate}` };
}

export default function ExecutionWorkspacePage() {
  const { id } = useParams();
  const {
    language,
    projects,
    agencies,
    users,
    opportunities,
    projectJobs,
    getProjectProcessingSummary,
    activeInvestorCompany,
    createIssue,
    createServiceRequest,
    updateProject,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const [activeAction, setActiveAction] = useState<DetailAction | null>(null);
  const [actionStep, setActionStep] = useState<'form' | 'success'>('form');
  const [submittedReference, setSubmittedReference] = useState('');
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm);

  const joinedOpportunities = useMemo(
    () => opportunities.filter((item) => item.investorCompany === activeInvestorCompany),
    [activeInvestorCompany, opportunities],
  );
  const joinedProjectIds = Array.from(new Set(joinedOpportunities.map((item) => item.projectId)));
  const project = projects.find((item) => item.id === id);

  if (!project) {
    return <Navigate to="/investor/execution" replace />;
  }

  if (!joinedProjectIds.includes(project.id)) {
    return <Navigate to="/investor/execution" replace />;
  }

  const latestOpportunity = joinedOpportunities
    .filter((item) => item.projectId === project.id)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];
  const overviewRows = [
    ['Name', project.name],
    ['Sector', project.sector],
    ['Province', project.province],
    ['Location', project.location],
    ['Budget (USD M)', String(project.budget)],
    ['Minimum Investment (USD M)', String(project.minInvestment)],
    ['Timeline', project.timeline],
    ['Expected IRR', project.returnRate],
    ['Land Area', project.landArea],
    ['Project Stage', getProjectStageLabel(project.status, project.stage)],
  ];
  const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
  const processingSummary = getProjectProcessingSummary(project.id);
  const agencyOptions = useMemo(
    () => Array.from(new Set(['Department of Planning and Investment', 'Investor Operations Team', ...agencies.map((agency) => agency.name)])),
    [agencies],
  );

  function resetActionForms() {
    setQuestionForm(initialQuestionForm);
    setMeetingForm(initialMeetingForm);
  }

  function openActionModal(action: DetailAction) {
    setActiveAction(action);
    setActionStep('form');
    setSubmittedReference('');
    resetActionForms();
  }

  function closeActionModal() {
    setActiveAction(null);
    setActionStep('form');
    setSubmittedReference('');
    resetActionForms();
  }

  function handleQuestionSubmit() {
    if (!project || !questionForm.question.trim()) return;

    const questionText = questionForm.question.trim();
    const issueId = createIssue({
      projectId: project.id,
      projectName: project.name,
      title: `Investor Q&A thread: ${project.name}`,
      description: questionText,
      priority: 'high',
      status: 'open',
      assignedTo: 'Government Operator Desk',
      reportedBy: activeInvestorCompany,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Q&A',
    });

    updateProject(project.id, {
      qa: [
        ...(project.qa ?? []),
        {
          id: `qa${Date.now()}`,
          question: questionText,
          askedBy: activeInvestorCompany,
          askedAt: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
        },
      ],
    });

    setSubmittedReference(issueId);
    setActionStep('success');
  }

  function handleMeetingSubmit() {
    if (!project || !meetingForm.preferredDate || !meetingForm.preferredTime || !meetingForm.agenda.trim()) return;

    const requestId = createServiceRequest({
      serviceId: 'meeting-request',
      serviceName: 'Meeting Request',
      applicant: activeInvestorCompany,
      projectId: project.id,
      projectName: project.name,
      assignedAgency: meetingForm.assignedAgency,
      documents: [],
      notes: [
        `Preferred date: ${meetingForm.preferredDate}`,
        `Preferred time: ${meetingForm.preferredTime}`,
        `Meeting type: ${meetingForm.meetingType}`,
        `Participants: ${meetingForm.participants || '-'}`,
        `Agenda: ${meetingForm.agenda.trim()}`,
        meetingForm.notes.trim() ? `Additional notes: ${meetingForm.notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
    });

    setSubmittedReference(requestId);
    setActionStep('success');
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/investor/execution" className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t('Joined Projects')}
        </Link>
      </div>

      <section className="section-panel overflow-hidden p-0">
        <div className="relative h-80">
          <img src={project.image} alt={t(project.name)} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c2d4a]/92 via-[#0c2d4a]/64 to-[#0c2d4a]/18" />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone="info">{t(project.sector)}</StatusPill>
              <StatusPill tone="default">{t(project.province)}</StatusPill>
              <StatusPill tone={getProjectStatusTone(project.status, project.stage)}>
                {t(getProjectStageLabel(project.status, project.stage))}
              </StatusPill>
            </div>
            <h1 className="max-w-4xl text-white" style={{ fontSize: 'var(--text-3xl)' }}>
              {t(project.name)}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
              <MapPin size={14} />
              {t(project.location)}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openActionModal('meeting')}
                className="rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                {t('Request Meeting')}
              </button>
              <button
                type="button"
                onClick={() => openActionModal('question')}
                className="rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                {t('Ask Question')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{t('Overview')}</h2>
            <StatusPill tone="info">{t('Standard project record')}</StatusPill>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {overviewRows.map(([label, value]) => (
              <DataRow key={label} className={label === 'Name' || label === 'Location' ? 'md:col-span-2' : ''}>
                <div className="text-sm text-slate-500">{t(label)}</div>
                <div className="text-sm font-semibold text-slate-900">{t(value)}</div>
              </DataRow>
            ))}
            <div className="rounded-xl border border-border bg-slate-50 p-4 md:col-span-2">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Description')}</div>
              <div className="text-sm leading-7 text-slate-700">{t(project.description)}</div>
            </div>
          </div>
        </section>

        {latestOpportunity ? (
          <section className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Investor Details')}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DataRow>
                <div className="text-sm text-slate-500">{t('Representative')}</div>
                <div className="text-sm font-semibold text-slate-900">{latestOpportunity.investorName}</div>
              </DataRow>
              <DataRow>
                <div className="text-sm text-slate-500">{t('Organization')}</div>
                <div className="text-sm font-semibold text-slate-900">{latestOpportunity.investorCompany}</div>
              </DataRow>
              <DataRow>
                <div className="text-sm text-slate-500">{t('Country')}</div>
                <div className="text-sm font-semibold text-slate-900">{t(latestOpportunity.investorCountry)}</div>
              </DataRow>
              <DataRow>
                <div className="text-sm text-slate-500">{t('Investor Type')}</div>
                <div className="text-sm font-semibold text-slate-900">{t(latestOpportunity.investorType)}</div>
              </DataRow>
              <DataRow>
                <div className="text-sm text-slate-500">{t('Investment')}</div>
                <div className="text-sm font-semibold text-slate-900">${latestOpportunity.amount}M</div>
              </DataRow>
              <DataRow>
                <div className="text-sm text-slate-500">{t('Submitted At')}</div>
                <div className="text-sm font-semibold text-slate-900">{latestOpportunity.submittedAt}</div>
              </DataRow>
              <DataRow className="md:col-span-2">
                <div className="text-sm text-slate-500">{t('Last Updated At')}</div>
                <div className="text-sm font-semibold text-slate-900">{latestOpportunity.updatedAt}</div>
              </DataRow>
            </div>
          </section>
        ) : null}

        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{t('Project Jobs')}</h2>
            <StatusPill tone={processingSummary.completed === processingSummary.total && processingSummary.total > 0 ? 'success' : 'info'}>
              {processingSummary.completed}/{processingSummary.total}
            </StatusPill>
          </div>
          <div className="space-y-3">
            {projectJobItems.length > 0 ? (
              projectJobItems.map((job) => {
                const agency = agencies.find((item) => item.id === job.agencyId);
                const personInCharge = agency?.peopleInCharge?.find((person) => person.id === job.userId);
                const user = users.find((item) => item.id === job.userId);
                const responsibleUserName = personInCharge?.name ?? user?.name ?? '-';
                const statusMeta = getJobStatusMeta(job.status, t);
                const dueDateMeta = getDueDateMeta(job.status, job.dueDate, t);
                return (
                  <div key={job.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{t(job.title)}</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                            <StatusPill tone={dueDateMeta.tone}>{dueDateMeta.label}</StatusPill>
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{t(job.description)}</div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                          <div>{t('Coordinating Unit')}: {agency?.name ?? '-'}</div>
                          <div>{t('Responsible user')}: {responsibleUserName}</div>
                          <div>{t('Reminder timing')}: {job.reminderDaysBefore} {t('days before due date')}</div>
                        </div>
                        {job.note ? (
                          <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            {t(job.note)}
                          </div>
                        ) : null}
                        <div className="mt-3">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {t('Attachment list')}
                          </div>
                          <div className="space-y-2">
                            {(job.attachments ?? []).length > 0 ? (
                              (job.attachments ?? []).map((file) => (
                                <div
                                  key={`${file.fileName}-${file.lastUploadDate ?? ''}`}
                                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                                >
                                  <span className="truncate">{t(file.fileName)}</span>
                                  <span className="shrink-0">{file.lastUploadDate || '-'}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-500">-</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {t('No project jobs have been defined for this project yet.')}
              </div>
            )}
          </div>
        </section>
      </div>
      {activeAction && (
        <ExplorerActionModal
          onClose={closeActionModal}
          panelTitle={activeAction === 'question' ? t('Investor Question') : t('Meeting Request')}
          leftIcon={activeAction === 'question' ? <Send size={54} /> : <Calendar size={54} />}
          leftTitle={
            activeAction === 'question'
              ? t('Need clarification before moving forward?')
              : t('Need to coordinate the next decision step?')
          }
          leftDescription={
            activeAction === 'question'
              ? t('Send a structured question to the project response queue and keep the due-diligence conversation inside the investor workflow.')
              : t('Schedule a coordination request with the responsible public-sector team and capture the agenda for the next working session.')
          }
        >
          <div className="space-y-6">
            {actionStep === 'form' && activeAction === 'question' && (
              <>
                <div className="rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5">
                  <div className="text-[14px] font-medium text-[#1a2755]">{t('Associated Project')}</div>
                  <div className="mt-2 text-[18px] font-semibold text-[#191c1e]">{t(project.name)}</div>
                </div>
                <label className="block space-y-2">
                  <span className="text-[14px] font-medium text-[#1a2755]">{t('Investor Question')} <span className="text-[#f97316]">(*)</span></span>
                  <textarea
                    value={questionForm.question}
                    onChange={(event) => setQuestionForm({ question: event.target.value })}
                    rows={6}
                    className="min-h-[190px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                    placeholder={t('Enter a free-text investor question for due diligence or clarification.')}
                  />
                </label>
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleQuestionSubmit}
                    disabled={!questionForm.question.trim()}
                    className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    <Send size={20} />
                    {t('Submit question')}
                  </button>
                </div>
              </>
            )}

            {actionStep === 'form' && activeAction === 'meeting' && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Preferred date')} <span className="text-[#f97316]">(*)</span></span>
                    <input
                      type="date"
                      value={meetingForm.preferredDate}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, preferredDate: event.target.value }))}
                      className="h-14 w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Preferred time')} <span className="text-[#f97316]">(*)</span></span>
                    <input
                      type="time"
                      value={meetingForm.preferredTime}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, preferredTime: event.target.value }))}
                      className="h-14 w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Meeting type')}</span>
                    <select
                      value={meetingForm.meetingType}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, meetingType: event.target.value as MeetingType }))}
                      className="h-14 w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    >
                      <option value="Online">{t('Online')}</option>
                      <option value="Onsite">{t('Onsite')}</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Assigned agency')}</span>
                    <select
                      value={meetingForm.assignedAgency}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, assignedAgency: event.target.value }))}
                      className="h-14 w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    >
                      {agencyOptions.map((agencyName) => (
                        <option key={agencyName} value={agencyName}>{t(agencyName)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Participants')}</span>
                    <input
                      value={meetingForm.participants}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, participants: event.target.value }))}
                      className="h-14 w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                      placeholder={t('Example: CIO, project counsel, technical advisor')}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Agenda')} <span className="text-[#f97316]">(*)</span></span>
                    <textarea
                      value={meetingForm.agenda}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, agenda: event.target.value }))}
                      rows={5}
                      className="min-h-[170px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                      placeholder={t('Summarize the topics, questions, or approvals needed in the meeting.')}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Additional Notes')}</span>
                    <textarea
                      value={meetingForm.notes}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, notes: event.target.value }))}
                      rows={4}
                      className="min-h-[140px] w-full rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]"
                      placeholder={t('Add context for the coordination team, logistics, or supporting context.')}
                    />
                  </label>
                </div>
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleMeetingSubmit}
                    disabled={!meetingForm.preferredDate || !meetingForm.preferredTime || !meetingForm.agenda.trim()}
                    className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    <Calendar size={20} />
                    {t('Submit request')}
                  </button>
                </div>
              </>
            )}

            {actionStep === 'success' && (
              <div className="space-y-6">
                <div className="rounded-[24px] border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6">
                  <div className="text-[28px] font-semibold text-[#1a2755]">
                    {activeAction === 'question' ? t('Question submitted') : t('Meeting request submitted')}
                  </div>
                  <div className="mt-3 text-[16px] leading-7 text-[#617086]">
                    {t('This information has been routed to ITPC Communication Portal for follow-up.')}
                  </div>
                  {submittedReference ? (
                    <div className="mt-6 rounded-[18px] bg-white px-5 py-5">
                      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Reference')}</div>
                      <div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedReference}</div>
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="inline-flex min-w-[240px] items-center justify-center rounded-[18px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white"
                  >
                    {t('Close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </ExplorerActionModal>
      )}
    </div>
  );
}
