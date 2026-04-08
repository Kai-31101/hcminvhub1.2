import React from 'react';
import { CalendarDays, Download, FileStack, MapPinned } from 'lucide-react';
import { Agency, Project } from '../data/mockData';
import { ProjectJob, ProjectProcessingSummary } from '../context/AppContext';
import { downloadAttachment } from '../utils/attachments';
import { StatusPill } from './ui/status-pill';

type StatusTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

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

function getReadinessTone(summary: ProjectProcessingSummary): StatusTone {
  if (!summary.total) return 'default';
  if (summary.completed === summary.total) return 'success';
  if (summary.percentage >= 50) return 'warning';
  return 'info';
}

export function ProjectPlanningInfrastructureSection({
  project,
  projectJobs,
  agencies,
  processingSummary,
  t,
}: {
  project: Project;
  projectJobs: ProjectJob[];
  agencies: Agency[];
  processingSummary: ProjectProcessingSummary;
  t: (value: string) => string;
}) {
  return (
    <section className="section-panel overflow-hidden p-0">
      <div className="border-b border-[rgba(224,192,177,0.18)] bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_100%)] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9d4300]">
              {t('Project Jobs')}
            </div>
            <h2 className="section-heading mb-2 mt-2">{t('Planning & Infrastructure')}</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#455f87]">
              {t('Track implementation readiness across schedule, land preparation, and coordinated project jobs from one section.')}
            </p>
          </div>
          <StatusPill tone={getReadinessTone(processingSummary)}>
            {processingSummary.completed}/{processingSummary.total} {t('jobs')}
          </StatusPill>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white px-4 py-4">
            <div className="flex items-center gap-3 text-[#9d4300]">
              <CalendarDays size={18} />
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">{t('Timeline')}</div>
            </div>
            <div className="mt-3 text-[22px] font-semibold text-[#191c1e]">{t(project.timeline)}</div>
            <div className="mt-1 text-sm text-[#617086]">{t('Delivery window')}</div>
          </div>

          <div className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white px-4 py-4">
            <div className="flex items-center gap-3 text-[#9d4300]">
              <MapPinned size={18} />
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">{t('Land Area')}</div>
            </div>
            <div className="mt-3 text-[22px] font-semibold text-[#191c1e]">{t(project.landArea)}</div>
            <div className="mt-1 text-sm text-[#617086]">{t('Site footprint')}</div>
          </div>

          <div className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white px-4 py-4">
            <div className="flex items-center gap-3 text-[#9d4300]">
              <FileStack size={18} />
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">{t('Project Processing')}</div>
            </div>
            <div className="mt-3 text-[22px] font-semibold text-[#191c1e]">{processingSummary.percentage}%</div>
            <div className="mt-1 text-sm text-[#617086]">{t('Processing readiness')}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6">
        {projectJobs.length > 0 ? (
          projectJobs.map((job) => {
            const agency = agencies.find((item) => item.id === job.agencyId);
            const statusMeta = getJobStatusMeta(job.status, t);
            const dueDateMeta = getDueDateMeta(job.status, job.dueDate, t);
            return (
              <article key={job.id} className="rounded-none border border-[rgba(224,192,177,0.18)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[18px] font-semibold leading-7 text-[#191c1e]">{t(job.title)}</div>
                      <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                    </div>
                    <div className="mt-2 text-sm leading-7 text-[#617086]">{t(job.description)}</div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-none bg-[#f7f9fb] px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{t('Coordinating Unit')}</div>
                        <div className="mt-1 text-sm font-medium text-[#191c1e]">{agency?.name ?? '-'}</div>
                      </div>
                      <div className="rounded-none bg-[#f7f9fb] px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{t('Reminder')}</div>
                        <div className="mt-1 text-sm font-medium text-[#191c1e]">{job.reminderDaysBefore} {t('days')}</div>
                      </div>
                      <div className="rounded-none bg-[#f7f9fb] px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{t('Due date')}</div>
                        <div className="mt-1 text-sm font-medium text-[#191c1e]">{job.dueDate}</div>
                      </div>
                    </div>

                    {job.note ? (
                      <div className="mt-4 rounded-none border border-[rgba(224,192,177,0.18)] bg-[#fff8f3] px-4 py-3 text-sm leading-7 text-[#6a4634]">
                        {t(job.note)}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full max-w-[320px] rounded-none border border-[rgba(224,192,177,0.18)] bg-[#fcfcfd] p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                      <StatusPill tone={dueDateMeta.tone}>{dueDateMeta.label}</StatusPill>
                    </div>

                    <div className="mt-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{t('Attachment list')}</div>
                      <div className="mt-3 space-y-2">
                        {(job.attachments ?? []).length > 0 ? (
                          (job.attachments ?? []).map((file) => (
                            <div
                              key={`${file.fileName}-${file.lastUploadDate ?? ''}`}
                              className="flex items-center justify-between gap-3 rounded-none border border-[rgba(224,192,177,0.14)] bg-white px-3 py-2 text-xs text-[#617086]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => downloadAttachment(file)}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-[rgba(224,192,177,0.18)] bg-white text-[#9d4300] transition-colors hover:bg-[#fff1e7]"
                                  aria-label={`${t('Download')} ${t(file.fileName)}`}
                                >
                                  <Download size={14} />
                                </button>
                                <span className="truncate">{t(file.fileName)}</span>
                              </div>
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
              </article>
            );
          })
        ) : (
          <div className="rounded-none border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
            {t('No project jobs have been defined for this project yet.')}
          </div>
        )}
      </div>
    </section>
  );
}
