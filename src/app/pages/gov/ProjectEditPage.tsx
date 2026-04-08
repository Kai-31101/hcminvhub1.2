import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ChevronDown, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { getDemoUserIdForRole, ProjectJob, useApp } from '../../context/AppContext';
import { Document } from '../../data/mockData';
import { administrativeLocationOptions, getAdministrativeLocationLabel } from '../../data/administrativeLocations';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { getBundledAttachmentUrl } from '../../utils/attachments';
import { translateText } from '../../utils/localization';
import { normalizeProjectStatus, PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';
import designVietnamMap from '../../assets/design-vietnam-map.png';

type EditableStatus = 'incomplete' | 'complete';
type ReminderDays = 5 | 10;
type EditTab = 'overview' | 'location-land' | 'investment-details' | 'planning-infrastructure' | 'documents' | 'activity';
type EditableProjectJob = ProjectJob;
const PROJECT_JOB_STATUS_OPTIONS: Array<{ value: EditableStatus; label: 'Processing' | 'Completed' }> = [
  { value: 'incomplete', label: 'Processing' },
  { value: 'complete', label: 'Completed' },
];
const EDIT_TABS: Array<{ id: EditTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'location-land', label: 'Location & Land' },
  { id: 'investment-details', label: 'Investment Details' },
  { id: 'documents', label: 'Documents' },
  { id: 'planning-infrastructure', label: 'Planning & Infrastructure' },
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

function formatDocumentSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function filesToDocuments(files: FileList | null) {
  const uploadedAt = new Date().toISOString().split('T')[0];

  return Array.from(files ?? []).map((file, index): Document => {
    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() ?? '' : '';
    return {
      id: `doc-${Date.now()}-${index}`,
      name: file.name,
      fileUrl: getBundledAttachmentUrl(file.name),
      type: extension || file.type || 'FILE',
      size: formatDocumentSize(file.size),
      uploadedAt,
    };
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
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
    createProject,
    updateProject,
    addNotification,
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
  const isCreateMode = !id || id === 'new';
  const canAccessProject = isCreateMode || Boolean(project && role !== 'agency' && (role !== 'gov_operator' || project.createdByUserId === getDemoUserIdForRole(role)));
  const [form, setForm] = useState(() => ({
    name: project?.name ?? '',
    sector: project?.sector ?? 'Infrastructure',
    projectType: project?.projectType ?? 'public',
    province: project?.province ?? 'Ho Chi Minh City',
    location: project?.location ?? 'ho-chi-minh-city',
    budget: String(project?.budget ?? 0),
    minInvestment: String(project?.minInvestment ?? 0),
    timeline: project?.timeline ?? 'TBD',
    returnRate: project?.returnRate ?? 'TBD',
    landArea: project?.landArea ?? 'TBD',
    stage: project?.stage ?? 'Draft',
    description: project?.description ?? '',
    image: project?.image ?? 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    mapImage: project?.mapImage ?? designVietnamMap,
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
  const [draftProjectJobs, setDraftProjectJobs] = useState<EditableProjectJob[]>([]);
  const [editableDocuments, setEditableDocuments] = useState<Document[]>(project?.documents ?? []);
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const [openJobStatusMenuId, setOpenJobStatusMenuId] = useState<string | null>(null);
  const [isNewJobStatusMenuOpen, setIsNewJobStatusMenuOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditTab>('overview');

  if (!canAccessProject) {
    return <Navigate to={`${workspaceBasePath}/projects`} replace />;
  }

  const activeProject = project ?? {
    id: 'new',
    name: form.name || 'New Project Draft',
    stage: form.stage || 'Draft',
    projectType: form.projectType || 'public',
    image: form.image || 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    mapImage: form.mapImage || designVietnamMap,
    documents: editableDocuments,
    createdByUserId: getDemoUserIdForRole(role),
    publishedAt: '',
  };
  const projectAssignments = isCreateMode ? [] : requiredDataAssignments.filter((item) => item.projectId === activeProject.id);
  const projectJobItems = isCreateMode ? [] : projectJobs.filter((item) => item.projectId === activeProject.id);
  const editableProjectJobs = isCreateMode ? draftProjectJobs : projectJobItems;
  const hasUploadedDocuments = editableDocuments.length > 0;
  const hasProjectJobAttachments = editableProjectJobs.some((item) => (item.attachments ?? []).length > 0);
  const draftCompletedJobCount = draftProjectJobs.filter((item) => item.status === 'complete').length;
  const processingSummary = isCreateMode
    ? {
        completed: draftCompletedJobCount,
        total: draftProjectJobs.length,
        percentage: draftProjectJobs.length ? Math.round((draftCompletedJobCount / draftProjectJobs.length) * 100) : 0,
      }
    : getProjectProcessingSummary(activeProject.id);
  const isDataQualityMode = searchParams.get('focus') === 'data-quality';
  const sectorOptions = useMemo(
    () => Array.from(new Set(projects.map((item) => item.sector))).sort((left, right) => left.localeCompare(right)),
    [projects],
  );
  const locationOptions = useMemo(
    () => {
      const values = form.location && !administrativeLocationOptions.includes(form.location as (typeof administrativeLocationOptions)[number])
        ? [form.location, ...administrativeLocationOptions]
        : [...administrativeLocationOptions];
      return values.map((location) => ({ value: location, label: getAdministrativeLocationLabel(location, language) }));
    },
    [form.location, language],
  );
  const projectJobFieldClass = 'app-input !border-slate-400 focus:!border-slate-500';
  const selectedPerson = getAgencyPeopleInCharge(newJob.agencyId).find((person) => person.id === newJob.userId)
    ?? getAgencyPeopleInCharge(newJob.agencyId)[0]
    ?? null;
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

  useEffect(() => {
    setForm({
      name: project?.name ?? '',
      sector: project?.sector ?? 'Infrastructure',
      projectType: project?.projectType ?? 'public',
      province: project?.province ?? 'Ho Chi Minh City',
      location: project?.location ?? 'ho-chi-minh-city',
      budget: String(project?.budget ?? 0),
      minInvestment: String(project?.minInvestment ?? 0),
      timeline: project?.timeline ?? 'TBD',
      returnRate: project?.returnRate ?? 'TBD',
      landArea: project?.landArea ?? 'TBD',
      stage: project?.stage ?? 'Draft',
      description: project?.description ?? '',
      image: project?.image ?? 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      mapImage: project?.mapImage ?? designVietnamMap,
    });
    setDraftProjectJobs([]);
    setEditableDocuments(project?.documents ?? []);
    setSaveFeedback(null);
  }, [project, isCreateMode]);

  const missingDataItems = [
    !projectAssignments.length ? t('Define at least one required data item and assign a coordinating unit.') : null,
    projectAssignments.some((item) => item.status !== 'complete') ? t('Complete all required data items before final publication review.') : null,
    !editableProjectJobs.length ? t('Define at least one project job to establish the delivery process.') : null,
    editableProjectJobs.some((item) => item.status !== 'complete') ? t('Close outstanding project jobs to reach full processing readiness.') : null,
    !(hasProjectJobAttachments || hasUploadedDocuments) ? t('Upload at least one supporting document.') : null,
  ].filter(Boolean) as string[];

  async function handleImageUpload(field: 'image' | 'mapImage', files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl) {
      handleChange(field, dataUrl);
    }
  }

  function getAgencyPeopleInCharge(agencyId: string) {
    return agencies.find((agency) => agency.id === agencyId)?.peopleInCharge ?? [];
  }

  function handleChange(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditableJob(jobId: string, changes: Partial<EditableProjectJob>) {
    if (isCreateMode) {
      setDraftProjectJobs((current) => current.map((item) => (item.id === jobId ? { ...item, ...changes } : item)));
      return;
    }
    updateProjectJob(jobId, changes);
  }

  function deleteEditableJob(jobId: string) {
    if (isCreateMode) {
      setDraftProjectJobs((current) => current.filter((item) => item.id !== jobId));
      return;
    }
    deleteProjectJob(jobId);
  }

  function handleProjectDocumentUpload(files: FileList | null) {
    const nextDocuments = filesToDocuments(files);
    if (!nextDocuments.length) return;
    setEditableDocuments((current) => [...current, ...nextDocuments]);
  }

  function deleteProjectDocument(documentId: string) {
    setEditableDocuments((current) => current.filter((item) => item.id !== documentId));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const nextStatus = normalizeProjectStatus(form.stage, form.stage);
    if (isCreateMode) {
      const nextName = form.name.trim() || 'New Project Draft';
      const projectId = createProject({
        name: nextName,
        sector: form.sector,
        projectType: form.projectType,
        location: form.location,
        province: form.province,
        budget: Number(form.budget || 0),
        minInvestment: Number(form.minInvestment || 0),
        status: nextStatus === 'published' ? 'published' : 'draft',
        stage: nextStatus === 'published' ? 'Published' : 'Draft',
        description: form.description.trim() || 'Enter the initial project summary, investment profile, and delivery details.',
        timeline: form.timeline.trim() || 'TBD',
        landArea: form.landArea.trim() || 'TBD',
        returnRate: form.returnRate.trim() || 'TBD',
        image: form.image,
        mapImage: form.mapImage,
        documents: editableDocuments,
        jobs: 0,
      });
      draftProjectJobs.forEach((job) => {
        createProjectJob({
          projectId,
          title: job.title,
          description: job.description,
          agencyId: job.agencyId,
          userId: job.userId,
          status: job.status,
          dueDate: job.dueDate,
          reminderDaysBefore: job.reminderDaysBefore,
          note: job.note,
          attachments: job.attachments,
        });
      });
      if (nextStatus === 'published') {
        updateProject(projectId, {
          status: 'published',
          stage: 'Published',
          publishedAt: new Date().toISOString().split('T')[0],
        });
      }
      addNotification({
        title: nextStatus === 'published' ? 'Project Published' : 'Project Draft Created',
        message:
          nextStatus === 'published'
            ? `${nextName} is now visible across the workspace.`
            : `${nextName} was created as a draft project.`,
        type: 'success',
        path: `${workspaceBasePath}/projects/${projectId}`,
      });
      navigate(`${workspaceBasePath}/projects`, { replace: true });
      return;
    }
    updateProject(activeProject.id, {
      ...activeProject,
      ...form,
      documents: editableDocuments,
      budget: Number(form.budget || 0),
      minInvestment: Number(form.minInvestment || 0),
      status: nextStatus,
      publishedAt:
        nextStatus === 'published'
          ? activeProject.publishedAt || new Date().toISOString().split('T')[0]
          : activeProject.publishedAt,
    });
    addNotification({
      title: nextStatus === 'published' ? 'Project Published' : 'Project Saved',
      message:
        nextStatus === 'published'
          ? `${form.name || activeProject.name} is now visible across the workspace.`
          : `${form.name || activeProject.name} was saved successfully.`,
      type: nextStatus === 'published' ? 'success' : 'info',
      path: `${workspaceBasePath}/projects/${activeProject.id}`,
    });
    setSaveFeedback(
      nextStatus === 'published'
        ? t('Project published and synced across the workspace.')
        : t('Changes saved successfully.'),
    );
  }

  function handleCreateJob() {
    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.agencyId || !selectedPerson?.id) return;
    const nextJob = {
      id: `draft-job-${Date.now()}`,
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
    };
    if (isCreateMode) {
      setDraftProjectJobs((current) => [...current, nextJob]);
    } else {
      createProjectJob(nextJob);
    }
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
        <Link to={isCreateMode ? `${workspaceBasePath}/projects` : `${workspaceBasePath}/projects/${activeProject.id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t(isCreateMode ? 'Back to projects' : 'Back to project')}
        </Link>
      </div>

      <section className="section-panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <h1 className="section-heading mb-0">{t(isCreateMode ? 'Create Project' : 'Edit Project')}</h1>
            <p className="section-subheading">{t(isCreateMode ? 'Create one standardized project record with overview data before adding delivery jobs.' : 'Manage one standardized project record with overview data and delivery jobs.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(isCreateMode ? `${workspaceBasePath}/projects` : `${workspaceBasePath}/projects/${activeProject.id}`)}
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

      {saveFeedback && (
        <section className="section-panel border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            <Check size={16} />
            <span>{saveFeedback}</span>
          </div>
        </section>
      )}

      {isDataQualityMode && !isCreateMode && (
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
        <section>
          <div className="flex flex-nowrap gap-8 overflow-x-auto border-b border-[rgba(224,192,177,0.2)]">
            {EDIT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 pb-[18px] pt-[2px] text-[14px] transition-colors ${activeTab === tab.id ? 'border-[#9d4300] text-[#9d4300]' : 'border-transparent text-[#455f87] hover:text-[#9d4300]'}`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>
        </section>

        <div>
          <section className="section-panel overflow-visible p-0">
            <div className="relative h-64">
              <div className="absolute inset-0 overflow-hidden">
                <img src={activeProject.image} alt={form.name || activeProject.name} className="h-full w-full object-cover" />
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
                <h2 className="section-heading mb-0">{t(EDIT_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Overview')}</h2>
                <StatusPill tone="info">{t(isCreateMode ? 'Draft creation' : 'Single project record')}</StatusPill>
              </div>
              {(activeTab === 'overview' || activeTab === 'location-land' || activeTab === 'investment-details') && (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeTab === 'overview' && (
                    <>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Name')}</span>
                        <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Sector')}</span>
                        <select value={form.sector} onChange={(event) => handleChange('sector', event.target.value)} className="app-input">
                          {sectorOptions.map((sector) => (
                            <option key={sector} value={sector}>{t(sector)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Type')}</span>
                        <select value={form.projectType} onChange={(event) => handleChange('projectType', event.target.value)} className="app-input">
                          <option value="public">{t('Public')}</option>
                          <option value="private">{t('Private')}</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Stage')}</span>
                        <select value={form.stage} onChange={(event) => handleChange('stage', event.target.value)} className="app-input">
                          {PROJECT_STAGE_OPTIONS.map((stage) => (
                            <option key={stage} value={stage}>{t(stage)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Description')}</span>
                        <textarea rows={7} value={form.description} onChange={(event) => handleChange('description', event.target.value)} className="app-input min-h-36" />
                      </label>
                      <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Project Visual')}</span>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                            <Upload size={14} />
                            {t('Upload')}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                void handleImageUpload('image', event.target.files);
                                event.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-slate-50">
                          <img src={form.image || activeProject.image} alt={form.name || activeProject.name} className="h-56 w-full object-cover" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'location-land' && (
                    <>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Province')}</span>
                        <input value={form.province} onChange={(event) => handleChange('province', event.target.value)} className="app-input" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Land Area')}</span>
                        <input value={form.landArea} onChange={(event) => handleChange('landArea', event.target.value)} className="app-input" />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Location')}</span>
                        <select value={form.location} onChange={(event) => handleChange('location', event.target.value)} className="app-input">
                          {locationOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Location map')}</span>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                            <Upload size={14} />
                            {t('Upload')}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                void handleImageUpload('mapImage', event.target.files);
                                event.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-slate-50">
                          <img src={form.mapImage || activeProject.mapImage || designVietnamMap} alt={t('Location map')} className="h-56 w-full object-cover" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'investment-details' && (
                    <>
                      {[
                        { label: 'Budget', key: 'budget' },
                        { label: 'Minimum Investment', key: 'minInvestment' },
                        { label: 'Timeline', key: 'timeline' },
                        { label: 'Expected IRR', key: 'returnRate' },
                      ].map((field) => (
                        <label key={field.key} className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(field.label)}</span>
                          <input value={form[field.key as keyof typeof form]} onChange={(event) => handleChange(field.key as keyof typeof form, event.target.value)} className="app-input" />
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{t('Document Upload')}</div>
                      <div className="mt-1 text-sm text-slate-500">{t('Upload required files or simulate the intake package.')}</div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                      <Upload size={14} />
                      {t('Upload')}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          handleProjectDocumentUpload(event.target.files);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {editableDocuments.length > 0 ? editableDocuments.map((document) => (
                    <div key={document.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{document.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{document.type} • {document.size} • {document.uploadedAt}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteProjectDocument(document.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        {t('Remove')}
                      </button>
                    </div>
                  )) : (
                    <div className="rounded-[4px] border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                      {t('No documents are available yet.')}
                    </div>
                  )}
                </div>
              )}

              {false && (
                <div className="space-y-3">
                  {activeProject.documents.length > 0 ? activeProject.documents.map((document) => (
                    <div key={document.id} className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-sm font-semibold text-slate-900">{document.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{document.type} • {document.size} • {document.uploadedAt}</div>
                    </div>
                  )) : (
                    <div className="rounded-[4px] border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                      {t('No documents are available yet.')}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {(project?.qa ?? []).length > 0 ? (project?.qa ?? []).map((item) => (
                    <div key={item.id} className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-sm font-semibold text-slate-900">{t(item.question)}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.askedBy} • {item.askedAt}</div>
                    </div>
                  )) : (
                    <div className="rounded-[4px] border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                      {t('No activity has been recorded for this project yet.')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
        {activeTab === 'planning-infrastructure' && (
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
            {editableProjectJobs.length > 0 &&
              editableProjectJobs.map((job) => {
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
                                          updateEditableJob(job.id, { status: option.value });
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
                        <input value={job.title} onChange={(event) => updateEditableJob(job.id, { title: event.target.value })} className={projectJobFieldClass} />
                      </label>
                      <label className="space-y-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Job Description')}</span>
                        <input value={job.description} onChange={(event) => updateEditableJob(job.id, { description: event.target.value })} className={projectJobFieldClass} />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Coordinating Unit')}</span>
                        <select
                          value={job.agencyId}
                          onChange={(event) => {
                            const nextAgencyId = event.target.value;
                            const nextUserId = getAgencyPeopleInCharge(nextAgencyId)[0]?.id ?? '';
                            updateEditableJob(job.id, { agencyId: nextAgencyId, userId: nextUserId });
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
                          onChange={(event) => updateEditableJob(job.id, { dueDate: event.target.value })}
                          className={`${projectJobFieldClass} ${lockProjectJobDueDates ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                          disabled={lockProjectJobDueDates}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Reminder timing')}</span>
                        <select value={job.reminderDaysBefore} onChange={(event) => updateEditableJob(job.id, { reminderDaysBefore: Number(event.target.value) as ReminderDays })} className={projectJobFieldClass}>
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
                                        updateEditableJob(job.id, {
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
                                  updateEditableJob(job.id, {
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
                          onChange={(event) => updateEditableJob(job.id, { note: event.target.value })}
                          className={`${projectJobFieldClass} min-h-[14rem]`}
                        />
                      </label>
                      <div className="absolute bottom-5 right-5">
                        <button
                          type="button"
                          onClick={() => deleteEditableJob(job.id)}
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
        )}
      </form>
    </div>
  );
}
