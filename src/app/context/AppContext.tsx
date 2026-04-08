import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Agency,
  Issue,
  Milestone,
  Opportunity,
  Permit,
  Project,
  ServiceRequest,
  User,
  agencies as baseAgencies,
  issues as baseIssues,
  milestones as baseMilestones,
  opportunities as baseOpportunities,
  permits as basePermits,
  projects as baseProjects,
  serviceRequests as baseServiceRequests,
  users as baseUsers,
} from '../data/mockData';
import { getLocalizedData, getLocalizedNotifications, Language, translateText } from '../utils/localization';
import { getProjectStageLabel, normalizeProjectStatus } from '../utils/projectStatus';

export type UserRole = 'investor' | 'gov_operator' | 'agency' | 'admin' | 'executive';

export function getDemoUserIdForRole(role: UserRole | null): string {
  switch (role) {
    case 'gov_operator':
      return 'u1';
    case 'agency':
      return 'u3';
    case 'investor':
      return 'u6';
    case 'admin':
      return 'u7';
    case 'executive':
      return 'u5';
    default:
      return 'u1';
  }
}

function getDefaultActiveUserId(role: UserRole | null, activeAgency?: Agency | null): string {
  if (role === 'gov_operator') {
    const firstGovUser = cloneUsers().find((user) => user.role === 'Government Operator' && user.status === 'active');
    return firstGovUser?.id ?? getDemoUserIdForRole(role);
  }
  if (role === 'agency') {
    const firstOfficerId = activeAgency?.peopleInCharge?.[0]?.id;
    return activeAgency?.id && firstOfficerId ? `${activeAgency.id}:${firstOfficerId}` : getDemoUserIdForRole(role);
  }
  return getDemoUserIdForRole(role);
}

function getProjectWorkspaceBasePath(role: UserRole | null) {
  return role === 'agency' ? '/agency/projects' : '/gov/projects';
}

function getUserIdFromActiveWorkspaceUser(activeUserId: string, role: UserRole | null) {
  if ((role === 'gov_operator' || role === 'agency') && activeUserId.includes(':')) {
    return activeUserId.split(':')[1] ?? activeUserId;
  }
  return activeUserId;
}

function getOpportunityWorkspaceBasePath(role: UserRole | null) {
  return role === 'agency' ? '/agency/opportunities' : '/gov/opportunities';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  path?: string;
}

export interface AttachmentItem {
  fileName: string;
  fileNameVi?: string;
  fileNameEn?: string;
  fileUrl?: string;
  lastUploadDate?: string;
}

export interface RequiredDataAssignment {
  id: string;
  projectId: string;
  fieldName: string;
  agencyId: string;
  userId: string;
  status: 'incomplete' | 'complete';
  dueDate: string;
  reminderDaysBefore: 5 | 10;
  note?: string;
  attachments?: AttachmentItem[];
}

export interface ProjectDataCompletenessSummary {
  completed: number;
  total: number;
  percentage: number;
}

export interface ProjectJob {
  id: string;
  projectId: string;
  title: string;
  titleVi?: string;
  titleEn?: string;
  description: string;
  descriptionVi?: string;
  descriptionEn?: string;
  agencyId: string;
  userId: string;
  status: 'incomplete' | 'complete';
  dueDate: string;
  reminderDaysBefore: 5 | 10;
  note?: string;
  noteVi?: string;
  noteEn?: string;
  attachments?: AttachmentItem[];
}

export interface ProjectProcessingSummary {
  completed: number;
  total: number;
  percentage: number;
}

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  activeUserId: string;
  setActiveUserId: (userId: string) => void;
  activeAgencyId: string;
  setActiveAgencyId: (agencyId: string) => void;
  activeAgency: Agency | null;
  projects: Project[];
  opportunities: Opportunity[];
  activeInvestorCompany: string;
  setActiveInvestorCompany: (company: string) => void;
  watchlist: string[];
  toggleWatchlist: (projectId: string) => void;
  users: User[];
  agencies: Agency[];
  requiredDataAssignments: RequiredDataAssignment[];
  getProjectDataCompletenessSummary: (projectId: string) => ProjectDataCompletenessSummary;
  projectJobs: ProjectJob[];
  getProjectProcessingSummary: (projectId: string) => ProjectProcessingSummary;
  issues: Issue[];
  milestones: Milestone[];
  permits: Permit[];
  serviceRequests: ServiceRequest[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'time'> & { time?: string }) => void;
  createProject: (project: Omit<Project, 'id' | 'followers' | 'dataCompleteness' | 'qa' | 'milestones' | 'highlights' | 'sector_tag_color' | 'image'> & Partial<Pick<Project, 'image' | 'mapImage' | 'sector_tag_color' | 'highlights'>>) => string;
  updateProject: (projectId: string, changes: Partial<Project>) => void;
  publishProject: (projectId: string) => void;
  createOpportunity: (opportunity: Omit<Opportunity, 'id' | 'submittedAt' | 'updatedAt' | 'activities'>) => string;
  updateOpportunity: (opportunityId: string, changes: Partial<Opportunity>, activity?: Opportunity['activities'][number]) => void;
  createServiceRequest: (request: Omit<ServiceRequest, 'id' | 'submittedAt' | 'deadline' | 'status' | 'slaStatus'>) => string;
  updateServiceRequest: (requestId: string, changes: Partial<ServiceRequest>) => void;
  createIssue: (issue: Omit<Issue, 'id' | 'reportedAt' | 'updatedAt'>) => string;
  updateIssue: (issueId: string, changes: Partial<Issue>) => void;
  updatePermit: (permitId: string, changes: Partial<Permit>) => void;
  updateMilestone: (milestoneId: string, changes: Partial<Milestone>) => void;
  createUser: (user: Omit<User, 'id' | 'lastLogin'>) => string;
  updateUser: (userId: string, changes: Partial<User>) => void;
  createAgency: (agency: Omit<Agency, 'id' | 'activeRequests'>) => string;
  updateAgency: (agencyId: string, changes: Partial<Agency>) => void;
  createRequiredDataAssignment: (assignment: Omit<RequiredDataAssignment, 'id'>) => string;
  updateRequiredDataAssignment: (assignmentId: string, changes: Partial<RequiredDataAssignment>) => void;
  deleteRequiredDataAssignment: (assignmentId: string) => void;
  createProjectJob: (job: Omit<ProjectJob, 'id'>) => string;
  updateProjectJob: (jobId: string, changes: Partial<ProjectJob>) => void;
  deleteProjectJob: (jobId: string) => void;
  resetDemoData: () => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  unreadCount: number;
}

const WATCHLIST_KEY = 'hcminvhub-watchlist';
const ACTIVE_INVESTOR_KEY = 'hcminvhub-active-investor-company';
const PROJECT_ADDITIONS_KEY = 'hcminvhub-project-additions';
const PROJECT_OVERRIDES_KEY = 'hcminvhub-project-overrides';
const OPPORTUNITY_ADDITIONS_KEY = 'hcminvhub-opportunity-additions';
const OPPORTUNITY_OVERRIDES_KEY = 'hcminvhub-opportunity-overrides';
const SERVICE_REQUEST_ADDITIONS_KEY = 'hcminvhub-service-request-additions';
const SERVICE_REQUEST_OVERRIDES_KEY = 'hcminvhub-service-request-overrides';
const ISSUE_ADDITIONS_KEY = 'hcminvhub-issue-additions';
const ISSUE_OVERRIDES_KEY = 'hcminvhub-issue-overrides';
const PERMIT_OVERRIDES_KEY = 'hcminvhub-permit-overrides';
const MILESTONE_OVERRIDES_KEY = 'hcminvhub-milestone-overrides';
const NOTIFICATION_ADDITIONS_KEY = 'hcminvhub-notification-additions';
const USER_ADDITIONS_KEY = 'hcminvhub-user-additions';
const USER_OVERRIDES_KEY = 'hcminvhub-user-overrides';
const AGENCY_ADDITIONS_KEY = 'hcminvhub-agency-additions';
const AGENCY_OVERRIDES_KEY = 'hcminvhub-agency-overrides';
const ACTIVE_USER_KEY = 'hcminvhub-active-user-id';
const ACTIVE_AGENCY_KEY = 'hcminvhub-active-agency-id';
const REQUIRED_DATA_ASSIGNMENTS_KEY = 'hcminvhub-required-data-assignments';
const PROJECT_JOBS_KEY = 'hcminvhub-project-jobs';
const DEMO_DATA_KEYS = [
  WATCHLIST_KEY,
  ACTIVE_INVESTOR_KEY,
  PROJECT_ADDITIONS_KEY,
  PROJECT_OVERRIDES_KEY,
  OPPORTUNITY_ADDITIONS_KEY,
  OPPORTUNITY_OVERRIDES_KEY,
  SERVICE_REQUEST_ADDITIONS_KEY,
  SERVICE_REQUEST_OVERRIDES_KEY,
  ISSUE_ADDITIONS_KEY,
  ISSUE_OVERRIDES_KEY,
  PERMIT_OVERRIDES_KEY,
  MILESTONE_OVERRIDES_KEY,
  NOTIFICATION_ADDITIONS_KEY,
  USER_ADDITIONS_KEY,
  USER_OVERRIDES_KEY,
  AGENCY_ADDITIONS_KEY,
  AGENCY_OVERRIDES_KEY,
  ACTIVE_USER_KEY,
  ACTIVE_AGENCY_KEY,
  REQUIRED_DATA_ASSIGNMENTS_KEY,
  PROJECT_JOBS_KEY,
];

