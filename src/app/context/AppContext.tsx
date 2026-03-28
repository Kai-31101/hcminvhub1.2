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
import { getLocalizedData, getLocalizedNotifications, Language } from '../utils/localization';

export type UserRole = 'investor' | 'gov_operator' | 'agency' | 'admin' | 'executive';

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
  description: string;
  agencyId: string;
  userId: string;
  status: 'incomplete' | 'complete';
  dueDate: string;
  reminderDaysBefore: 5 | 10;
  note?: string;
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
  createProject: (project: Omit<Project, 'id' | 'followers' | 'dataCompleteness' | 'documents' | 'qa' | 'milestones' | 'highlights' | 'sector_tag_color' | 'image'> & Partial<Pick<Project, 'image' | 'sector_tag_color' | 'highlights'>>) => string;
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

function normalizeRequiredDataAssignment(raw: RequiredDataAssignment | (Partial<RequiredDataAssignment> & { id: string; projectId: string; fieldName: string; agencyId: string; userId: string; status?: string })) {
  const normalizedStatus = raw.status === 'complete' || raw.status === 'completed' ? 'complete' : 'incomplete';
  const legacyAttachment = (raw as RequiredDataAssignment & { attachment?: AttachmentItem }).attachment;
  return {
    ...raw,
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
  const normalizedStatus = raw.status === 'complete' || raw.status === 'completed' ? 'complete' : 'incomplete';
  const legacyAttachment = (raw as ProjectJob & { attachment?: AttachmentItem }).attachment;
  return {
    ...raw,
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
  return [
    {
      id: 'r1',
      projectId: 'p1',
      fieldName: 'Traffic impact assessment',
      agencyId: 'ag1',
      userId: 'u3',
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
      userId: 'u4',
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
      agencyId: 'ag1',
      userId: 'u3',
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
      agencyId: 'ag2',
      userId: 'u4',
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
}

function cloneProjectJobs(): ProjectJob[] {
  const today = new Date();
  return [
    {
      id: 'pj1',
      projectId: 'p1',
      title: 'Confirm traffic management interface',
      description: 'Validate final intersection phasing and construction detour routing before investor circulation.',
      agencyId: 'ag1',
      userId: 'u3',
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
      agencyId: 'ag2',
      userId: 'u4',
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
      agencyId: 'ag1',
      userId: 'u3',
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
      agencyId: 'ag2',
      userId: 'u4',
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
  ];
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
  return baseAgencies.map((agency) => ({ ...agency }));
}

const AppContext = createContext<AppContextType>({
  role: null,
  setRole: () => {},
  language: 'vi',
  setLanguage: () => {},
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
  const [requiredDataAssignments, setRequiredDataAssignments] = useState<RequiredDataAssignment[]>(() => {
    const saved = window.localStorage.getItem(REQUIRED_DATA_ASSIGNMENTS_KEY);
    return saved ? JSON.parse(saved).map(normalizeRequiredDataAssignment) : cloneRequiredDataAssignments();
  });
  const [projectJobs, setProjectJobs] = useState<ProjectJob[]>(() => {
    const saved = window.localStorage.getItem(PROJECT_JOBS_KEY);
    return saved ? JSON.parse(saved).map(normalizeProjectJob) : cloneProjectJobs();
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

  const projects = useMemo(() => {
    return [
      ...localizedData.projects.map((project) => ({
        ...project,
        highlights: [...project.highlights],
        documents: project.documents.map((document) => ({ ...document })),
        qa: project.qa.map((item) => ({ ...item })),
        milestones: project.milestones.map((milestone) => ({ ...milestone })),
      })),
      ...projectAdditions,
    ].map((project) => {
      const mergedProject = {
        ...project,
        ...(projectOverrides[project.id] ?? {}),
      };
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
    return [...localizedData.agencies.map((agency) => ({ ...agency })), ...agencyAdditions].map((agency) => ({
      ...agency,
      ...(agencyOverrides[agency.id] ?? {}),
    }));
  }, [localizedData.agencies, agencyAdditions, agencyOverrides]);

  const generatedRequiredDataNotifications = useMemo(() => {
    return requiredDataAssignments.flatMap((assignment) => {
      const alert = getRequiredDataAlert(assignment);
      if (!alert) {
        return [];
      }
      const owner = users.find((item) => item.id === assignment.userId);
      const agency = agencies.find((item) => item.id === assignment.agencyId);
      const project = projects.find((item) => item.id === assignment.projectId);
      const path = `/gov/projects/${assignment.projectId}/edit?focus=data-quality`;

      if (alert.type === 'overdue') {
        return [{
          id: `required-data-${assignment.id}-overdue`,
          title: 'Required Data Overdue',
          message: `${assignment.fieldName} for ${project?.name ?? 'project'} is overdue. PIC: ${owner?.name ?? 'Unassigned'} (${agency?.shortName ?? 'Agency'}).`,
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
        message: `${assignment.fieldName} for ${project?.name ?? 'project'} is due in ${reminderDays} days. PIC: ${owner?.name ?? 'Unassigned'} (${agency?.shortName ?? 'Agency'}).`,
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
      const createdProject: Project = {
        id: projectId,
        followers: 0,
        dataCompleteness: 0,
        highlights: project.highlights ?? [],
        documents: [],
        qa: [],
        milestones: [],
      image: project.image ?? 'https://images.unsplash.com/photo-1768364635815-01516ab502f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      sector_tag_color: project.sector_tag_color ?? 'bg-sky-100 text-sky-700',
      ...project,
    };
    setProjectAdditions((current) => [...current, createdProject]);
    addNotification({
      title: 'Project Draft Created',
      message: `${createdProject.name} has been added as a draft project.`,
      type: 'info',
      path: `/gov/projects/${createdProject.id}/edit`,
    });
    return projectId;
  };

  const updateProject: AppContextType['updateProject'] = (projectId, changes) => {
    setProjectOverrides((current) => ({
      ...current,
      [projectId]: {
        ...(current[projectId] ?? {}),
        ...changes,
      },
    }));
  };

  const publishProject = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    updateProject(projectId, {
      status: 'published',
      stage: 'Open for Investment',
      publishedAt: new Date().toISOString().split('T')[0],
    });
    if (project) {
      addNotification({
        title: 'Project Published',
        message: `${project.name} is now visible in the explorer.`,
        type: 'success',
        path: `/gov/projects/${project.id}`,
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
      path: `/gov/opportunities/${createdOpportunity.id}`,
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
      message: `${assignment.fieldName} was assigned to ${user?.name ?? 'owner'} in ${agency?.shortName ?? 'agency'}.`,
      type: 'info',
      path: `/gov/projects/${assignment.projectId}/edit?focus=data-quality`,
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
        path: `/gov/projects/${existingAssignment.projectId}/edit?focus=data-quality`,
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
      message: `${job.title} was assigned to ${user?.name ?? 'owner'} in ${agency?.shortName ?? 'agency'}.`,
      type: 'info',
      path: `/gov/projects/${job.projectId}/edit`,
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
        path: `/gov/projects/${existingJob.projectId}/edit`,
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
        projectJobs,
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
