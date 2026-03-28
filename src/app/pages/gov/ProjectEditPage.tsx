import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { ProjectJob, RequiredDataAssignment, useApp } from '../../context/AppContext';
import { CompletionMeter } from '../../components/ui/completion-meter';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

type EditableStatus = 'incomplete' | 'complete';
type ReminderDays = 5 | 10;

function serializeAttachments(attachments?: Array<{ fileName: string; lastUploadDate?: string }>) {
  return (attachments ?? []).map((item) => `${item.fileName}${item.lastUploadDate ? ` | ${item.lastUploadDate}` : ''}`).join('\n');
}

function parseAttachmentList(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fileName, lastUploadDate] = line.split('|').map((part) => part.trim());
      return {
        fileName,
        lastUploadDate: lastUploadDate || '',
      };
    });
}

function getAlertMeta(
  item: Pick<RequiredDataAssignment, 'status' | 'dueDate'> | Pick<ProjectJob, 'status' | 'dueDate'>,
  t: (value: string) => string,
) {
  if (item.status === 'complete') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(item.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return { label: `${t('Overdue')} ${Math.abs(daysUntilDue)} ${t('days')}`, tone: 'danger' as const };
  if (daysUntilDue === 5 || daysUntilDue === 10) return { label: `${t('Due in')} ${daysUntilDue} ${t('days')}`, tone: 'warning' as const };
  return null;
}

export default function ProjectEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    projects,
    updateProject,
    language,
    agencies,
    users,
    requiredDataAssignments,
    getProjectDataCompletenessSummary,
    projectJobs,
    getProjectProcessingSummary,
    createRequiredDataAssignment,
    updateRequiredDataAssignment,
    deleteRequiredDataAssignment,
    createProjectJob,
    updateProjectJob,
    deleteProjectJob,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => ({
    name: project?.name ?? '',
    sector: project?.sector ?? '',
    province: project?.province ?? '',
    location: project?.location ?? '',
    budget: String(project?.budget ?? ''),
    minInvestment: String(project?.minInvestment ?? ''),
    timeline: project?.timeline ?? '',
    returnRate: project?.returnRate ?? '',
    landArea: project?.landArea ?? '',
    stage: project?.stage ?? '',
    description: project?.description ?? '',
  }));
  const [newAssignment, setNewAssignment] = useState({
    fieldName: '',
    agencyId: agencies[0]?.id ?? '',
    userId: users.find((item) => item.role === 'Agency User')?.id ?? '',
    status: 'incomplete' as EditableStatus,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminderDaysBefore: 10 as ReminderDays,
    note: '',
    attachmentListText: '',
  });
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    agencyId: agencies[0]?.id ?? '',
    userId: users.find((item) => item.role === 'Agency User')?.id ?? '',
    status: 'incomplete' as EditableStatus,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminderDaysBefore: 10 as ReminderDays,
    note: '',
    attachmentListText: '',
  });

  if (!project) {
    return <Navigate to="/gov/projects" replace />;
  }

  const activeProject = project;
  const projectAssignments = requiredDataAssignments.filter((item) => item.projectId === activeProject.id);
  const projectJobItems = projectJobs.filter((item) => item.projectId === activeProject.id);
  const dataSummary = getProjectDataCompletenessSummary(activeProject.id);
  const processingSummary = getProjectProcessingSummary(activeProject.id);
  const activeAgencyUsers = users.filter((item) => item.role === 'Agency User' && item.status === 'active');
  const isDataQualityMode = searchParams.get('focus') === 'data-quality';

  const missingDataItems = [
    !projectAssignments.length ? t('Define at least one required data item and assign an owner.') : null,
    projectAssignments.some((item) => item.status !== 'complete') ? t('Complete all required data items before final publication review.') : null,
    !projectJobItems.length ? t('Define at least one project job to establish the delivery process.') : null,
    projectJobItems.some((item) => item.status !== 'complete') ? t('Close outstanding project jobs to reach full processing readiness.') : null,
    !activeProject.documents.length ? t('Upload at least one supporting document.') : null,
  ].filter(Boolean) as string[];

  function getFilteredUsers(agencyId: string) {
    return activeAgencyUsers.filter((item) => item.organization.includes(agencies.find((agency) => agency.id === agencyId)?.shortName ?? ''));
  }

  function handleChange(field: keyof typeof form, value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    updateProject(activeProject.id, {
      ...activeProject,
      ...form,
      budget: Number(form.budget || 0),
      minInvestment: Number(form.minInvestment || 0),
      status: activeProject.status === 'draft' ? 'review' : activeProject.status,
    });
    setSaved(true);
  }

  function handleCreateAssignment() {
    if (!newAssignment.fieldName.trim() || !newAssignment.agencyId || !newAssignment.userId) return;
    createRequiredDataAssignment({
      projectId: activeProject.id,
      fieldName: newAssignment.fieldName.trim(),
      agencyId: newAssignment.agencyId,
      userId: newAssignment.userId,
      status: newAssignment.status,
      dueDate: newAssignment.dueDate,
      reminderDaysBefore: newAssignment.reminderDaysBefore,
      note: newAssignment.note.trim(),
      attachments: parseAttachmentList(newAssignment.attachmentListText),
    });
    setSaved(false);
    setNewAssignment({
      fieldName: '',
      agencyId: agencies[0]?.id ?? '',
      userId: getFilteredUsers(agencies[0]?.id ?? '')[0]?.id ?? activeAgencyUsers[0]?.id ?? '',
      status: 'incomplete',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminderDaysBefore: 10,
      note: '',
      attachmentListText: '',
    });
  }

  function handleCreateJob() {
    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.agencyId || !newJob.userId) return;
    createProjectJob({
      projectId: activeProject.id,
      title: newJob.title.trim(),
      description: newJob.description.trim(),
      agencyId: newJob.agencyId,
      userId: newJob.userId,
      status: newJob.status,
      dueDate: newJob.dueDate,
      reminderDaysBefore: newJob.reminderDaysBefore,
      note: newJob.note.trim(),
      attachments: parseAttachmentList(newJob.attachmentListText),
    });
    setSaved(false);
    setNewJob({
      title: '',
      description: '',
      agencyId: agencies[0]?.id ?? '',
      userId: getFilteredUsers(agencies[0]?.id ?? '')[0]?.id ?? activeAgencyUsers[0]?.id ?? '',
      status: 'incomplete',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminderDaysBefore: 10,
      note: '',
      attachmentListText: '',
    });
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to={`/gov/projects/${activeProject.id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t('Back to project')}
        </Link>
      </div>

      <section className="section-panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <h1 className="section-heading mb-0">{t('Edit Project')}</h1>
            <p className="section-subheading">{t('Manage one standardized project record with overview data, required data ownership, and delivery jobs.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/gov/projects/${activeProject.id}`)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              form="project-edit-form"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]"
            >
              <Save size={14} />
              {t('Save changes')}
            </button>
          </div>
        </div>
      </section>

      {isDataQualityMode && (
        <section className="section-panel border-amber-200 bg-amber-50/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-amber-950">{t('Data Quality Fix Mode')}</h2>
            <StatusPill tone="warning">{missingDataItems.length} {t('issues')}</StatusPill>
          </div>
          <div className="space-y-3">
            {missingDataItems.map((item) => (
              <DataRow key={item} className="border-amber-200 bg-white">
                <AlertCircle size={14} className="text-amber-700" />
                <div className="flex-1 text-sm text-slate-700">{item}</div>
              </DataRow>
            ))}
          </div>
        </section>
      )}

      <form id="project-edit-form" onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
          <section className="section-panel overflow-hidden p-0">
            <div className="relative h-64 overflow-hidden">
              <img src={activeProject.image} alt={activeProject.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c2d4a]/80 via-[#0c2d4a]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">{t('Overview')}</div>
                  <div className="text-2xl font-bold text-white">{form.name || activeProject.name}</div>
                </div>
                <StatusPill tone="default">{t(form.stage || activeProject.stage)}</StatusPill>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Overview')}</h2>
                <StatusPill tone="info">{t('Single project record')}</StatusPill>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Name', key: 'name', full: true },
                  { label: 'Sector', key: 'sector' },
                  { label: 'Province', key: 'province' },
                  { label: 'Location', key: 'location', full: true },
                  { label: 'Budget (USD M)', key: 'budget' },
                  { label: 'Minimum Investment (USD M)', key: 'minInvestment' },
                  { label: 'Timeline', key: 'timeline' },
                  { label: 'Expected IRR', key: 'returnRate' },
                  { label: 'Land Area', key: 'landArea' },
                  { label: 'Project Stage', key: 'stage' },
                ].map((field) => (
                  <label key={field.key} className={`space-y-2 ${field.full ? 'md:col-span-2' : ''}`}>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(field.label)}</span>
                    <input
                      value={form[field.key as keyof typeof form]}
                      onChange={(event) => handleChange(field.key as keyof typeof form, event.target.value)}
                      className="app-input"
                    />
                  </label>
                ))}
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Description')}</span>
                  <textarea
                    rows={7}
                    value={form.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    className="app-input min-h-36"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="section-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Data Completeness')}</h2>
                <StatusPill tone={dataSummary.completed === dataSummary.total && dataSummary.total > 0 ? 'success' : 'warning'}>
                  {dataSummary.completed}/{dataSummary.total}
                </StatusPill>
              </div>
              <CompletionMeter value={dataSummary.percentage} />
              <div className="mt-3 text-sm text-slate-600">
                {dataSummary.completed}/{dataSummary.total} {t('required data items completed')}
              </div>
            </section>

            <section className="section-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Project Processing')}</h2>
                <StatusPill tone={processingSummary.completed === processingSummary.total && processingSummary.total > 0 ? 'success' : 'info'}>
                  {processingSummary.completed}/{processingSummary.total}
                </StatusPill>
              </div>
              <CompletionMeter value={processingSummary.percentage} />
              <div className="mt-3 text-sm text-slate-600">
                {processingSummary.completed}/{processingSummary.total} {t('required jobs completed')}
              </div>
            </section>
            <section className="section-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Current Snapshot')}</h2>
                <StatusPill tone={saved ? 'success' : 'default'}>{saved ? t('Saved') : t('Draft')}</StatusPill>
              </div>
              <div className="space-y-3">
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Status')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(activeProject.status.replace('_', ' '))}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Published Date')}</div>
                  <div className="text-sm font-semibold text-slate-900">{activeProject.publishedAt || t('Not published yet')}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{t('Documents')}</div>
                  <div className="text-sm font-semibold text-slate-900">{activeProject.documents.length}</div>
                </DataRow>
              </div>
            </section>

            <section className="section-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{t('Save Status')}</h2>
                <StatusPill tone={saved ? 'success' : 'default'}>{saved ? t('Saved') : t('Draft')}</StatusPill>
              </div>
              {saved ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">{t('Changes saved to shared app state')}</div>
                      <div className="mt-1 text-emerald-700">{t('Project overview, required data, and processing jobs now stay aligned across government and investor views during this local session.')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">{t('Update the overview data and save when you are ready to publish the new baseline.')}</div>
              )}
            </section>
          </div>
        </div>

        <section className="section-panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-heading mb-1">{t('Required Data Ownership')}</h2>
              <p className="section-subheading">{t('Define the required project data, assign the PIC, track due dates, and keep the latest supporting attachment visible.')}</p>
            </div>
            <StatusPill tone={dataSummary.completed === dataSummary.total && dataSummary.total > 0 ? 'success' : 'warning'}>
              {dataSummary.completed}/{dataSummary.total}
            </StatusPill>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Required data items')}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{projectAssignments.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{t('Completed')}</div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">{dataSummary.completed}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{t('Open items')}</div>
              <div className="mt-2 text-2xl font-bold text-amber-700">{Math.max(dataSummary.total - dataSummary.completed, 0)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {projectAssignments.length > 0 &&
              projectAssignments.map((assignment) => {
                const assignmentAgency = agencies.find((item) => item.id === assignment.agencyId);
                const assignmentUser = users.find((item) => item.id === assignment.userId);
                const filteredUsers = getFilteredUsers(assignment.agencyId);
                const assignmentAlert = getAlertMeta(assignment, t);
                return (
                  <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{assignment.fieldName}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{assignmentAgency?.shortName ?? '-'}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{assignmentUser?.name ?? '-'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={assignment.status === 'complete' ? 'success' : 'warning'}>{t(assignment.status)}</StatusPill>
                        {assignmentAlert ? <StatusPill tone={assignmentAlert.tone}>{assignmentAlert.label}</StatusPill> : null}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Required data')}</span>
                        <input value={assignment.fieldName} onChange={(event) => updateRequiredDataAssignment(assignment.id, { fieldName: event.target.value })} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible agency')}</span>
                        <select
                          value={assignment.agencyId}
                          onChange={(event) => {
                            const nextAgencyId = event.target.value;
                            const nextUserId = getFilteredUsers(nextAgencyId)[0]?.id ?? '';
                            updateRequiredDataAssignment(assignment.id, { agencyId: nextAgencyId, userId: nextUserId });
                          }}
                          className="app-input"
                        >
                          {agencies.filter((item) => item.status === 'active').map((agency) => (
                            <option key={agency.id} value={agency.id}>
                              {agency.shortName} - {agency.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible user')}</span>
                        <select value={assignment.userId} onChange={(event) => updateRequiredDataAssignment(assignment.id, { userId: event.target.value })} className="app-input">
                          {filteredUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.organization}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assignment status')}</span>
                        <select value={assignment.status} onChange={(event) => updateRequiredDataAssignment(assignment.id, { status: event.target.value as EditableStatus })} className="app-input">
                          <option value="incomplete">{t('incomplete')}</option>
                          <option value="complete">{t('complete')}</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                        <input type="date" value={assignment.dueDate} onChange={(event) => updateRequiredDataAssignment(assignment.id, { dueDate: event.target.value })} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                        <select value={assignment.reminderDaysBefore} onChange={(event) => updateRequiredDataAssignment(assignment.id, { reminderDaysBefore: Number(event.target.value) as ReminderDays })} className="app-input">
                          <option value="5">{t('5 days before due date')}</option>
                          <option value="10">{t('10 days before due date')}</option>
                        </select>
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Attachment list')}</span>
                        <textarea
                          rows={4}
                          value={serializeAttachments(assignment.attachments)}
                          onChange={(event) => updateRequiredDataAssignment(assignment.id, { attachments: parseAttachmentList(event.target.value) })}
                          className="app-input min-h-28"
                          placeholder={t('One file per line: file name | YYYY-MM-DD')}
                        />
                        {(assignment.attachments ?? []).length > 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Current attachments')}</div>
                            <div className="space-y-2">
                              {(assignment.attachments ?? []).map((file) => (
                                <div key={`${file.fileName}-${file.lastUploadDate ?? ''}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                                  <span className="truncate">{file.fileName}</span>
                                  <span className="shrink-0 text-xs text-slate-500">{file.lastUploadDate || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </label>
                      <label className="space-y-2 md:col-span-2 xl:col-span-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Owner note')}</span>
                        <textarea rows={3} value={assignment.note ?? ''} onChange={(event) => updateRequiredDataAssignment(assignment.id, { note: event.target.value })} className="app-input min-h-24" />
                      </label>
                      <div className="flex items-end justify-end xl:justify-end">
                        <button type="button" onClick={() => deleteRequiredDataAssignment(assignment.id)} className="app-button-secondary">
                          <Trash2 size={14} />
                          {t('Remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t('Add required data item')}</div>
                <div className="mt-1 text-xs text-slate-500">{t('Create a new required-data row and assign the owner before publication review.')}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{t('New row')}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Required data')}</span>
                <input value={newAssignment.fieldName} onChange={(event) => setNewAssignment((current) => ({ ...current, fieldName: event.target.value }))} className="app-input" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible agency')}</span>
                <select
                  value={newAssignment.agencyId}
                  onChange={(event) => {
                    const nextAgencyId = event.target.value;
                    const nextUserId = getFilteredUsers(nextAgencyId)[0]?.id ?? '';
                    setNewAssignment((current) => ({ ...current, agencyId: nextAgencyId, userId: nextUserId }));
                  }}
                  className="app-input"
                >
                  {agencies.filter((item) => item.status === 'active').map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.shortName} - {agency.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible user')}</span>
                <select value={newAssignment.userId} onChange={(event) => setNewAssignment((current) => ({ ...current, userId: event.target.value }))} className="app-input">
                  {getFilteredUsers(newAssignment.agencyId).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.organization}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assignment status')}</span>
                <select value={newAssignment.status} onChange={(event) => setNewAssignment((current) => ({ ...current, status: event.target.value as EditableStatus }))} className="app-input">
                  <option value="incomplete">{t('incomplete')}</option>
                  <option value="complete">{t('complete')}</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                <input type="date" value={newAssignment.dueDate} onChange={(event) => setNewAssignment((current) => ({ ...current, dueDate: event.target.value }))} className="app-input" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                <select value={newAssignment.reminderDaysBefore} onChange={(event) => setNewAssignment((current) => ({ ...current, reminderDaysBefore: Number(event.target.value) as ReminderDays }))} className="app-input">
                  <option value="5">{t('5 days before due date')}</option>
                  <option value="10">{t('10 days before due date')}</option>
                </select>
              </label>
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Attachment list')}</span>
                <textarea
                  rows={4}
                  value={newAssignment.attachmentListText}
                  onChange={(event) => setNewAssignment((current) => ({ ...current, attachmentListText: event.target.value }))}
                  className="app-input min-h-28"
                  placeholder={t('One file per line: file name | YYYY-MM-DD')}
                />
              </label>
              <label className="space-y-2 md:col-span-2 xl:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Owner note')}</span>
                <textarea rows={3} value={newAssignment.note} onChange={(event) => setNewAssignment((current) => ({ ...current, note: event.target.value }))} className="app-input min-h-24" />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleCreateAssignment}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]"
              >
                <Plus size={14} />
                {t('Add required data item')}
              </button>
            </div>
          </div>
        </section>

        <section className="section-panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-heading mb-1">{t('Project Jobs')}</h2>
              <p className="section-subheading">{t('Track the delivery process with accountable jobs, due dates, notes, and the latest uploaded work product.')}</p>
            </div>
            <StatusPill tone={processingSummary.completed === processingSummary.total && processingSummary.total > 0 ? 'success' : 'info'}>
              {processingSummary.completed}/{processingSummary.total}
            </StatusPill>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project jobs')}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{projectJobItems.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{t('Completed')}</div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">{processingSummary.completed}</div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">{t('Open items')}</div>
              <div className="mt-2 text-2xl font-bold text-sky-700">{Math.max(processingSummary.total - processingSummary.completed, 0)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {projectJobItems.length > 0 &&
              projectJobItems.map((job) => {
                const jobAgency = agencies.find((item) => item.id === job.agencyId);
                const jobUser = users.find((item) => item.id === job.userId);
                const filteredUsers = getFilteredUsers(job.agencyId);
                const jobAlert = getAlertMeta(job, t);
                return (
                  <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{job.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{job.description}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{jobAgency?.shortName ?? '-'}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{jobUser?.name ?? '-'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={job.status === 'complete' ? 'success' : 'warning'}>{t(job.status)}</StatusPill>
                        {jobAlert ? <StatusPill tone={jobAlert.tone}>{jobAlert.label}</StatusPill> : null}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Title')}</span>
                        <input value={job.title} onChange={(event) => updateProjectJob(job.id, { title: event.target.value })} className="app-input" />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Description')}</span>
                        <input value={job.description} onChange={(event) => updateProjectJob(job.id, { description: event.target.value })} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible agency')}</span>
                        <select
                          value={job.agencyId}
                          onChange={(event) => {
                            const nextAgencyId = event.target.value;
                            const nextUserId = getFilteredUsers(nextAgencyId)[0]?.id ?? '';
                            updateProjectJob(job.id, { agencyId: nextAgencyId, userId: nextUserId });
                          }}
                          className="app-input"
                        >
                          {agencies.filter((item) => item.status === 'active').map((agency) => (
                            <option key={agency.id} value={agency.id}>
                              {agency.shortName} - {agency.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible user')}</span>
                        <select value={job.userId} onChange={(event) => updateProjectJob(job.id, { userId: event.target.value })} className="app-input">
                          {filteredUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.organization}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assignment status')}</span>
                        <select value={job.status} onChange={(event) => updateProjectJob(job.id, { status: event.target.value as EditableStatus })} className="app-input">
                          <option value="incomplete">{t('incomplete')}</option>
                          <option value="complete">{t('complete')}</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                        <input type="date" value={job.dueDate} onChange={(event) => updateProjectJob(job.id, { dueDate: event.target.value })} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                        <select value={job.reminderDaysBefore} onChange={(event) => updateProjectJob(job.id, { reminderDaysBefore: Number(event.target.value) as ReminderDays })} className="app-input">
                          <option value="5">{t('5 days before due date')}</option>
                          <option value="10">{t('10 days before due date')}</option>
                        </select>
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Attachment list')}</span>
                        <textarea
                          rows={4}
                          value={serializeAttachments(job.attachments)}
                          onChange={(event) => updateProjectJob(job.id, { attachments: parseAttachmentList(event.target.value) })}
                          className="app-input min-h-28"
                          placeholder={t('One file per line: file name | YYYY-MM-DD')}
                        />
                        {(job.attachments ?? []).length > 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Current attachments')}</div>
                            <div className="space-y-2">
                              {(job.attachments ?? []).map((file) => (
                                <div key={`${file.fileName}-${file.lastUploadDate ?? ''}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                                  <span className="truncate">{file.fileName}</span>
                                  <span className="shrink-0 text-xs text-slate-500">{file.lastUploadDate || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </label>
                      <label className="space-y-2 md:col-span-2 xl:col-span-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Owner note')}</span>
                        <textarea rows={3} value={job.note ?? ''} onChange={(event) => updateProjectJob(job.id, { note: event.target.value })} className="app-input min-h-24" />
                      </label>
                      <div className="flex items-end justify-end">
                        <button type="button" onClick={() => deleteProjectJob(job.id)} className="app-button-secondary">
                          <Trash2 size={14} />
                          {t('Remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t('Add project job')}</div>
                <div className="mt-1 text-xs text-slate-500">{t('Create a delivery job with a due date, owner, and latest uploaded work product.')}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{t('New row')}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Title')}</span>
                <input value={newJob.title} onChange={(event) => setNewJob((current) => ({ ...current, title: event.target.value }))} className="app-input" />
              </label>
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Description')}</span>
                <input value={newJob.description} onChange={(event) => setNewJob((current) => ({ ...current, description: event.target.value }))} className="app-input" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible agency')}</span>
                <select
                  value={newJob.agencyId}
                  onChange={(event) => {
                    const nextAgencyId = event.target.value;
                    const nextUserId = getFilteredUsers(nextAgencyId)[0]?.id ?? '';
                    setNewJob((current) => ({ ...current, agencyId: nextAgencyId, userId: nextUserId }));
                  }}
                  className="app-input"
                >
                  {agencies.filter((item) => item.status === 'active').map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.shortName} - {agency.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Responsible user')}</span>
                <select value={newJob.userId} onChange={(event) => setNewJob((current) => ({ ...current, userId: event.target.value }))} className="app-input">
                  {getFilteredUsers(newJob.agencyId).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.organization}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assignment status')}</span>
                <select value={newJob.status} onChange={(event) => setNewJob((current) => ({ ...current, status: event.target.value as EditableStatus }))} className="app-input">
                  <option value="incomplete">{t('incomplete')}</option>
                  <option value="complete">{t('complete')}</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                <input type="date" value={newJob.dueDate} onChange={(event) => setNewJob((current) => ({ ...current, dueDate: event.target.value }))} className="app-input" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                <select value={newJob.reminderDaysBefore} onChange={(event) => setNewJob((current) => ({ ...current, reminderDaysBefore: Number(event.target.value) as ReminderDays }))} className="app-input">
                  <option value="5">{t('5 days before due date')}</option>
                  <option value="10">{t('10 days before due date')}</option>
                </select>
              </label>
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Attachment list')}</span>
                <textarea
                  rows={4}
                  value={newJob.attachmentListText}
                  onChange={(event) => setNewJob((current) => ({ ...current, attachmentListText: event.target.value }))}
                  className="app-input min-h-28"
                  placeholder={t('One file per line: file name | YYYY-MM-DD')}
                />
              </label>
              <label className="space-y-2 md:col-span-2 xl:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Owner note')}</span>
                <textarea rows={3} value={newJob.note} onChange={(event) => setNewJob((current) => ({ ...current, note: event.target.value }))} className="app-input min-h-24" />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleCreateJob}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]"
              >
                <Plus size={14} />
                {t('Add project job')}
              </button>
            </div>
          </div>
        </section>

        <section className="section-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{t('Supporting Documents')}</h2>
            <StatusPill tone={activeProject.documents.length > 0 ? 'success' : 'warning'}>{activeProject.documents.length}</StatusPill>
          </div>
          <div className="space-y-3">
            {activeProject.documents.length > 0 ? (
              activeProject.documents.map((document) => (
                <DataRow key={document.id}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{document.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{document.type} / {document.size}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">{document.uploadedAt}</div>
                </DataRow>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {t('No supporting documents uploaded yet.')}
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