function getRoleFromPathname(pathname: string): UserRole | null {
  if (pathname.startsWith('/investor')) return 'investor';
  if (pathname.startsWith('/gov')) return 'gov_operator';
  if (pathname.startsWith('/agency')) return 'agency';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/executive')) return 'executive';
  return null;
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toKebabCase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNormalizedAgencyOwnership(agencyId: string, userId: string) {
  const legacyAgencyIdMap: Record<string, string> = {
    ag17: 'ag8',
    ag18: 'ag11',
    ag20: 'ag14',
    ag21: 'ag5',
    ag35: 'ag13',
    ag52: 'ag6',
  };
  const migratedAgencyId = legacyAgencyIdMap[agencyId] ?? (agencyId === 'ag1' && userId === 'u3' ? 'ag3' : agencyId);
  const migratedUserId = /^u[34]$/.test(userId) && /^ag\d+$/.test(migratedAgencyId) ? `${migratedAgencyId}-pic-1` : userId;
  return { agencyId: migratedAgencyId, userId: migratedUserId };
}

function normalizeRequiredDataAssignment(raw: RequiredDataAssignment | (Partial<RequiredDataAssignment> & { id: string; projectId: string; fieldName: string; agencyId: string; userId: string; status?: string })) {
  const { agencyId: migratedAgencyId, userId: migratedUserId } = getNormalizedAgencyOwnership(raw.agencyId, raw.userId);
  const normalizedStatus = raw.status === 'complete' || raw.status === 'completed' ? 'complete' : 'incomplete';
  const legacyAttachment = (raw as RequiredDataAssignment & { attachment?: AttachmentItem }).attachment;
  return {
    ...raw,
    agencyId: migratedAgencyId,
    userId: migratedUserId,
    status: normalizedStatus,
    dueDate: raw.dueDate ?? toIsoDate(addDays(new Date(), 10)),
    reminderDaysBefore: raw.reminderDaysBefore === 5 ? 5 : 10,
    attachments: (raw.attachments ?? (legacyAttachment ? [legacyAttachment] : []))
      .filter((item) => item && item.fileName)
      .map((item) => ({
        fileName: item.fileName ?? '',
        fileUrl: item.fileUrl ?? '',
        lastUploadDate: item.lastUploadDate ?? '',
      })),
  } as RequiredDataAssignment;
}

function normalizeProjectJob(raw: ProjectJob | (Partial<ProjectJob> & { id: string; projectId: string; title: string; description: string; agencyId: string; userId: string; status?: string })) {
  const { agencyId: migratedAgencyId, userId: migratedUserId } = getNormalizedAgencyOwnership(raw.agencyId, raw.userId);
  const normalizedStatus = raw.status === 'complete' || raw.status === 'completed' ? 'complete' : 'incomplete';
  const legacyAttachment = (raw as ProjectJob & { attachment?: AttachmentItem }).attachment;
  return {
    ...raw,
    agencyId: migratedAgencyId,
    userId: migratedUserId,
    status: normalizedStatus,
    dueDate: raw.dueDate ?? toIsoDate(addDays(new Date(), 10)),
    reminderDaysBefore: raw.reminderDaysBefore === 5 ? 5 : 10,
    attachments: (raw.attachments ?? (legacyAttachment ? [legacyAttachment] : []))
      .filter((item) => item && item.fileName)
      .map((item) => ({
        fileName: item.fileName ?? '',
        fileNameVi: item.fileNameVi,
        fileNameEn: item.fileNameEn,
        fileUrl: item.fileUrl ?? '',
        lastUploadDate: item.lastUploadDate ?? '',
      })),
  } as ProjectJob;
}

function getRequiredDataAlert(assignment: RequiredDataAssignment) {
  if (assignment.status === 'complete') {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(assignment.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return { type: 'overdue' as const, daysUntilDue };
  }
  if (daysUntilDue === 5) {
    return { type: 'due_5' as const, daysUntilDue };
  }
  if (daysUntilDue === 10) {
    return { type: 'due_10' as const, daysUntilDue };
  }
  return null;
}

function cloneRequiredDataAssignments(): RequiredDataAssignment[] {
  const today = new Date();
  const baseAssignments: RequiredDataAssignment[] = [
    {
      id: 'r1',
      projectId: 'p1',
      fieldName: 'Traffic impact assessment',
      agencyId: 'ag7',
      userId: 'ag7-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 10)),
      reminderDaysBefore: 10,
      note: '',
      attachments: [{
        fileName: 'traffic-impact-draft-v2.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -1)),
      }],
    },
    {
      id: 'r2',
      projectId: 'p1',
      fieldName: 'Land boundary legal review',
      agencyId: 'ag2',
      userId: 'ag2-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 5)),
      reminderDaysBefore: 5,
      note: '',
      attachments: [{
        fileName: 'boundary-review-note.docx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -3)),
      }],
    },
    {
      id: 'r3',
      projectId: 'p2',
      fieldName: 'Grid connection confirmation',
      agencyId: 'ag5',
      userId: 'ag5-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, -3)),
      reminderDaysBefore: 5,
      note: '',
      attachments: [{
        fileName: 'grid-connection-confirmation.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -16)),
      }],
    },
    {
      id: 'r4',
      projectId: 'p2',
      fieldName: 'Fire safety pre-clearance memo',
      agencyId: 'ag8',
      userId: 'ag8-pic-1',
      status: 'complete',
      dueDate: toIsoDate(addDays(today, 14)),
      reminderDaysBefore: 10,
      note: '',
      attachments: [{
        fileName: 'fire-safety-pre-clearance.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -2)),
      }],
    },
  ];

  const agencyBySector: Record<string, string[]> = {
    Infrastructure: ['ag7', 'ag8'],
    Energy: ['ag5', 'ag9'],
    Manufacturing: ['ag5', 'ag8'],
    Tourism: ['ag13', 'ag8'],
    Technology: ['ag14', 'ag10'],
    Agriculture: ['ag6', 'ag9'],
    Healthcare: ['ag3', 'ag8'],
    Logistics: ['ag7', 'ag5'],
    Education: ['ag15', 'ag3'],
  };
  const generatedAssignments = baseProjects
    .filter((project) => Number(project.id.slice(1)) >= 7)
    .flatMap((project, index) => {
      const [primaryAgencyId, secondaryAgencyId] = agencyBySector[project.sector] ?? ['ag6', 'ag17'];
      const assignmentBaseId = 5 + index * 2;
      return [
        {
          id: `r${assignmentBaseId}`,
          projectId: project.id,
          fieldName: `${project.sector} investment brief confirmation`,
          agencyId: primaryAgencyId,
          userId: `${primaryAgencyId}-pic-1`,
          status: index % 4 === 0 ? 'complete' : 'incomplete',
          dueDate: toIsoDate(addDays(today, 6 + (index % 5) * 3)),
          reminderDaysBefore: index % 2 === 0 ? 10 : 5,
          note: 'Mock assignment generated for cross-workspace completeness tracking.',
          attachments: [{
            fileName: `${toKebabCase(project.name)}-investment-brief.pdf`,
            fileUrl: '',
            lastUploadDate: toIsoDate(addDays(today, -(index + 1))),
          }],
        },
        {
          id: `r${assignmentBaseId + 1}`,
          projectId: project.id,
          fieldName: `${project.sector} implementation readiness memo`,
          agencyId: secondaryAgencyId,
          userId: `${secondaryAgencyId}-pic-1`,
          status: index % 3 === 0 ? 'complete' : 'incomplete',
          dueDate: toIsoDate(addDays(today, 10 + (index % 4) * 4)),
          reminderDaysBefore: index % 2 === 0 ? 5 : 10,
          note: 'Mock assignment generated to keep agency and executive summaries aligned.',
          attachments: [{
            fileName: `${toKebabCase(project.name)}-readiness-memo.docx`,
            fileUrl: '',
            lastUploadDate: toIsoDate(addDays(today, -(index + 2))),
          }],
        },
      ];
    });

  return [...baseAssignments, ...generatedAssignments];
}

function cloneProjectJobs(): ProjectJob[] {
  const today = new Date();
  const baseJobs: ProjectJob[] = [
    {
      id: 'pj1',
      projectId: 'p1',
      title: 'Confirm traffic management interface',
      description: 'Validate final intersection phasing and construction detour routing before investor circulation.',
      agencyId: 'ag7',
      userId: 'ag7-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 10)),
      reminderDaysBefore: 10,
      note: 'Awaiting final agency confirmation of frontage traffic sequencing.',
      attachments: [{
        fileName: 'traffic-interface-workplan.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -2)),
      }],
    },
    {
      id: 'pj2',
      projectId: 'p1',
      title: 'Issue land-boundary confirmation note',
      description: 'Issue the signed coordination note confirming surveyed land boundaries for the investor pack.',
      agencyId: 'ag9',
      userId: 'ag9-pic-1',
      status: 'complete',
      dueDate: toIsoDate(addDays(today, 5)),
      reminderDaysBefore: 5,
      note: 'Completed and filed in the project room.',
      attachments: [{
        fileName: 'signed-land-boundary-note.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -1)),
      }],
    },
    {
      id: 'pj3',
      projectId: 'p2',
      title: 'Finalize interconnection work package',
      description: 'Close the agency review on interconnection works, energization dependencies, and handover sequencing.',
      agencyId: 'ag5',
      userId: 'ag5-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, -4)),
      reminderDaysBefore: 10,
      note: 'Overdue mock case for project-processing alerts.',
      attachments: [{
        fileName: 'interconnection-work-package.xlsx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -12)),
      }],
    },
    {
      id: 'pj4',
      projectId: 'p2',
      title: 'Publish fire-safety readiness handoff',
      description: 'Publish the readiness handoff confirming fire-safety preconditions are cleared for the next phase.',
      agencyId: 'ag8',
      userId: 'ag8-pic-1',
      status: 'complete',
      dueDate: toIsoDate(addDays(today, 8)),
      reminderDaysBefore: 5,
      note: 'Completed mock case for processing progress.',
      attachments: [{
        fileName: 'fire-safety-readiness-handoff.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -2)),
      }],
    },
    {
      id: 'pj5',
      projectId: 'p1',
      title: 'Approve digital twin data exchange scope',
      description: 'Align final API boundaries and asset-data ownership for the city digital twin integration package.',
      agencyId: 'ag10',
      userId: 'ag10-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 18)),
      reminderDaysBefore: 10,
      note: 'Technical alignment is still in processing with the transport systems working group.',
      attachments: [{
        fileName: 'digital-twin-api-scope.docx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -4)),
      }],
    },
    {
      id: 'pj6',
      projectId: 'p2',
      title: 'Secure temporary marine logistics corridor',
      description: 'Coordinate vessel access, temporary berthing, and oversized equipment routing for offshore delivery packages.',
      agencyId: 'ag7',
      userId: 'ag7-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 5)),
      reminderDaysBefore: 5,
      note: 'Upcoming coordination window is locked for next week pending final traffic notice.',
      attachments: [{
        fileName: 'marine-logistics-corridor-plan.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -5)),
      }],
    },
    {
      id: 'pj7',
      projectId: 'p2',
      title: 'Close environmental baseline addendum',
      description: 'Finalize the baseline addendum covering updated mangrove and coastal biodiversity observations.',
      agencyId: 'ag9',
      userId: 'ag9-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 16)),
      reminderDaysBefore: 10,
      note: 'Processing with the environmental reviewer before sign-off.',
      attachments: [{
        fileName: 'environmental-baseline-addendum.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -6)),
      }],
    },
    {
      id: 'pj8',
      projectId: 'p3',
      title: 'Issue customs machinery import checklist',
      description: 'Provide the investor-facing checklist for priority production equipment and HS-code verification.',
      agencyId: 'ag5',
      userId: 'ag5-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 10)),
      reminderDaysBefore: 10,
      note: 'Upcoming issue window is synchronized with the first investor procurement batch.',
      attachments: [{
        fileName: 'machinery-import-checklist.xlsx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -3)),
      }],
    },
    {
      id: 'pj9',
      projectId: 'p3',
      title: 'Complete internal road alignment review',
      description: 'Review truck circulation, loading-bay access, and emergency turnaround geometry for the internal road package.',
      agencyId: 'ag7',
      userId: 'ag7-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, -6)),
      reminderDaysBefore: 5,
      note: 'Delayed due to a revised logistics turning-radius requirement from anchor tenants.',
      attachments: [{
        fileName: 'internal-road-alignment-review.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -14)),
      }],
    },
    {
      id: 'pj10',
      projectId: 'p3',
      title: 'Publish utilities handover matrix',
      description: 'Finalize the handover matrix for power, water, telecom, and wastewater connections by sub-zone.',
      agencyId: 'ag8',
      userId: 'ag8-pic-1',
      status: 'complete',
      dueDate: toIsoDate(addDays(today, 12)),
      reminderDaysBefore: 10,
      note: 'Utilities handover matrix has been published in the shared project room.',
      attachments: [{
        fileName: 'utilities-handover-matrix.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -1)),
      }],
    },
    {
      id: 'pj11',
      projectId: 'p4',
      title: 'Confirm waterfront setback decision note',
      description: 'Close the internal decision note on waterfront setbacks, landscape buffer, and public promenade interface.',
      agencyId: 'ag13',
      userId: 'ag13-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 5)),
      reminderDaysBefore: 5,
      note: 'Upcoming decision note is queued for the next inter-agency review meeting.',
      attachments: [{
        fileName: 'waterfront-setback-decision-note.docx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -2)),
      }],
    },
    {
      id: 'pj12',
      projectId: 'p4',
      title: 'Resolve convention center access lane revision',
      description: 'Resolve the revised vehicular access plan for peak event turnover and hotel guest separation.',
      agencyId: 'ag7',
      userId: 'ag7-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, -2)),
      reminderDaysBefore: 10,
      note: 'Delayed while the access-lane alternative is being recalculated.',
      attachments: [{
        fileName: 'convention-access-lane-revision.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -9)),
      }],
    },
    {
      id: 'pj13',
      projectId: 'p4',
      title: 'Prepare hospitality operator briefing pack',
      description: 'Prepare the investor and operator briefing pack covering visitor flow, room mix, and convention phasing.',
      agencyId: 'ag13',
      userId: 'ag13-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 21)),
      reminderDaysBefore: 10,
      note: 'Pack is in processing with the destination marketing team.',
      attachments: [{
        fileName: 'hospitality-operator-briefing-pack.pptx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -4)),
      }],
    },
    {
      id: 'pj14',
      projectId: 'p5',
      title: 'Validate clean-room utility assumptions',
      description: 'Review clean-room utility assumptions, backup power capacity, and early tenant fit-out dependencies.',
      agencyId: 'ag14',
      userId: 'ag14-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 10)),
      reminderDaysBefore: 10,
      note: 'Upcoming validation checkpoint is needed before publication readiness review.',
      attachments: [{
        fileName: 'clean-room-utility-assumptions.xlsx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -1)),
      }],
    },
    {
      id: 'pj15',
      projectId: 'p5',
      title: 'Compile university partnership note',
      description: 'Compile the draft partnership note with nearby universities on talent pipeline and joint lab programming.',
      agencyId: 'ag15',
      userId: 'ag15-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 24)),
      reminderDaysBefore: 10,
      note: 'Still processing internally before the project can move beyond draft.',
      attachments: [{
        fileName: 'university-partnership-note.docx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -7)),
      }],
    },
    {
      id: 'pj16',
      projectId: 'p5',
      title: 'Finalize startup incubation zoning note',
      description: 'Define the permitted incubation uses, maker-space allocation, and shared-services zoning note.',
      agencyId: 'ag3',
      userId: 'ag3-pic-1',
      status: 'complete',
      dueDate: toIsoDate(addDays(today, 14)),
      reminderDaysBefore: 10,
      note: 'Zoning note completed to support the next publication package.',
      attachments: [{
        fileName: 'startup-incubation-zoning-note.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -2)),
      }],
    },
    {
      id: 'pj17',
      projectId: 'p6',
      title: 'Update cold-chain operating model',
      description: 'Refresh the operating model for cold storage, inspection points, and same-day regional dispatch.',
      agencyId: 'ag6',
      userId: 'ag6-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, -8)),
      reminderDaysBefore: 5,
      note: 'Delayed after the commodity-volume assumptions changed in the latest draft.',
      attachments: [{
        fileName: 'cold-chain-operating-model.xlsx',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -15)),
      }],
    },
    {
      id: 'pj18',
      projectId: 'p6',
      title: 'Prepare agri-export traceability checklist',
      description: 'Prepare the initial traceability checklist for export readiness, quality control, and packing standards.',
      agencyId: 'ag6',
      userId: 'ag6-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 5)),
      reminderDaysBefore: 5,
      note: 'Upcoming checklist release is tied to the next draft intake review.',
      attachments: [{
        fileName: 'agri-export-traceability-checklist.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -3)),
      }],
    },
    {
      id: 'pj19',
      projectId: 'p6',
      title: 'Review wastewater pre-treatment concept',
      description: 'Review the pre-treatment concept for agro-processing discharge before external consultation.',
      agencyId: 'ag9',
      userId: 'ag9-pic-1',
      status: 'incomplete',
      dueDate: toIsoDate(addDays(today, 17)),
      reminderDaysBefore: 10,
      note: 'Concept package is still processing with the technical consultant.',
      attachments: [{
        fileName: 'wastewater-pre-treatment-concept.pdf',
        fileUrl: '',
        lastUploadDate: toIsoDate(addDays(today, -6)),
      }],
    },
  ];

  const jobAgencyBySector: Record<string, string[]> = {
    Infrastructure: ['ag7', 'ag8', 'ag3'],
    'Infrastructure & Urban': ['ag7', 'ag8', 'ag3'],
    Energy: ['ag5', 'ag9', 'ag8'],
    'Renewable Energy': ['ag5', 'ag9', 'ag8'],
    'Clean Energy & Environment': ['ag9', 'ag5', 'ag8'],
    'Circular Economy': ['ag9', 'ag5', 'ag8'],
    Manufacturing: ['ag5', 'ag8', 'ag14'],
    'Biotech & Life Sciences': ['ag16', 'ag14', 'ag3'],
    Tourism: ['ag13', 'ag7', 'ag8'],
    'Tourism & Hospitality': ['ag13', 'ag7', 'ag8'],
    Technology: ['ag14', 'ag10', 'ag3'],
    'High-Tech & Digital': ['ag14', 'ag10', 'ag3'],
    'Financial Services': ['ag14', 'ag10', 'ag3'],
    Agriculture: ['ag6', 'ag9', 'ag5'],
    AgriTech: ['ag6', 'ag9', 'ag5'],
    Healthcare: ['ag3', 'ag8', 'ag9'],
    'Healthcare & Pharma': ['ag16', 'ag3', 'ag8'],
    Logistics: ['ag7', 'ag5', 'ag8'],
    'Logistics & Supply Chain': ['ag7', 'ag5', 'ag8'],
    Education: ['ag15', 'ag3', 'ag10'],
    'Education & Training': ['ag15', 'ag3', 'ag10'],
    'Real Estate & Smart Cities': ['ag8', 'ag3', 'ag7'],
    'Affordable Housing': ['ag8', 'ag3', 'ag9'],
  };
  const generatedJobs = baseProjects
    .filter((project) => /^[sm]\d+$/i.test(project.id) || (/^p\d+$/i.test(project.id) && Number(project.id.slice(1)) >= 7))
    .flatMap((project, index) => {
      const [leadAgencyId, coordinationAgencyId, technicalAgencyId] = jobAgencyBySector[project.sector] ?? ['ag3', 'ag8', 'ag10'];
      const jobBaseId = 20 + index * 3;
      const filePrefix = toKebabCase(project.name);
      return [
        {
          id: `pj${jobBaseId}`,
          projectId: project.id,
          title: `Confirm ${project.sector.toLowerCase()} launch package`,
          titleVi: `Xác nhận gói khởi động cho dự án ${project.nameVi ?? project.name}`,
          titleEn: `Confirm ${project.sector.toLowerCase()} launch package`,
          description: `Confirm the investor-facing launch package, phase gates, and coordination dependencies for ${project.name}.`,
          descriptionVi: `Xác nhận bộ hồ sơ công bố cho nhà đầu tư, các cột mốc triển khai và phụ thuộc điều phối của dự án ${project.nameVi ?? project.name}.`,
          descriptionEn: `Confirm the investor-facing launch package, phase gates, and coordination dependencies for ${project.name}.`,
          agencyId: leadAgencyId,
          userId: `${leadAgencyId}-pic-1`,
          status: index % 5 === 0 ? 'complete' : 'incomplete',
          dueDate: toIsoDate(addDays(today, 4 + (index % 4) * 3)),
          reminderDaysBefore: 5,
          note: 'Mock job generated for project list and project detail consistency.',
          noteVi: 'Đầu việc mock được tạo để giữ đồng nhất giữa danh sách dự án và trang chi tiết dự án.',
          noteEn: 'Mock job generated for project list and project detail consistency.',
          attachments: [{
            fileName: `${filePrefix}-launch-package.pdf`,
            fileNameVi: `goi-khoi-dong-${project.id}.pdf`,
            fileNameEn: `${filePrefix}-launch-package.pdf`,
            fileUrl: '',
            lastUploadDate: toIsoDate(addDays(today, -(index + 1))),
          }],
        },
        {
          id: `pj${jobBaseId + 1}`,
          projectId: project.id,
          title: `Coordinate ${project.sector.toLowerCase()} stakeholder note`,
          titleVi: `Điều phối ghi chú liên ngành cho dự án ${project.nameVi ?? project.name}`,
          titleEn: `Coordinate ${project.sector.toLowerCase()} stakeholder note`,
          description: `Coordinate the cross-agency stakeholder note covering sequencing, approvals, and external communication for ${project.name}.`,
          descriptionVi: `Điều phối ghi chú liên ngành về trình tự triển khai, phê duyệt và truyền thông đối ngoại cho dự án ${project.nameVi ?? project.name}.`,
          descriptionEn: `Coordinate the cross-agency stakeholder note covering sequencing, approvals, and external communication for ${project.name}.`,
          agencyId: coordinationAgencyId,
          userId: `${coordinationAgencyId}-pic-1`,
          status: index % 4 === 1 ? 'complete' : 'incomplete',
          dueDate: toIsoDate(addDays(today, 9 + (index % 5) * 2)),
          reminderDaysBefore: 10,
          note: 'Generated mock coordination item for agency processing summaries.',
          noteVi: 'Đầu việc điều phối mock được tạo để mô phỏng báo cáo xử lý của cơ quan phụ trách.',
          noteEn: 'Generated mock coordination item for agency processing summaries.',
          attachments: [{
            fileName: `${filePrefix}-stakeholder-note.docx`,
            fileNameVi: `ghi-chu-lien-nganh-${project.id}.docx`,
            fileNameEn: `${filePrefix}-stakeholder-note.docx`,
            fileUrl: '',
            lastUploadDate: toIsoDate(addDays(today, -(index + 3))),
          }],
        },
        {
          id: `pj${jobBaseId + 2}`,
          projectId: project.id,
          title: `Publish ${project.sector.toLowerCase()} technical readiness memo`,
          titleVi: `Công bố bản ghi nhớ sẵn sàng kỹ thuật cho dự án ${project.nameVi ?? project.name}`,
          titleEn: `Publish ${project.sector.toLowerCase()} technical readiness memo`,
          description: `Publish the technical readiness memo covering utilities, land readiness, and implementation assumptions for ${project.name}.`,
          descriptionVi: `Công bố bản ghi nhớ sẵn sàng kỹ thuật bao gồm hạ tầng tiện ích, hiện trạng đất và các giả định triển khai cho dự án ${project.nameVi ?? project.name}.`,
          descriptionEn: `Publish the technical readiness memo covering utilities, land readiness, and implementation assumptions for ${project.name}.`,
          agencyId: technicalAgencyId,
          userId: `${technicalAgencyId}-pic-1`,
          status: index % 3 === 2 ? 'complete' : 'incomplete',
          dueDate: toIsoDate(addDays(today, 15 + (index % 6) * 2)),
          reminderDaysBefore: 10,
          note: 'Generated mock technical item so executive and agency pages keep the same processing baseline.',
          noteVi: 'Đầu việc kỹ thuật mock được tạo để trang điều hành và cơ quan cùng dùng chung một mốc tiến độ xử lý.',
          noteEn: 'Generated mock technical item so executive and agency pages keep the same processing baseline.',
          attachments: [{
            fileName: `${filePrefix}-technical-readiness.pdf`,
            fileNameVi: `san-sang-ky-thuat-${project.id}.pdf`,
            fileNameEn: `${filePrefix}-technical-readiness.pdf`,
            fileUrl: '',
            lastUploadDate: toIsoDate(addDays(today, -(index + 4))),
          }],
        },
      ];
    });

  return [...baseJobs, ...generatedJobs];
}

