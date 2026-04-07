import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ChevronDown, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { getDemoUserIdForRole, ProjectJob, useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { normalizeProjectStatus, PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';

type EditableStatus = 'incomplete' | 'complete';
type ReminderDays = 5 | 10;
const PROJECT_JOB_STATUS_OPTIONS: Array<{ value: EditableStatus; label: 'Processing' | 'Completed' }> = [
  { value: 'incomplete', label: 'Processing' },
  { value: 'complete', label: 'Completed' },
];

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

function filesToAttachments(files: FileList | null) {
  const uploadedAt = new Date().toISOString().split('T')[0];
  return Array.from(files ?? []).map((file) => ({
    fileName: file.name,
    lastUploadDate: uploadedAt,
  }));
}

function getAlertMeta(
  item: Pick<ProjectJob, 'status' | 'dueDate'>,
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
    requiredDataAssignments,
    projectJobs,
    getProjectProcessingSummary,
    createProjectJob,
    updateProjectJob,
    deleteProjectJob,
    role,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const project = useMemo(() => projects.find((item) => item.id === id), [id, projects]);
  const workspaceBasePath = role === 'agency' ? '/agency' : '/gov';
  const canAccessProject = project && role !== 'agency' && (role !== 'gov_operator' || project.createdByUserId === getDemoUserIdForRole(role));
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
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    agencyId: agencies[0]?.id ?? '',
    userId: agencies[0]?.peopleInCharge?.[0]?.id ?? '',
    status: 'incomplete' as EditableStatus,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminderDaysBefore: 10 as ReminderDays,
    note: '',
    attachmentListText: '',
  });
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const [openJobStatusMenuId, setOpenJobStatusMenuId] = useState<string | null>(null);
  const [isNewJobStatusMenuOpen, setIsNewJobStatusMenuOpen] = useState(false);

  if (!project || !canAccessProject) {
    return <Navigate to={`${workspaceBasePath}/projects`} replace />;
  }

  const activeProject = project;
  const projectAssignments = requiredDataAssignments.filter((item) => item.projectId === activeProject.id);
  const projectJobItems = projectJobs.filter((item) => item.projectId === activeProject.id);
  const processingSummary = getProjectProcessingSummary(activeProject.id);
  const isDataQualityMode = searchParams.get('focus') === 'data-quality';
  const projectJobFieldClass = 'app-input !border-slate-400 focus:!border-slate-500';
  const currentProjectStatus = normalizeProjectStatus(form.stage || activeProject.stage, form.stage || activeProject.stage);
  const lockProjectJobDueDates = currentProjectStatus !== 'draft';
  const projectStageBadgeClassMap = {
    draft: 'border-slate-300 bg-slate-100 text-slate-800 focus:border-slate-200 focus:ring-slate-200/70',
    published: 'border-amber-200 bg-amber-100 text-amber-900 focus:border-amber-100 focus:ring-amber-200/70',
    processing: 'border-sky-200 bg-sky-100 text-sky-900 focus:border-sky-100 focus:ring-sky-200/70',
    completed: 'border-emerald-200 bg-emerald-100 text-emerald-900 focus:border-emerald-100 focus:ring-emerald-200/70',
    cancelled: 'border-red-200 bg-red-100 text-red-900 focus:border-red-100 focus:ring-red-200/70',
  } as const;
  const projectStageSelectClass = projectStageBadgeClassMap[currentProjectStatus];
  const projectJobStatusBadgeClassMap: Record<EditableStatus, string> = {
    incomplete: 'border-sky-200 bg-sky-100 text-sky-900 focus:border-sky-100 focus:ring-sky-200/70',
    complete: 'border-emerald-200 bg-emerald-100 text-emerald-900 focus:border-emerald-100 focus:ring-emerald-200/70',
  };

  const missingDataItems = [
    !projectAssignments.length ? t('Define at least one required data item and assign a coordinating unit.') : null,
    projectAssignments.some((item) => item.status !== 'complete') ? t('Complete all required data items before final publication review.') : null,
    !projectJobItems.length ? t('Define at least one project job to establish the delivery process.') : null,
    projectJobItems.some((item) => item.status !== 'complete') ? t('Close outstanding project jobs to reach full processing readiness.') : null,
    !activeProject.documents.length ? t('Upload at least one supporting document.') : null,
  ].filter(Boolean) as string[];

  function getAgencyPeopleInCharge(agencyId: string) {
    return agencies.find((agency) => agency.id === agencyId)?.peopleInCharge ?? [];
  }

  function handleChange(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    updateProject(activeProject.id, {
      ...activeProject,
      ...form,
      budget: Number(form.budget || 0),
      minInvestment: Number(form.minInvestment || 0),
      status: normalizeProjectStatus(form.stage, form.stage),
      publishedAt:
        normalizeProjectStatus(form.stage, form.stage) === 'published'
          ? activeProject.publishedAt || new Date().toISOString().split('T')[0]
          : activeProject.publishedAt,
    });
  }

  function handleCreateJob() {
    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.agencyId || !selectedPerson?.id) return;
    createProjectJob({
      projectId: activeProject.id,
      title: newJob.title.trim(),
      description: newJob.description.trim(),
      agencyId: newJob.agencyId,
      userId: selectedPerson.id,
      status: newJob.status,
      dueDate: newJob.dueDate,
      reminderDaysBefore: newJob.reminderDaysBefore,
      note: newJob.note.trim(),
      attachments: parseAttachmentList(newJob.attachmentListText),
    });
    setNewJob({
      title: '',
      description: '',
      agencyId: agencies[0]?.id ?? '',
      userId: agencies[0]?.peopleInCharge?.[0]?.id ?? '',
      status: 'incomplete',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminderDaysBefore: 10,
      note: '',
      attachmentListText: '',
    });
  }

  function getProjectJobStatusLabel(status: EditableStatus) {
    return t(PROJECT_JOB_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Processing');
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to={`${workspaceBasePath}/projects/${activeProject.id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t('Back to project')}
        </Link>
      </div>

      <section className="section-panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <h1 className="section-heading mb-0">{t('Edit Project')}</h1>
            <p className="section-subheading">{t('Manage one standardized project record with overview data and delivery jobs.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`${workspaceBasePath}/projects/${activeProject.id}`)}
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
        <div>
          <section className="section-panel overflow-visible p-0">
            <div className="relative h-64">
              <div className="absolute inset-0 overflow-hidden">
                <img src={activeProject.image} alt={activeProject.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c2d4a]/80 via-[#0c2d4a]/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">{t('Overview')}</div>
                  <div className="text-2xl font-bold text-white">{form.name || activeProject.name}</div>
                </div>
                <div className="relative">
                  <span className="sr-only">{t('Project Stage')}</span>
                  <button
                    type="button"
                    onClick={() => setIsStageMenuOpen((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus:ring-2 ${projectStageSelectClass}`}
                    aria-haspopup="listbox"
                    aria-expanded={isStageMenuOpen}
                  >
                    <span>{t(form.stage || activeProject.stage)}</span>
                    <ChevronDown size={16} />
                  </button>
                  {isStageMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Stage')}</div>
                      <div className="space-y-1" role="listbox" aria-label={t('Project Stage')}>
                        {PROJECT_STAGE_OPTIONS.map((stage) => {
                          const stageStatus = normalizeProjectStatus(stage, stage);
                          const isSelected = form.stage === stage;
                          return (
                            <button
                              key={stage}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                handleChange('stage', stage);
                                setIsStageMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                            >
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${projectStageBadgeClassMap[stageStatus]}`}>
                                {t(stage)}
                              </span>
                              {isSelected ? <Check size={16} className="text-slate-500" /> : <span className="w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Stage')}</span>
                  <select value={form.stage} onChange={(event) => handleChange('stage', event.target.value)} className="app-input">
                    {PROJECT_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {t(stage)}
                      </option>
                    ))}
                  </select>
                </label>
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

        </div>

        <section className="section-panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-heading mb-1">{t('Project Jobs')}</h2>
              <p className="section-subheading">{t('Track the delivery process with coordinated jobs, due dates, notes, and the latest uploaded work product.')}</p>
            </div>
            <StatusPill tone={processingSummary.completed === processingSummary.total && processingSummary.total > 0 ? 'success' : 'info'}>
              {processingSummary.completed}/{processingSummary.total}
            </StatusPill>
          </div>

          <div className="space-y-4">
            {projectJobItems.length > 0 &&
              projectJobItems.map((job) => {
                const jobAgency = agencies.find((item) => item.id === job.agencyId);
                const jobAlert = getAlertMeta(job, t);
                return (
                  <div key={job.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 pb-16 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{job.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{job.description}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{jobAgency?.shortName ?? '-'}</span>
                        </div>
                      </div>
                      <div className="flex min-w-[12rem] flex-col items-end gap-2">
                        {jobAlert ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <StatusPill tone={jobAlert.tone}>{jobAlert.label}</StatusPill>
                          </div>
                        ) : null}
                        <div className="w-full max-w-xs space-y-2">
                          <span className="block text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Status')}</span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenJobStatusMenuId((current) => (current === job.id ? null : job.id))}
                              className={`inline-flex w-full items-center justify-between gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus:ring-2 ${projectJobStatusBadgeClassMap[job.status as EditableStatus]}`}
                              aria-haspopup="listbox"
                              aria-expanded={openJobStatusMenuId === job.id}
                            >
                              <span>{getProjectJobStatusLabel(job.status as EditableStatus)}</span>
                              <ChevronDown size={16} />
                            </button>
                            {openJobStatusMenuId === job.id && (
                              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                                <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Status')}</div>
                                <div className="space-y-1" role="listbox" aria-label={t('Job Status')}>
                                  {PROJECT_JOB_STATUS_OPTIONS.map((option) => {
                                    const isSelected = job.status === option.value;
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                          updateProjectJob(job.id, { status: option.value });
                                          setOpenJobStatusMenuId(null);
                                        }}
                                        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                                      >
                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${projectJobStatusBadgeClassMap[option.value]}`}>
                                          {t(option.label)}
                                        </span>
                                        {isSelected ? <Check size={16} className="text-slate-500" /> : <span className="w-4" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Title')}</span>
                        <input value={job.title} onChange={(event) => updateProjectJob(job.id, { title: event.target.value })} className={projectJobFieldClass} />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Description')}</span>
                        <input value={job.description} onChange={(event) => updateProjectJob(job.id, { description: event.target.value })} className={projectJobFieldClass} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordinating Unit')}</span>
                        <select
                          value={job.agencyId}
                          onChange={(event) => {
                            const nextAgencyId = event.target.value;
                            const nextUserId = getAgencyPeopleInCharge(nextAgencyId)[0]?.id ?? '';
                            updateProjectJob(job.id, { agencyId: nextAgencyId, userId: nextUserId });
                          }}
                          className={projectJobFieldClass}
                        >
                          {agencies.filter((item) => item.status === 'active').map((agency) => (
                            <option key={agency.id} value={agency.id}>
                              {agency.shortName} - {agency.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                        <input
                          type="date"
                          value={job.dueDate}
                          onChange={(event) => updateProjectJob(job.id, { dueDate: event.target.value })}
                          className={`${projectJobFieldClass} ${lockProjectJobDueDates ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                          disabled={lockProjectJobDueDates}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                        <select value={job.reminderDaysBefore} onChange={(event) => updateProjectJob(job.id, { reminderDaysBefore: Number(event.target.value) as ReminderDays })} className={projectJobFieldClass}>
                          <option value="5">{t('5 days before due date')}</option>
                          <option value="10">{t('10 days before due date')}</option>
                        </select>
                      </label>
                      <div className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Current attachments')}</span>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          {(job.attachments ?? []).length > 0 ? (
                            <div className="space-y-2">
                              {(job.attachments ?? []).map((file) => (
                                <div key={`${file.fileName}-${file.lastUploadDate ?? ''}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate">{file.fileName}</span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-xs text-slate-500">{file.lastUploadDate || '-'}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateProjectJob(job.id, {
                                          attachments: (job.attachments ?? []).filter(
                                            (attachment) =>
                                              !(
                                                attachment.fileName === file.fileName &&
                                                (attachment.lastUploadDate ?? '') === (file.lastUploadDate ?? '')
                                              ),
                                          ),
                                        })
                                      }
                                      className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                      title={t('Remove')}
                                      aria-label={t('Remove')}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg bg-white px-3 py-6 text-center text-sm text-slate-500">
                              {t('No current attachments')}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                            <Upload size={14} />
                            {t('Upload')}
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                const uploadedFiles = filesToAttachments(event.target.files);
                                if (uploadedFiles.length > 0) {
                                  updateProjectJob(job.id, {
                                    attachments: [...(job.attachments ?? []), ...uploadedFiles],
                                  });
                                }
                                event.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordination note')}</span>
                        <textarea
                          rows={8}
                          value={job.note ?? ''}
                          onChange={(event) => updateProjectJob(job.id, { note: event.target.value })}
                          className={`${projectJobFieldClass} min-h-[14rem]`}
                        />
                      </label>
                      <div className="absolute bottom-5 right-5">
                        <button
                          type="button"
                          onClick={() => deleteProjectJob(job.id)}
                          className={`rounded-xl bg-transparent p-2.5 text-red-700 transition-colors hover:text-red-800 ${lockProjectJobDueDates ? 'cursor-not-allowed opacity-50 hover:text-red-700' : ''}`}
                          disabled={lockProjectJobDueDates}
                          title={t('Remove')}
                          aria-label={t('Remove')}
                        >
                          <Trash2 size={18} strokeWidth={2.2} />
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
                <div className="mt-1 text-xs text-slate-500">{t('Create a delivery job with a due date and latest uploaded work product.')}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{t('New row')}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Title')}</span>
                <input value={newJob.title} onChange={(event) => setNewJob((current) => ({ ...current, title: event.target.value }))} className={projectJobFieldClass} />
              </label>
              <label className="space-y-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Description')}</span>
                <input value={newJob.description} onChange={(event) => setNewJob((current) => ({ ...current, description: event.target.value }))} className={projectJobFieldClass} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordinating Unit')}</span>
                <select
                  value={newJob.agencyId}
                  onChange={(event) => {
                    const nextAgencyId = event.target.value;
                    const nextUserId = getAgencyPeopleInCharge(nextAgencyId)[0]?.id ?? '';
                    setNewJob((current) => ({ ...current, agencyId: nextAgencyId, userId: nextUserId }));
                  }}
                  className={projectJobFieldClass}
                >
                  {agencies.filter((item) => item.status === 'active').map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.shortName} - {agency.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due date')}</span>
                <input
                  type="date"
                  value={newJob.dueDate}
                  onChange={(event) => setNewJob((current) => ({ ...current, dueDate: event.target.value }))}
                  className={projectJobFieldClass}
                />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Status')}</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNewJobStatusMenuOpen((current) => !current)}
                    className={`inline-flex w-full items-center justify-between gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus:ring-2 ${projectJobStatusBadgeClassMap[newJob.status]}`}
                    aria-haspopup="listbox"
                    aria-expanded={isNewJobStatusMenuOpen}
                  >
                    <span>{getProjectJobStatusLabel(newJob.status)}</span>
                    <ChevronDown size={16} />
                  </button>
                  {isNewJobStatusMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Status')}</div>
                      <div className="space-y-1" role="listbox" aria-label={t('Job Status')}>
                        {PROJECT_JOB_STATUS_OPTIONS.map((option) => {
                          const isSelected = newJob.status === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setNewJob((current) => ({ ...current, status: option.value }));
                                setIsNewJobStatusMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                            >
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${projectJobStatusBadgeClassMap[option.value]}`}>
                                {t(option.label)}
                              </span>
                              {isSelected ? <Check size={16} className="text-slate-500" /> : <span className="w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                <select value={newJob.reminderDaysBefore} onChange={(event) => setNewJob((current) => ({ ...current, reminderDaysBefore: Number(event.target.value) as ReminderDays }))} className={projectJobFieldClass}>
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
                  className={`${projectJobFieldClass} min-h-28`}
                  placeholder={t('One file per line: file name | YYYY-MM-DD')}
                />
                <div className="flex justify-end">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                    <Upload size={14} />
                    {t('Upload')}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const uploadedFiles = filesToAttachments(event.target.files);
                        if (uploadedFiles.length > 0) {
                          const nextValue = serializeAttachments(uploadedFiles);
                          setNewJob((current) => ({
                            ...current,
                            attachmentListText: current.attachmentListText.trim()
                              ? `${current.attachmentListText.trim()}\n${nextValue}`
                              : nextValue,
                          }));
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </label>
              <label className="space-y-2 md:col-span-2 xl:col-span-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordination note')}</span>
                <textarea rows={3} value={newJob.note} onChange={(event) => setNewJob((current) => ({ ...current, note: event.target.value }))} className={`${projectJobFieldClass} min-h-24`} />
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
      </form>
    </div>
  );
}
