import React from 'react';
import { ChevronDown, ChevronUp, Clock3, Edit, Eye, Globe, Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Project } from '../data/mockData';
import { StatusPill } from './ui/status-pill';
import { DataRow } from './ui/data-row';
import { getProjectStageLabel, getProjectStatusTone } from '../utils/projectStatus';
import { formatFollowerCount, getProjectFollowerCount } from '../utils/projectFollowers';

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
  variant?: 'default' | 'managementExpandable';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  variant = 'default',
  isExpanded = false,
  onToggleExpand,
  onPublish,
}: ProjectCardProps) {
  const followerCount = getProjectFollowerCount(project);
  const interestCount = project.followers || followerCount;
  const viewsCount = interestCount * 10 + processingSummary.total * 14;
  const stageLabel = translate(getProjectStageLabel(project.status, project.stage));
  const statusTone = getProjectStatusTone(project.status, project.stage);
  const summaryLocation = translate(project.location || project.province);
  const updatedLabel = formatUpdatedLabel(project.updatedAt || auditSummary?.updatedAt);

  function formatUpdatedLabel(value?: string) {
    if (!value) {
      return translate('Updated recently');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  function stopToggle(event: React.MouseEvent | React.KeyboardEvent) {
    event.stopPropagation();
  }

  if (variant === 'managementExpandable') {
    return (
      <div
        className={`overflow-hidden rounded-none border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors ${
          isExpanded ? 'border-[rgba(69,95,135,0.24)]' : 'border-[rgba(236,238,240,1)]'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && onToggleExpand) {
              event.preventDefault();
              onToggleExpand();
            }
          }}
          className="flex cursor-pointer gap-6 px-6 py-6 focus:outline-none focus:ring-2 focus:ring-[#455f87]/20"
        >
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[4px] bg-[#eceef0]">
            <img src={project.image} alt={project.name} className="h-full w-full object-cover object-center" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[18px] font-bold leading-7 text-[#191c1e]">{translate(project.name)}</h3>
              <StatusPill className="rounded-full border-0 bg-[#d5e3ff] px-2 py-1 text-[10px] uppercase tracking-[0.05em] text-[#001c3b] shadow-none">
                {translate(project.sector)}
              </StatusPill>
              <StatusPill
                tone={statusTone}
                className="rounded-full border-0 px-2 py-1 text-[10px] uppercase tracking-[0.05em] shadow-none"
              >
                {stageLabel}
              </StatusPill>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#455f87]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {summaryLocation}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={14} />
                {new Intl.NumberFormat().format(viewsCount)} {translate('views')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart size={14} />
                {new Intl.NumberFormat().format(interestCount)} {translate('Interests')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} />
                {translate('Updated')} {updatedLabel}
              </span>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end justify-center gap-3" onClick={stopToggle} onKeyDown={stopToggle}>
            {canManageProjects && project.status === 'draft' && onPublish && (
              <button
                onClick={() => {
                  onPublish(project.id);
                }}
                className="inline-flex items-center gap-1 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                <Globe size={12} />
                {translate('Publish')}
              </button>
            )}
            <div className="flex items-center gap-3">
              <Link
                to={`${workspaceBasePath}/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1 rounded-none border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] px-3 py-2 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
                title={translate('Edit')}
              >
                <Edit size={13} />
                {translate('Edit')}
              </Link>
              <Link
                to={viewHref ?? `${workspaceBasePath}/projects/${project.id}`}
                className="inline-flex items-center gap-1 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
                title={translate('View')}
              >
                <Eye size={13} />
                {translate('View')}
              </Link>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-[rgba(224,192,177,0.18)] bg-[#fbfcfd] px-6 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-[#455f87]">{translate('Project jobs detail and metadata')}</div>
              <button
                type="button"
                onClick={onToggleExpand}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#455f87] hover:text-[#1e3a5f]"
              >
                <ChevronUp size={16} />
                {translate('Collapse')}
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="min-w-0 rounded-none bg-white px-4 py-4">
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Budget')}</span>
                    <div className="text-sm text-[#191c1e]">${project.budget}M</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Project Jobs')}</span>
                    <div className="text-sm text-[#191c1e]">
                      {processingSummary.completed}/{processingSummary.total}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Published Date')}</span>
                    <div className="text-sm text-[#191c1e]">{project.publishedAt || translate('Not published')}</div>
                  </div>
                  {assignmentSummary ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Coordinating Unit')}</span>
                      <div
                        className="text-sm text-[#191c1e]"
                        title={assignmentSummary.agencyFullName ?? assignmentSummary.agency}
                      >
                        {assignmentSummary.agency}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 rounded-none bg-white px-4 py-4">
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Total Project Jobs')}</span>
                    <span className="rounded-none bg-[#dde2e6] px-2 py-0.5 text-sm font-semibold text-[#191c1e]">{processingSummary.total}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#455f87]">{translate('processing')}</span>
                    <span className="rounded-none bg-[#e7eef7] px-2 py-0.5 text-sm font-semibold text-[#455f87]">{jobAlertSummary.pending}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#2f6f47]">{translate('Completed')}</span>
                    <span className="rounded-none bg-[#edf7f1] px-2 py-0.5 text-sm font-semibold text-[#2f6f47]">{processingSummary.completed}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#9d4300]">{translate('upcoming')}</span>
                    <span className="rounded-none bg-[#fff1e7] px-2 py-0.5 text-sm font-semibold text-[#9d4300]">{jobAlertSummary.upcoming}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#b9381c]">{translate('delayed')}</span>
                    <span className="rounded-none bg-[#fff0ec] px-2 py-0.5 text-sm font-semibold text-[#b9381c]">{jobAlertSummary.delayed}</span>
                  </div>
                </div>
              </div>
              {auditSummary ? (
                <div className="min-w-0 rounded-none bg-white px-4 py-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Project Audit')}</div>
                  <div className="grid gap-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Created By')}</span>
                      <span className="text-sm text-[#191c1e]">{auditSummary.createdBy}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Created At')}</span>
                      <span className="text-sm text-[#191c1e]">{auditSummary.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Last Updated At')}</span>
                      <span className="text-sm text-[#191c1e]">{auditSummary.updatedAt}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DataRow
      className="items-stretch gap-5 overflow-hidden border-[rgba(224,192,177,0.18)] bg-white px-5 py-5"
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-3">
        <div className="relative min-h-0 w-72 shrink-0 self-stretch overflow-hidden rounded-none">
          <img src={project.image} alt={project.name} className="absolute inset-0 h-full w-full scale-[1.06] object-cover object-center" />
          <div className="absolute left-3 top-3 rounded-none border border-white/60 bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9d4300] shadow-sm">
            {formatFollowerCount(followerCount)} {translate('followers')}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div className="text-[18px] font-semibold text-[#191c1e]">{translate(project.name)}</div>
            <StatusPill className="border-[rgba(224,192,177,0.18)] bg-[#fff1e7] text-[#9d4300]">{translate(project.sector)}</StatusPill>
          </div>
          <div className="text-xs text-[#455f87]">{translate(project.province)}</div>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 rounded-none bg-[#f2f4f6] px-3 py-3">
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Budget')}</span>
                  <div className="text-sm text-[#191c1e]">${project.budget}M</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Project Jobs')}</span>
                  <div className="text-sm text-[#191c1e]">
                    {processingSummary.completed}/{processingSummary.total}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Published Date')}</span>
                  <div className="text-sm text-[#191c1e]">{project.publishedAt || translate('Not published')}</div>
                </div>
                {assignmentSummary ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Coordinating Unit')}</span>
                      <div
                        className="text-sm text-[#191c1e]"
                        title={assignmentSummary.agencyFullName ?? assignmentSummary.agency}
                      >
                        {assignmentSummary.agency}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 rounded-none bg-[#f2f4f6] px-3 py-3">
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Total Project Jobs')}</span>
                  <span className="rounded-none bg-[#dde2e6] px-2 py-0.5 text-sm font-semibold text-[#191c1e]">{processingSummary.total}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#455f87]">{translate('processing')}</span>
                  <span className="rounded-none bg-[#e7eef7] px-2 py-0.5 text-sm font-semibold text-[#455f87]">{jobAlertSummary.pending}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#2f6f47]">{translate('Completed')}</span>
                  <span className="rounded-none bg-[#edf7f1] px-2 py-0.5 text-sm font-semibold text-[#2f6f47]">{processingSummary.completed}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#9d4300]">{translate('upcoming')}</span>
                  <span className="rounded-none bg-[#fff1e7] px-2 py-0.5 text-sm font-semibold text-[#9d4300]">{jobAlertSummary.upcoming}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.12em] text-[#b9381c]">{translate('delayed')}</span>
                  <span className="rounded-none bg-[#fff0ec] px-2 py-0.5 text-sm font-semibold text-[#b9381c]">{jobAlertSummary.delayed}</span>
                </div>
              </div>
            </div>
            {auditSummary ? (
              <div className="min-w-0 rounded-none border border-[rgba(224,192,177,0.18)] bg-white px-3 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Project Audit')}</div>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Created By')}</span>
                    <span className="text-sm text-[#191c1e]">{auditSummary.createdBy}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Created At')}</span>
                    <span className="text-sm text-[#191c1e]">{auditSummary.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.12em] text-[#8c7164]">{translate('Last Updated At')}</span>
                    <span className="text-sm text-[#191c1e]">{auditSummary.updatedAt}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="ml-auto flex min-h-[4.5rem] flex-col items-end justify-between gap-2 self-stretch">
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={statusTone}>
            {stageLabel}
          </StatusPill>
          {canManageProjects && project.status === 'draft' && onPublish && (
            <button
              onClick={() => {
                onPublish(project.id);
              }}
              className="inline-flex items-center gap-1 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
            >
              <Globe size={12} />
              {translate('Publish')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={viewHref ?? `${workspaceBasePath}/projects/${project.id}`}
            className="inline-flex items-center gap-1 rounded-none border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] px-3 py-2 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#e7ebef] hover:text-[#1e3a5f]"
            title={translate('View')}
          >
            <Eye size={13} />
            {translate('View')}
          </Link>
          {canManageProjects && (
            <Link
              to={`${workspaceBasePath}/projects/${project.id}/edit`}
              className="inline-flex items-center gap-1 rounded-none border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] px-3 py-2 text-xs font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
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