function localizeAttachment(item: AttachmentItem, language: Language): AttachmentItem {
  return {
    ...item,
    fileName: language === 'en'
      ? (item.fileNameEn ?? item.fileName)
      : (item.fileNameVi ?? translateText(item.fileName, language)),
  };
}

const baseProjectJobVietnameseCopy: Record<string, {
  titleVi: string;
  descriptionVi: string;
  noteVi?: string;
  attachmentNamesVi?: string[];
}> = {
  pj1: {
    titleVi: 'Xác nhận phương án điều phối giao thông',
    descriptionVi: 'Xác nhận phương án phân luồng nút giao cuối cùng và lộ trình thi công tạm trước khi cung cấp cho nhà đầu tư.',
    noteVi: 'Đang chờ xác nhận cuối cùng của cơ quan phụ trách về trình tự giao thông mặt tiền.',
    attachmentNamesVi: ['ke-hoach-dieu-phoi-giao-thong.pdf'],
  },
  pj2: {
    titleVi: 'Ban hành ghi chú xác nhận ranh giới đất',
    descriptionVi: 'Ban hành ghi chú phối hợp đã ký xác nhận ranh giới khảo sát để đưa vào bộ hồ sơ nhà đầu tư.',
    noteVi: 'Đã hoàn tất và lưu trong phòng dữ liệu dự án.',
    attachmentNamesVi: ['ghi-chu-ranh-gioi-dat-da-ky.pdf'],
  },
  pj3: {
    titleVi: 'Hoàn tất gói công việc đấu nối hạ tầng',
    descriptionVi: 'Khóa vòng rà soát liên cơ quan về hạng mục đấu nối, phụ thuộc cấp điện và trình tự bàn giao.',
    noteVi: 'Tình huống mock quá hạn dùng để mô phỏng cảnh báo xử lý dự án.',
    attachmentNamesVi: ['goi-cong-viec-dau-noi-ha-tang.xlsx'],
  },
  pj4: {
    titleVi: 'Công bố biên bản sẵn sàng phòng cháy chữa cháy',
    descriptionVi: 'Công bố biên bản xác nhận các điều kiện phòng cháy chữa cháy đã sẵn sàng cho giai đoạn tiếp theo.',
    noteVi: 'Trường hợp mock đã hoàn tất dùng để mô phỏng tiến độ xử lý.',
    attachmentNamesVi: ['ban-giao-san-sang-phong-chay.pdf'],
  },
  pj5: {
    titleVi: 'Phê duyệt phạm vi trao đổi dữ liệu digital twin',
    descriptionVi: 'Thống nhất phạm vi API cuối cùng và quyền sở hữu dữ liệu tài sản cho gói tích hợp digital twin của thành phố.',
    noteVi: 'Phần căn chỉnh kỹ thuật vẫn đang được xử lý cùng nhóm hệ thống giao thông.',
    attachmentNamesVi: ['pham-vi-api-digital-twin.docx'],
  },
  pj6: {
    titleVi: 'Bảo đảm hành lang logistics đường thủy tạm thời',
    descriptionVi: 'Điều phối luồng tàu, cầu tạm và tuyến vận chuyển siêu trường siêu trọng cho gói giao hàng ngoài khơi.',
    noteVi: 'Khung điều phối sắp tới đã được khóa lịch cho tuần sau, chờ thông báo giao thông cuối cùng.',
    attachmentNamesVi: ['phuong-an-logistics-duong-thuy.pdf'],
  },
  pj7: {
    titleVi: 'Khóa phụ lục đường cơ sở môi trường',
    descriptionVi: 'Hoàn tất phụ lục đường cơ sở môi trường bao gồm cập nhật quan trắc rừng ngập mặn và đa dạng sinh học ven biển.',
    noteVi: 'Đang được chuyên gia môi trường rà soát trước khi ký xác nhận.',
    attachmentNamesVi: ['phu-luc-duong-co-so-moi-truong.pdf'],
  },
  pj8: {
    titleVi: 'Ban hành checklist nhập khẩu máy móc',
    descriptionVi: 'Cung cấp checklist dành cho nhà đầu tư về thiết bị sản xuất ưu tiên và xác minh mã HS.',
    noteVi: 'Khung xử lý sắp tới đã được đồng bộ với lô mua sắm đầu tiên của nhà đầu tư.',
    attachmentNamesVi: ['checklist-nhap-khau-may-moc.xlsx'],
  },
  pj9: {
    titleVi: 'Hoàn tất rà soát tuyến đường nội bộ',
    descriptionVi: 'Rà soát luồng xe tải, tiếp cận bến bốc dỡ và bán kính quay đầu khẩn cấp cho gói đường nội bộ.',
    noteVi: 'Bị chậm do yêu cầu cập nhật bán kính quay đầu từ nhóm khách thuê mỏ neo.',
    attachmentNamesVi: ['ra-soat-tuyen-duong-noi-bo.pdf'],
  },
  pj10: {
    titleVi: 'Công bố ma trận bàn giao hạ tầng tiện ích',
    descriptionVi: 'Hoàn thiện ma trận bàn giao điện, nước, viễn thông và xử lý nước thải theo từng phân khu.',
    noteVi: 'Ma trận bàn giao hạ tầng tiện ích đã được công bố trong phòng dữ liệu chung của dự án.',
    attachmentNamesVi: ['ma-tran-ban-giao-ha-tang.pdf'],
  },
  pj11: {
    titleVi: 'Xác nhận ghi chú quyết định khoảng lùi bờ sông',
    descriptionVi: 'Khóa ghi chú quyết định nội bộ về khoảng lùi bờ sông, dải cây xanh và giao diện quảng trường đi bộ công cộng.',
    noteVi: 'Ghi chú quyết định sắp tới đã được xếp lịch cho phiên rà soát liên ngành kế tiếp.',
    attachmentNamesVi: ['ghi-chu-khoang-lui-bo-song.docx'],
  },
  pj12: {
    titleVi: 'Xử lý phương án điều chỉnh làn tiếp cận trung tâm hội nghị',
    descriptionVi: 'Xử lý phương án giao thông điều chỉnh cho giờ cao điểm sự kiện và tách luồng khách sạn.',
    noteVi: 'Đang chậm vì phương án thay thế cho làn tiếp cận vẫn đang được tính toán lại.',
    attachmentNamesVi: ['dieu-chinh-lan-tiep-can-trung-tam-hoi-nghi.pdf'],
  },
  pj13: {
    titleVi: 'Chuẩn bị bộ briefing cho đơn vị vận hành du lịch',
    descriptionVi: 'Chuẩn bị bộ briefing cho nhà đầu tư và đơn vị vận hành về luồng khách, cơ cấu phòng và phân kỳ trung tâm hội nghị.',
    noteVi: 'Bộ tài liệu đang được nhóm marketing điểm đến xử lý.',
    attachmentNamesVi: ['bo-briefing-van-hanh-du-lich.pptx'],
  },
  pj14: {
    titleVi: 'Thẩm định giả định tiện ích cho clean-room',
    descriptionVi: 'Rà soát giả định về tiện ích cho clean-room, công suất điện dự phòng và phụ thuộc fit-out sớm của khách thuê.',
    noteVi: 'Cần hoàn thành mốc thẩm định này trước khi rà soát mức sẵn sàng công bố.',
    attachmentNamesVi: ['gia-dinh-tien-ich-clean-room.xlsx'],
  },
  pj15: {
    titleVi: 'Tổng hợp ghi chú hợp tác đại học',
    descriptionVi: 'Tổng hợp dự thảo ghi chú hợp tác với các trường đại học lân cận về nguồn nhân lực và mô hình phòng lab chung.',
    noteVi: 'Vẫn đang xử lý nội bộ trước khi dự án có thể vượt qua giai đoạn draft.',
    attachmentNamesVi: ['ghi-chu-hop-tac-dai-hoc.docx'],
  },
  pj16: {
    titleVi: 'Hoàn tất ghi chú phân khu ươm tạo khởi nghiệp',
    descriptionVi: 'Xác định các công năng ươm tạo được phép, phân bổ maker-space và ghi chú phân khu dịch vụ dùng chung.',
    noteVi: 'Ghi chú phân khu đã hoàn tất để hỗ trợ gói công bố tiếp theo.',
    attachmentNamesVi: ['ghi-chu-phan-khu-uom-tao-khoi-nghiep.pdf'],
  },
  pj17: {
    titleVi: 'Cập nhật mô hình vận hành chuỗi lạnh',
    descriptionVi: 'Làm mới mô hình vận hành cho kho lạnh, điểm kiểm định và điều phối giao hàng trong ngày.',
    noteVi: 'Bị chậm sau khi giả định về sản lượng hàng hóa thay đổi trong bản nháp mới nhất.',
    attachmentNamesVi: ['mo-hinh-van-hanh-chuoi-lanh.xlsx'],
  },
  pj18: {
    titleVi: 'Chuẩn bị checklist truy xuất nguồn gốc nông sản xuất khẩu',
    descriptionVi: 'Chuẩn bị checklist ban đầu cho tính sẵn sàng xuất khẩu, kiểm soát chất lượng và tiêu chuẩn đóng gói.',
    noteVi: 'Việc phát hành checklist sắp tới gắn với vòng rà soát intake draft tiếp theo.',
    attachmentNamesVi: ['checklist-truy-xuat-nong-san.pdf'],
  },
  pj19: {
    titleVi: 'Rà soát phương án tiền xử lý nước thải',
    descriptionVi: 'Rà soát phương án tiền xử lý nước thải cho hoạt động chế biến nông sản trước khi tham vấn bên ngoài.',
    noteVi: 'Gói khái niệm vẫn đang được chuyên gia kỹ thuật xử lý.',
    attachmentNamesVi: ['phuong-an-tien-xu-ly-nuoc-thai.pdf'],
  },
};

