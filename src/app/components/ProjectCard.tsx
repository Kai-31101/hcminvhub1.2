import React from 'react';
import { Edit, Eye, Globe } from 'lucide-react';
import { Link } from 'react-router';
import { Project } from '../data/mockData';
import { StatusPill } from './ui/status-pill';
import { DataRow } from './ui/data-row';
import { getProjectStageLabel, getProjectStatusTone } from '../utils/projectStatus';

interface ProjectCardProps {
  project: Project;
  workspaceBasePath: string;
  canManageProjects: boolean;
  translate: (value: string) => string;
  viewHref?: string;
  assignmentSummary?: {
    agency: string;
    agencyFullName?: string;
    person: string;
  };
  auditSummary?: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  processingSummary: {
    completed: number;
    total: number;
  };
  jobAlertSummary: {
    pending: number;
    delayed: number;
    upcoming: number;
  };
  onPublish?: (projectId: string) => void;
}

export function ProjectCard({
  project,
  workspaceBasePath,
  canManageProjects,
  translate,
  viewHref,
  assignmentSummary,
  auditSummary,
  processingSummary,
  jobAlertSummary,
  onPublish,
}: ProjectCardProps) {
  return (
    <DataRow
      className="items-stretch gap-4 overflow-hidden"
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-3">
        <div className="relative min-h-0 w-72 shrink-0 self-stretch overflow-hidden rounded-md">
          <img src={project.image} alt={project.name} className="absolute inset-0 h-full w-full scale-[1.06] object-cover object-center" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{translate(project.name)}</div>
            <StatusPill className="border border-slate-200 bg-white text-slate-900">{translate(project.sector)}</StatusPill>
          </div>
          <div className="text-xs text-slate-500">{translate(project.province)}</div>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Budget')}</span>
                  <div className="text-sm text-slate-900">${project.budget}M</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Project Jobs')}</span>
                  <div className="text-sm text-slate-900">
                    {processingSummary.completed}/{processingSummary.total}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Published Date')}</span>
                  <div className="text-sm text-slate-900">{project.publishedAt || translate('Not published')}</div>
                </div>
                {assignmentSummary ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Agency in charge')}</span>
                      <div
                        className="text-sm text-slate-900"
                        title={assignmentSummary.agencyFullName ?? assignmentSummary.agency}
                      >
                        {assignmentSummary.agency}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('People in charge')}</span>
                      <div className="text-sm text-slate-900">{assignmentSummary.person}</div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Total Project Jobs')}</span>
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-sm font-semibold text-slate-800">{processingSummary.total}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-sky-700">{translate('processing')}</span>
                  <span className="rounded-md bg-sky-100 px-2 py-0.5 text-sm font-semibold text-sky-800">{jobAlertSummary.pending}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-emerald-700">{translate('Completed')}</span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-800">{processingSummary.completed}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-amber-700">{translate('upcoming')}</span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800">{jobAlertSummary.upcoming}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-red-700">{translate('delayed')}</span>
                  <span className="rounded-md bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-800">{jobAlertSummary.delayed}</span>
                </div>
              </div>
            </div>
            {auditSummary ? (
              <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Project Audit')}</div>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Created By')}</span>
                    <span className="text-sm text-slate-900">{auditSummary.createdBy}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Created At')}</span>
                    <span className="text-sm text-slate-900">{auditSummary.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{translate('Last Updated At')}</span>
                    <span className="text-sm text-slate-900">{auditSummary.updatedAt}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="ml-auto flex min-h-[4.5rem] flex-col items-end justify-between gap-2 self-stretch">
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={getProjectStatusTone(project.status, project.stage)}>
            {translate(getProjectStageLabel(project.status, project.stage))}
          </StatusPill>
          {canManageProjects && project.status === 'draft' && onPublish && (
            <button
              onClick={() => {
                onPublish(project.id);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
            >
              <Globe size={12} />
              {translate('Publish')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={viewHref ?? `${workspaceBasePath}/projects/${project.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-sky-700"
            title={translate('View')}
          >
            <Eye size={13} />
            {translate('View')}
          </Link>
          {canManageProjects && (
            <Link
              to={`${workspaceBasePath}/projects/${project.id}/edit`}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-amber-700"
              title={translate('Edit')}
            >
              <Edit size={13} />
              {translate('Edit')}
            </Link>
          )}
        </div>
      </div>
    </DataRow>
  );
}