function localizeProjectJob(job: ProjectJob, language: Language): ProjectJob {
  const vietnameseCopy = baseProjectJobVietnameseCopy[job.id];
  return {
    ...job,
    title: language === 'en'
      ? (job.titleEn ?? job.title)
      : (job.titleVi ?? vietnameseCopy?.titleVi ?? translateText(job.title, language)),
    description: language === 'en'
      ? (job.descriptionEn ?? job.description)
      : (job.descriptionVi ?? vietnameseCopy?.descriptionVi ?? translateText(job.description, language)),
    note: job.note
      ? (language === 'en'
        ? (job.noteEn ?? job.note)
        : (job.noteVi ?? vietnameseCopy?.noteVi ?? translateText(job.note, language)))
      : job.note,
    attachments: job.attachments?.map((item, index) => {
      if (language === 'vi' && !item.fileNameVi && vietnameseCopy?.attachmentNamesVi?.[index]) {
        return localizeAttachment({ ...item, fileNameVi: vietnameseCopy.attachmentNamesVi[index] }, language);
      }
      return localizeAttachment(item, language);
    }),
  };
}

function cloneProjects() {
  return baseProjects.map((project) => ({
    ...project,
    highlights: [...project.highlights],
    documents: project.documents.map((document) => ({ ...document })),
    qa: project.qa.map((item) => ({ ...item })),
    milestones: project.milestones.map((milestone) => ({ ...milestone })),
  }));
}

function cloneOpportunities() {
  return baseOpportunities.map((opportunity) => ({
    ...opportunity,
    activities: opportunity.activities.map((activity) => ({ ...activity })),
    intakeData: { ...opportunity.intakeData },
  }));
}

function cloneServiceRequests() {
  return baseServiceRequests.map((request) => ({
    ...request,
    documents: [...request.documents],
  }));
}

function cloneIssues() {
  return baseIssues.map((issue) => ({ ...issue }));
}

function clonePermits() {
  return basePermits.map((permit) => ({ ...permit }));
}

function cloneMilestones() {
  return baseMilestones.map((milestone) => ({ ...milestone }));
}

function cloneUsers() {
  return baseUsers.map((user) => ({ ...user, permissions: [...user.permissions] }));
}

function cloneAgencies() {
  return baseAgencies.map((agency) => ({
    ...agency,
    peopleInCharge: agency.peopleInCharge?.map((person) => ({ ...person })),
  }));
}

function normalizeProjectRecord<T extends Pick<Project, 'status' | 'stage'> & Partial<Project>>(project: T): T {
  const normalizedStatus = normalizeProjectStatus(project.status, project.stage);
  return {
    ...project,
    projectType: project.projectType ?? 'public',
    status: normalizedStatus,
    stage: getProjectStageLabel(normalizedStatus, project.stage),
  };
}

const AppContext = createContext<AppContextType>({
  role: null,
  setRole: () => {},
  language: 'vi',
  setLanguage: () => {},
  activeUserId: getDefaultActiveUserId(null),
  setActiveUserId: () => {},
  activeAgencyId: cloneAgencies()[0]?.id ?? '',
  setActiveAgencyId: () => {},
  activeAgency: cloneAgencies()[0] ?? null,
  projects: cloneProjects(),
  opportunities: cloneOpportunities(),
  activeInvestorCompany: 'Korea Infrastructure Partners',
  setActiveInvestorCompany: () => {},
  watchlist: [],
  toggleWatchlist: () => {},
  users: cloneUsers(),
  agencies: cloneAgencies(),
  requiredDataAssignments: cloneRequiredDataAssignments(),
  getProjectDataCompletenessSummary: () => ({ completed: 0, total: 0, percentage: 0 }),
  projectJobs: cloneProjectJobs(),
  getProjectProcessingSummary: () => ({ completed: 0, total: 0, percentage: 0 }),
  issues: cloneIssues(),
  milestones: cloneMilestones(),
  permits: clonePermits(),
  serviceRequests: cloneServiceRequests(),
  addNotification: () => {},
  createProject: () => '',
  updateProject: () => {},
  publishProject: () => {},
  createOpportunity: () => '',
  updateOpportunity: () => {},
  createServiceRequest: () => '',
  updateServiceRequest: () => {},
  createIssue: () => '',
  updateIssue: () => {},
  updatePermit: () => {},
  updateMilestone: () => {},
  createUser: () => '',
  updateUser: () => {},
  createAgency: () => '',
  updateAgency: () => {},
  createRequiredDataAssignment: () => '',
  updateRequiredDataAssignment: () => {},
  deleteRequiredDataAssignment: () => {},
  createProjectJob: () => '',
  updateProjectJob: () => {},
  deleteProjectJob: () => {},
  resetDemoData: () => {},
  notifications: getLocalizedNotifications('vi'),
  markNotificationRead: () => {},
  unreadCount: 3,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    const savedRole = window.localStorage.getItem('hcminvhub-role');
    return savedRole as UserRole | null;
  });
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem('hcminvhub-language');
    return savedLanguage === 'en' || savedLanguage === 'vi' ? savedLanguage : 'vi';
  });
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return window.localStorage.getItem(ACTIVE_USER_KEY) ?? getDefaultActiveUserId(role);
  });
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = window.localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeInvestorCompany, setActiveInvestorCompanyState] = useState(() => {
    return window.localStorage.getItem(ACTIVE_INVESTOR_KEY) || 'Korea Infrastructure Partners';
  });
  const [projectAdditions, setProjectAdditions] = useState<Project[]>(() => {
    const saved = window.localStorage.getItem(PROJECT_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [projectOverrides, setProjectOverrides] = useState<Record<string, Partial<Project>>>(() => {
    const saved = window.localStorage.getItem(PROJECT_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [opportunityAdditions, setOpportunityAdditions] = useState<Opportunity[]>(() => {
    const saved = window.localStorage.getItem(OPPORTUNITY_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [opportunityOverrides, setOpportunityOverrides] = useState<Record<string, Partial<Opportunity>>>(() => {
    const saved = window.localStorage.getItem(OPPORTUNITY_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [serviceRequestAdditions, setServiceRequestAdditions] = useState<ServiceRequest[]>(() => {
    const saved = window.localStorage.getItem(SERVICE_REQUEST_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [serviceRequestOverrides, setServiceRequestOverrides] = useState<Record<string, Partial<ServiceRequest>>>(() => {
    const saved = window.localStorage.getItem(SERVICE_REQUEST_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [issueAdditions, setIssueAdditions] = useState<Issue[]>(() => {
    const saved = window.localStorage.getItem(ISSUE_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [issueOverrides, setIssueOverrides] = useState<Record<string, Partial<Issue>>>(() => {
    const saved = window.localStorage.getItem(ISSUE_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [permitOverrides, setPermitOverrides] = useState<Record<string, Partial<Permit>>>(() => {
    const saved = window.localStorage.getItem(PERMIT_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [milestoneOverrides, setMilestoneOverrides] = useState<Record<string, Partial<Milestone>>>(() => {
    const saved = window.localStorage.getItem(MILESTONE_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [notificationAdditions, setNotificationAdditions] = useState<Notification[]>(() => {
    const saved = window.localStorage.getItem(NOTIFICATION_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [userAdditions, setUserAdditions] = useState<User[]>(() => {
    const saved = window.localStorage.getItem(USER_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [userOverrides, setUserOverrides] = useState<Record<string, Partial<User>>>(() => {
    const saved = window.localStorage.getItem(USER_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [agencyAdditions, setAgencyAdditions] = useState<Agency[]>(() => {
    const saved = window.localStorage.getItem(AGENCY_ADDITIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [agencyOverrides, setAgencyOverrides] = useState<Record<string, Partial<Agency>>>(() => {
    const saved = window.localStorage.getItem(AGENCY_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [activeAgencyId, setActiveAgencyId] = useState<string>(() => {
    return window.localStorage.getItem(ACTIVE_AGENCY_KEY) ?? baseAgencies[0]?.id ?? '';
  });
  const [requiredDataAssignments, setRequiredDataAssignments] = useState<RequiredDataAssignment[]>(() => {
    const saved = window.localStorage.getItem(REQUIRED_DATA_ASSIGNMENTS_KEY);
    return saved ? JSON.parse(saved).map(normalizeRequiredDataAssignment) : cloneRequiredDataAssignments().map(normalizeRequiredDataAssignment);
  });
  const [projectJobs, setProjectJobs] = useState<ProjectJob[]>(() => {
    const saved = window.localStorage.getItem(PROJECT_JOBS_KEY);
    if (!saved) return cloneProjectJobs().map(normalizeProjectJob);
    const parsedJobs = JSON.parse(saved).map(normalizeProjectJob);
    const seedJobs = cloneProjectJobs().map(normalizeProjectJob);
    const parsedJobMap = new Map(parsedJobs.map((item) => [item.id, item]));
    const mergedSeedJobs = seedJobs.map((seedJob) => ({
      ...seedJob,
      ...(parsedJobMap.get(seedJob.id) ?? {}),
      attachments: (parsedJobMap.get(seedJob.id)?.attachments ?? seedJob.attachments)?.map((item) => ({ ...item })),
    }));
    const seedJobIds = new Set(seedJobs.map((item) => item.id));
    const customJobs = parsedJobs.filter((item) => !seedJobIds.has(item.id));
    return [...mergedSeedJobs, ...customJobs];
  });
  const [notifications, setNotifications] = useState<Notification[]>(getLocalizedNotifications('vi'));

  const getProjectDataCompletenessSummary = (projectId: string): ProjectDataCompletenessSummary => {
    const assignments = requiredDataAssignments.filter((item) => item.projectId === projectId);
    const total = assignments.length;
    const completed = assignments.filter((item) => item.status === 'complete').length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const getProjectProcessingSummary = (projectId: string): ProjectProcessingSummary => {
    const jobs = projectJobs.filter((item) => item.projectId === projectId);
    const total = jobs.length;
    const completed = jobs.filter((item) => item.status === 'complete').length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const localizedData = useMemo(() => getLocalizedData(language), [language]);
  const localizedProjectJobs = useMemo(
    () => projectJobs.map((job) => localizeProjectJob(job, language)),
    [projectJobs, language],
  );

  const projects = useMemo(() => {
    return [
      ...localizedData.projects.map((project) => ({
        ...normalizeProjectRecord(project),
        highlights: [...project.highlights],
        documents: project.documents.map((document) => ({ ...document })),
        qa: project.qa.map((item) => ({ ...item })),
        milestones: project.milestones.map((milestone) => ({ ...milestone })),
      })),
      ...projectAdditions.map((project) => normalizeProjectRecord(project)),
    ].map((project) => {
      const mergedProject = normalizeProjectRecord({
        ...project,
        ...(projectOverrides[project.id] ?? {}),
      });
      return {
        ...mergedProject,
        dataCompleteness: getProjectDataCompletenessSummary(mergedProject.id).percentage,
      };
    });
  }, [localizedData.projects, projectAdditions, projectOverrides, requiredDataAssignments]);

  const opportunities = useMemo(() => {
    return [...localizedData.opportunities.map((opportunity) => ({
      ...opportunity,
      activities: opportunity.activities.map((activity) => ({ ...activity })),
      intakeData: { ...opportunity.intakeData },
    })), ...opportunityAdditions].map((opportunity) => ({
      ...opportunity,
      ...(opportunityOverrides[opportunity.id] ?? {}),
    }));
  }, [localizedData.opportunities, opportunityAdditions, opportunityOverrides]);

  const serviceRequests = useMemo(() => {
    return [...localizedData.serviceRequests.map((request) => ({
      ...request,
      documents: [...request.documents],
    })), ...serviceRequestAdditions].map((request) => ({
      ...request,
      ...(serviceRequestOverrides[request.id] ?? {}),
    }));
  }, [localizedData.serviceRequests, serviceRequestAdditions, serviceRequestOverrides]);

  const issues = useMemo(() => {
    return [...localizedData.issues.map((issue) => ({ ...issue })), ...issueAdditions].map((issue) => ({
      ...issue,
      ...(issueOverrides[issue.id] ?? {}),
    }));
  }, [localizedData.issues, issueAdditions, issueOverrides]);

  const permits = useMemo(() => {
    return localizedData.permits.map((permit) => ({
      ...permit,
      ...(permitOverrides[permit.id] ?? {}),
    }));
  }, [localizedData.permits, permitOverrides]);

  const milestones = useMemo(() => {
    return localizedData.milestones.map((milestone) => ({
      ...milestone,
      ...(milestoneOverrides[milestone.id] ?? {}),
    }));
  }, [localizedData.milestones, milestoneOverrides]);

  const users = useMemo(() => {
    return [...localizedData.users.map((user) => ({ ...user, permissions: [...user.permissions] })), ...userAdditions].map((user) => ({
      ...user,
      ...(userOverrides[user.id] ?? {}),
    }));
  }, [localizedData.users, userAdditions, userOverrides]);

  const agencies = useMemo(() => {
    return [...localizedData.agencies.map((agency) => ({
      ...agency,
      peopleInCharge: agency.peopleInCharge?.map((person) => ({ ...person })),
    })), ...agencyAdditions].map((agency) => ({
      ...agency,
      ...(agencyOverrides[agency.id] ?? {}),
      peopleInCharge: (agencyOverrides[agency.id]?.peopleInCharge as typeof agency.peopleInCharge | undefined)
        ?? agency.peopleInCharge?.map((person) => ({ ...person })),
    }));
  }, [localizedData.agencies, agencyAdditions, agencyOverrides]);

  const activeAgency = useMemo(() => {
    return agencies.find((agency) => agency.id === activeAgencyId) ?? agencies[0] ?? null;
  }, [activeAgencyId, agencies]);

  const availableRoleUserIds = useMemo(() => {
    if (role === 'gov_operator') {
      return users
        .filter((user) => user.role === 'Government Operator' && user.status === 'active')
        .map((user) => user.id);
    }
    if (role === 'agency') {
      return activeAgency?.peopleInCharge?.map((person) => `${activeAgency.id}:${person.id}`) ?? [];
    }
    return [getDemoUserIdForRole(role)];
  }, [activeAgency, role, users]);

  const generatedRequiredDataNotifications = useMemo(() => {
    return requiredDataAssignments.flatMap((assignment) => {
      const alert = getRequiredDataAlert(assignment);
      if (!alert) {
        return [];
      }
      const owner = users.find((item) => item.id === assignment.userId);
      const agency = agencies.find((item) => item.id === assignment.agencyId);
      const project = projects.find((item) => item.id === assignment.projectId);
      const path = `${getProjectWorkspaceBasePath(role)}/${assignment.projectId}/edit?focus=data-quality`;

      if (alert.type === 'overdue') {
        return [{
          id: `required-data-${assignment.id}-overdue`,
          title: 'Required Data Overdue',
          message: `${assignment.fieldName} for ${project?.name ?? 'project'} is overdue. Coordinating Unit: ${agency?.shortName ?? 'Agency'}.`,
          time: assignment.dueDate,
          read: false,
          type: 'error' as const,
          path,
        }];
      }

      const reminderDays = alert.type === 'due_5' ? 5 : 10;
      if (assignment.reminderDaysBefore !== reminderDays) {
        return [];
      }

      return [{
        id: `required-data-${assignment.id}-reminder-${reminderDays}`,
        title: 'Required Data Due Soon',
        message: `${assignment.fieldName} for ${project?.name ?? 'project'} is due in ${reminderDays} days. Coordinating Unit: ${agency?.shortName ?? 'Agency'}.`,
        time: assignment.dueDate,
        read: false,
        type: 'warning' as const,
        path,
      }];
    });
  }, [agencies, projects, requiredDataAssignments, users]);

  useEffect(() => {
    setNotifications((previous) => {
      const localized = getLocalizedNotifications(language);
      const merged = [...notificationAdditions, ...generatedRequiredDataNotifications, ...localized];
      return merged.map((item) => {
        const existing = previous.find((notification) => notification.id === item.id);
        return existing ? { ...item, read: existing.read } : item;
      });
    });
  }, [generatedRequiredDataNotifications, language, notificationAdditions]);

  useEffect(() => {
    if (role) {
      window.localStorage.setItem('hcminvhub-role', role);
      return;
    }
    window.localStorage.removeItem('hcminvhub-role');
  }, [role]);

  useEffect(() => {
    window.localStorage.setItem('hcminvhub-language', language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_INVESTOR_KEY, activeInvestorCompany);
  }, [activeInvestorCompany]);

  useEffect(() => {
    if (!activeAgencyId || !agencies.some((agency) => agency.id === activeAgencyId)) {
      const fallbackAgencyId = agencies[0]?.id ?? '';
      if (fallbackAgencyId && fallbackAgencyId !== activeAgencyId) {
        setActiveAgencyId(fallbackAgencyId);
      }
    }
  }, [activeAgencyId, agencies]);

  useEffect(() => {
    if (activeAgencyId) {
      window.localStorage.setItem(ACTIVE_AGENCY_KEY, activeAgencyId);
      return;
    }
    window.localStorage.removeItem(ACTIVE_AGENCY_KEY);
  }, [activeAgencyId]);

  useEffect(() => {
    const fallbackUserId = getDefaultActiveUserId(role, activeAgency);
    if (!activeUserId || !availableRoleUserIds.includes(activeUserId)) {
      const migratedUserId = availableRoleUserIds.find((item) => item.endsWith(`:${activeUserId}`));
      const nextUserId = migratedUserId ?? availableRoleUserIds[0] ?? fallbackUserId;
      if (nextUserId && nextUserId !== activeUserId) {
        setActiveUserId(nextUserId);
      }
    }
  }, [activeAgency, activeUserId, availableRoleUserIds, role]);

  useEffect(() => {
    if (activeUserId) {
      window.localStorage.setItem(ACTIVE_USER_KEY, activeUserId);
      return;
    }
    window.localStorage.removeItem(ACTIVE_USER_KEY);
  }, [activeUserId]);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_ADDITIONS_KEY, JSON.stringify(projectAdditions));
  }, [projectAdditions]);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_OVERRIDES_KEY, JSON.stringify(projectOverrides));
  }, [projectOverrides]);

  useEffect(() => {
    window.localStorage.setItem(OPPORTUNITY_ADDITIONS_KEY, JSON.stringify(opportunityAdditions));
  }, [opportunityAdditions]);

  useEffect(() => {
    window.localStorage.setItem(OPPORTUNITY_OVERRIDES_KEY, JSON.stringify(opportunityOverrides));
  }, [opportunityOverrides]);

  useEffect(() => {
    window.localStorage.setItem(SERVICE_REQUEST_ADDITIONS_KEY, JSON.stringify(serviceRequestAdditions));
  }, [serviceRequestAdditions]);

  useEffect(() => {
    window.localStorage.setItem(SERVICE_REQUEST_OVERRIDES_KEY, JSON.stringify(serviceRequestOverrides));
  }, [serviceRequestOverrides]);

  useEffect(() => {
    window.localStorage.setItem(ISSUE_ADDITIONS_KEY, JSON.stringify(issueAdditions));
  }, [issueAdditions]);

  useEffect(() => {
    window.localStorage.setItem(ISSUE_OVERRIDES_KEY, JSON.stringify(issueOverrides));
  }, [issueOverrides]);

  useEffect(() => {
    window.localStorage.setItem(PERMIT_OVERRIDES_KEY, JSON.stringify(permitOverrides));
  }, [permitOverrides]);

  useEffect(() => {
    window.localStorage.setItem(MILESTONE_OVERRIDES_KEY, JSON.stringify(milestoneOverrides));
  }, [milestoneOverrides]);

  useEffect(() => {
    window.localStorage.setItem(NOTIFICATION_ADDITIONS_KEY, JSON.stringify(notificationAdditions));
  }, [notificationAdditions]);

  useEffect(() => {
    window.localStorage.setItem(USER_ADDITIONS_KEY, JSON.stringify(userAdditions));
  }, [userAdditions]);

  useEffect(() => {
    window.localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(userOverrides));
  }, [userOverrides]);

  useEffect(() => {
    window.localStorage.setItem(AGENCY_ADDITIONS_KEY, JSON.stringify(agencyAdditions));
  }, [agencyAdditions]);

  useEffect(() => {
    window.localStorage.setItem(AGENCY_OVERRIDES_KEY, JSON.stringify(agencyOverrides));
  }, [agencyOverrides]);

  useEffect(() => {
    window.localStorage.setItem(REQUIRED_DATA_ASSIGNMENTS_KEY, JSON.stringify(requiredDataAssignments));
  }, [requiredDataAssignments]);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_JOBS_KEY, JSON.stringify(projectJobs));
  }, [projectJobs]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addNotification: AppContextType['addNotification'] = (notification) => {
    const created: Notification = {
      id: `n${Date.now()}`,
      read: false,
      time: notification.time ?? 'Just now',
      ...notification,
    };
    setNotificationAdditions((current) => [created, ...current].slice(0, 20));
    setNotifications((current) => [created, ...current].slice(0, 20));
  };

  const toggleWatchlist = (projectId: string) => {
    setWatchlist((current) => (current.includes(projectId) ? current.filter((item) => item !== projectId) : [...current, projectId]));
  };

  const setActiveInvestorCompany = (company: string) => {
    if (!company.trim()) return;
    setActiveInvestorCompanyState(company.trim());
  };

  const createProject: AppContextType['createProject'] = (project) => {
    const projectId = `p${Date.now()}`;
    const createdProject: Project = normalizeProjectRecord({
      id: projectId,
      createdByUserId: getUserIdFromActiveWorkspaceUser(activeUserId, role) || getDemoUserIdForRole(role),
      ownerAgencyId: project.ownerAgencyId ?? activeAgencyId ?? agencies[0]?.id,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      projectType: project.projectType ?? 'public',
      followers: 0,
      dataCompleteness: 0,
      highlights: project.highlights ?? [],
      documents: project.documents?.map((document) => ({ ...document })) ?? [],
      qa: [],
      milestones: [],
      image: project.image ?? 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      sector_tag_color: project.sector_tag_color ?? 'bg-sky-100 text-sky-700',
      ...project,
    });
    setProjectAdditions((current) => [...current, createdProject]);
    addNotification({
      title: 'Project Draft Created',
      message: `${createdProject.name} has been added as a draft project.`,
      type: 'info',
      path: `${getProjectWorkspaceBasePath(role)}/${createdProject.id}/edit`,
    });
    return projectId;
  };

  const updateProject: AppContextType['updateProject'] = (projectId, changes) => {
    const normalizedChanges =
      'status' in changes || 'stage' in changes
        ? normalizeProjectRecord({
            status: String(changes.status ?? ''),
            stage: String(changes.stage ?? ''),
            updatedAt: new Date().toISOString().split('T')[0],
            ...changes,
          })
        : {
            ...changes,
            updatedAt: new Date().toISOString().split('T')[0],
          };
    setProjectOverrides((current) => ({
      ...current,
      [projectId]: {
        ...(current[projectId] ?? {}),
        ...normalizedChanges,
      },
    }));
  };

  const publishProject = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    updateProject(projectId, {
      status: 'published',
      stage: 'Published',
      publishedAt: new Date().toISOString().split('T')[0],
    });
    if (project) {
      addNotification({
        title: 'Project Published',
        message: `${project.name} is now visible in the explorer.`,
        type: 'success',
        path: `${getProjectWorkspaceBasePath(role)}/${project.id}`,
      });
    }
  };

  const createOpportunity: AppContextType['createOpportunity'] = (opportunity) => {
    const now = new Date();
    const opportunityId = `o${Date.now()}`;
    const createdOpportunity: Opportunity = {
      id: opportunityId,
      submittedAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0],
      activities: [
        {
          id: `a${Date.now()}`,
          type: 'intake',
          description: 'Intake form submitted',
          by: 'System',
          at: now.toLocaleString(),
        },
      ],
      ...opportunity,
    };
    setOpportunityAdditions((current) => [...current, createdOpportunity]);
    addNotification({
      title: 'New Opportunity',
      message: `${createdOpportunity.investorCompany} submitted an intake for ${createdOpportunity.projectName}.`,
      type: 'info',
      path: `${getOpportunityWorkspaceBasePath(role)}/${createdOpportunity.id}`,
    });
    return opportunityId;
  };

  const updateOpportunity: AppContextType['updateOpportunity'] = (opportunityId, changes, activity) => {
    setOpportunityOverrides((current) => {
      const existing = current[opportunityId] ?? {};
      const currentOpportunity = opportunities.find((item) => item.id === opportunityId);
      const previousActivities = (existing.activities as Opportunity['activities'] | undefined) ?? currentOpportunity?.activities ?? [];
      return {
        ...current,
        [opportunityId]: {
          ...existing,
          ...changes,
          updatedAt: new Date().toISOString().split('T')[0],
          ...(activity ? { activities: [...previousActivities, activity] } : {}),
        },
      };
    });
  };

  const createServiceRequest: AppContextType['createServiceRequest'] = (request) => {
    const now = new Date();
    const id = `sr${Date.now()}`;
    const createdRequest: ServiceRequest = {
      id,
      submittedAt: now.toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'submitted',
      slaStatus: 'on_track',
      ...request,
    };
    setServiceRequestAdditions((current) => [...current, createdRequest]);
    addNotification({
      title: 'Service Request Submitted',
      message: `${createdRequest.serviceName} was submitted for ${createdRequest.projectName}.`,
      type: 'info',
      path: `/agency/service-workflow?highlight=${createdRequest.id}`,
    });
    return id;
  };

  const updateServiceRequest: AppContextType['updateServiceRequest'] = (requestId, changes) => {
    const existingRequest = serviceRequests.find((item) => item.id === requestId);
    setServiceRequestOverrides((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] ?? {}),
        ...changes,
      },
    }));
    if (existingRequest && changes.status && changes.status !== existingRequest.status) {
      addNotification({
        title: 'Service Workflow Updated',
        message: `${existingRequest.serviceName} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'approved' ? 'success' : changes.status === 'info_required' ? 'warning' : 'info',
        path: `/investor/service-requests?highlight=${existingRequest.id}`,
      });
    }
  };

  const createIssue: AppContextType['createIssue'] = (issue) => {
    const now = new Date().toISOString().split('T')[0];
    const id = `i${Date.now()}`;
    const createdIssue: Issue = {
      id,
      reportedAt: now,
      updatedAt: now,
      ...issue,
    };
    setIssueAdditions((current) => [...current, createdIssue]);
    addNotification({
      title: 'Support / Issue Logged',
      message: `${createdIssue.title} has been added to the issue queue.`,
      type: createdIssue.priority === 'critical' ? 'error' : 'warning',
      path: `/agency/issues?highlight=${createdIssue.id}`,
    });
    return id;
  };

  const updateIssue: AppContextType['updateIssue'] = (issueId, changes) => {
    const existingIssue = issues.find((item) => item.id === issueId);
    setIssueOverrides((current) => ({
      ...current,
      [issueId]: {
        ...(current[issueId] ?? {}),
        ...changes,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    }));
    if (existingIssue && changes.status && changes.status !== existingIssue.status) {
      addNotification({
        title: 'Issue Updated',
        message: `${existingIssue.title} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'resolved' || changes.status === 'closed' ? 'success' : 'info',
        path: `/agency/issues?highlight=${existingIssue.id}`,
      });
    }
  };

  const updatePermit: AppContextType['updatePermit'] = (permitId, changes) => {
    const existingPermit = permits.find((item) => item.id === permitId);
    setPermitOverrides((current) => ({
      ...current,
      [permitId]: {
        ...(current[permitId] ?? {}),
        ...changes,
      },
    }));
    if (existingPermit && changes.status && changes.status !== existingPermit.status) {
      addNotification({
        title: 'Permit Workflow Updated',
        message: `${existingPermit.type} for ${existingPermit.projectName} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'approved' ? 'success' : changes.status === 'info_required' ? 'warning' : 'info',
        path: `/agency/permits?highlight=${existingPermit.id}`,
      });
    }
  };

  const updateMilestone: AppContextType['updateMilestone'] = (milestoneId, changes) => {
    const existingMilestone = milestones.find((item) => item.id === milestoneId);
    setMilestoneOverrides((current) => ({
      ...current,
      [milestoneId]: {
        ...(current[milestoneId] ?? {}),
        ...changes,
      },
    }));
    if (existingMilestone && changes.status && changes.status !== existingMilestone.status) {
      addNotification({
        title: 'Milestone Updated',
        message: `${existingMilestone.phase} for ${existingMilestone.projectName ?? 'project'} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'completed' ? 'success' : changes.status === 'delayed' ? 'warning' : 'info',
        path: `/agency/milestones?highlight=${existingMilestone.id}`,
      });
    }
  };

  const createUser: AppContextType['createUser'] = (user) => {
    const id = `u${Date.now()}`;
    const createdUser: User = {
      id,
      lastLogin: 'Never',
      ...user,
    };
    setUserAdditions((current) => [...current, createdUser]);
    addNotification({
        title: 'User Created',
        message: `${createdUser.name} was added to the platform.`,
        type: 'success',
        path: `/admin/roles?highlight=${createdUser.id}`,
      });
    return id;
  };

  const updateUser: AppContextType['updateUser'] = (userId, changes) => {
    const existingUser = users.find((item) => item.id === userId);
    setUserOverrides((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] ?? {}),
        ...changes,
      },
    }));
    if (existingUser && changes.status && changes.status !== existingUser.status) {
      addNotification({
        title: 'User Access Updated',
        message: `${existingUser.name} is now ${changes.status}.`,
        type: changes.status === 'active' ? 'success' : 'warning',
        path: `/admin/roles?highlight=${existingUser.id}`,
      });
    }
  };

  const createAgency: AppContextType['createAgency'] = (agency) => {
    const id = `ag${Date.now()}`;
    const createdAgency: Agency = {
      id,
      activeRequests: 0,
      ...agency,
    };
    setAgencyAdditions((current) => [...current, createdAgency]);
    addNotification({
        title: 'Agency Created',
        message: `${createdAgency.name} was added to the platform.`,
        type: 'success',
        path: `/admin/agencies?highlight=${createdAgency.id}`,
      });
    return id;
  };

  const updateAgency: AppContextType['updateAgency'] = (agencyId, changes) => {
    const existingAgency = agencies.find((item) => item.id === agencyId);
    setAgencyOverrides((current) => ({
      ...current,
      [agencyId]: {
        ...(current[agencyId] ?? {}),
        ...changes,
      },
    }));
    if (existingAgency && changes.status && changes.status !== existingAgency.status) {
      addNotification({
        title: 'Agency Status Updated',
        message: `${existingAgency.name} is now ${changes.status}.`,
        type: changes.status === 'active' ? 'success' : 'warning',
        path: `/admin/agencies?highlight=${existingAgency.id}`,
      });
    }
  };

  const createRequiredDataAssignment: AppContextType['createRequiredDataAssignment'] = (assignment) => {
    const id = `rd${Date.now()}`;
    const createdAssignment: RequiredDataAssignment = {
      id,
      ...normalizeRequiredDataAssignment({ id, ...assignment }),
    };
    setRequiredDataAssignments((current) => [...current, createdAssignment]);
    const agency = agencies.find((item) => item.id === assignment.agencyId);
    const user = users.find((item) => item.id === assignment.userId);
    addNotification({
      title: 'Required Data Assignment Created',
        message: `${assignment.fieldName} was assigned to ${user?.name ?? 'the coordinating unit contact'} in ${agency?.shortName ?? 'agency'}.`,
      type: 'info',
      path: `${getProjectWorkspaceBasePath(role)}/${assignment.projectId}/edit?focus=data-quality`,
    });
    return id;
  };

  const updateRequiredDataAssignment: AppContextType['updateRequiredDataAssignment'] = (assignmentId, changes) => {
    const existingAssignment = requiredDataAssignments.find((item) => item.id === assignmentId);
    setRequiredDataAssignments((current) =>
      current.map((item) => (item.id === assignmentId ? normalizeRequiredDataAssignment({ ...item, ...changes }) : item)),
    );
    if (existingAssignment && changes.status && changes.status !== existingAssignment.status) {
      addNotification({
        title: 'Required Data Assignment Updated',
        message: `${existingAssignment.fieldName} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'complete' ? 'success' : 'info',
        path: `${getProjectWorkspaceBasePath(role)}/${existingAssignment.projectId}/edit?focus=data-quality`,
      });
    }
  };

  const deleteRequiredDataAssignment: AppContextType['deleteRequiredDataAssignment'] = (assignmentId) => {
    setRequiredDataAssignments((current) => current.filter((item) => item.id !== assignmentId));
  };

  const createProjectJob: AppContextType['createProjectJob'] = (job) => {
    const id = `pj${Date.now()}`;
    const createdJob: ProjectJob = {
      id,
      ...normalizeProjectJob({ id, ...job }),
    };
    setProjectJobs((current) => [...current, createdJob]);
    const agency = agencies.find((item) => item.id === job.agencyId);
    const user = users.find((item) => item.id === job.userId);
    addNotification({
      title: 'Project Job Created',
        message: `${job.title} was assigned to ${user?.name ?? 'the coordinating unit contact'} in ${agency?.shortName ?? 'agency'}.`,
      type: 'info',
      path: `${getProjectWorkspaceBasePath(role)}/${job.projectId}/edit`,
    });
    return id;
  };

  const updateProjectJob: AppContextType['updateProjectJob'] = (jobId, changes) => {
    const existingJob = projectJobs.find((item) => item.id === jobId);
    setProjectJobs((current) =>
      current.map((item) => (item.id === jobId ? normalizeProjectJob({ ...item, ...changes }) : item)),
    );
    if (existingJob && changes.status && changes.status !== existingJob.status) {
      addNotification({
        title: 'Project Job Updated',
        message: `${existingJob.title} moved to ${String(changes.status).replace('_', ' ')}.`,
        type: changes.status === 'complete' ? 'success' : 'info',
        path: `${getProjectWorkspaceBasePath(role)}/${existingJob.projectId}/edit`,
      });
    }
  };

  const deleteProjectJob: AppContextType['deleteProjectJob'] = (jobId) => {
    setProjectJobs((current) => current.filter((item) => item.id !== jobId));
  };

  const resetDemoData = () => {
    DEMO_DATA_KEYS.forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        activeUserId,
        setActiveUserId,
        activeAgencyId,
        setActiveAgencyId,
        activeAgency,
        projects,
        opportunities,
        activeInvestorCompany,
        setActiveInvestorCompany,
        watchlist,
        toggleWatchlist,
        users,
        agencies,
        requiredDataAssignments,
        getProjectDataCompletenessSummary,
        projectJobs: localizedProjectJobs,
        getProjectProcessingSummary,
        issues,
        milestones,
        permits,
        serviceRequests,
        addNotification,
        createProject,
        updateProject,
        publishProject,
        createOpportunity,
        updateOpportunity,
        createServiceRequest,
        updateServiceRequest,
        createIssue,
        updateIssue,
        updatePermit,
        updateMilestone,
        createUser,
        updateUser,
        createAgency,
        updateAgency,
        createRequiredDataAssignment,
        updateRequiredDataAssignment,
        deleteRequiredDataAssignment,
        createProjectJob,
        updateProjectJob,
        deleteProjectJob,
        resetDemoData,
        notifications,
        markNotificationRead,
        unreadCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
