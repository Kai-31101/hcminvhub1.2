import React, { createContext, useContext, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { Language } from '../utils/localization';

export type ConfidentialityLevel = 'Standard' | 'ChairmanOnly';
export type RequestCaseType = 'chairman_report' | 'investment_support' | 'meeting_request' | 'project_question' | 'project_update';
export type RequestCaseStatus = 'new' | 'triage' | 'assigned' | 'responded' | 'closed';
export type SlaStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Responded' | 'Closed';
export type RequestMessageChannel = 'Investor Portal' | 'ITPC Portal' | 'Agency Lite Portal' | 'Executive Portal';

export interface RequestMessage {
  id: string;
  caseId: string;
  senderRole: 'Investor' | 'ITPC' | 'Agency' | 'Chairman';
  senderName: string;
  senderOrganization: string;
  receiverRole: 'Investor' | 'ITPC' | 'Agency' | 'Chairman';
  receiverOrganization: string;
  body: string;
  channel: RequestMessageChannel;
  createdAt: string;
  attachments: string[];
}

export interface RequestAssignment {
  id: string;
  caseId: string;
  assignedAgencyId?: string;
  assignedAgencyName?: string;
  itpcOwner: string;
  assignedAt: string;
}

export interface RequestCase {
  id: string;
  type: RequestCaseType;
  confidentiality: ConfidentialityLevel;
  status: RequestCaseStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  subject: string;
  projectId?: string;
  projectName?: string;
  investorName: string;
  investorEmail: string;
  investorCompany: string;
  submittedAt: string;
  dueAt: string;
  firstResponseAt?: string;
  latestResponseAt?: string;
  assignedAgencyId?: string;
  assignedAgencyName?: string;
  createdBy: string;
}

export interface SlaRule {
  requestType: RequestCaseType;
  label: string;
  responseHours: number;
  atRiskHoursBeforeDue: number;
}

type CreateChairmanReportInput = {
  projectId?: string;
  projectName?: string;
  subject: string;
  message: string;
  investorName: string;
  investorEmail: string;
  investorCompany: string;
  attachments?: string[];
};

interface GovernanceContextType {
  requestCases: RequestCase[];
  requestMessages: RequestMessage[];
  requestAssignments: RequestAssignment[];
  slaRules: SlaRule[];
  createChairmanReport: (input: CreateChairmanReportInput) => string;
  routeCaseToAgency: (caseId: string, agencyId: string, note: string) => void;
  addCaseMessage: (caseId: string, message: Omit<RequestMessage, 'id' | 'caseId' | 'createdAt'>) => void;
  updateCaseStatus: (caseId: string, status: RequestCaseStatus) => void;
  getSlaStatus: (requestCase: RequestCase) => SlaStatus;
  getSlaTimeCounter: (requestCase: RequestCase, language?: Language) => string;
  getVisibleCasesForAgency: (agencyId?: string) => RequestCase[];
  getOperationalCasesForUbnd: () => RequestCase[];
  getChairmanOnlyCases: () => RequestCase[];
}

const GovernanceContext = createContext<GovernanceContextType | null>(null);
const REQUEST_CASES_KEY = 'hcminvhub-request-cases-v1';
const REQUEST_MESSAGES_KEY = 'hcminvhub-request-messages-v1';
const REQUEST_ASSIGNMENTS_KEY = 'hcminvhub-request-assignments-v1';

const slaRules: SlaRule[] = [
  { requestType: 'chairman_report', label: 'Chairman confidential report', responseHours: 24, atRiskHoursBeforeDue: 6 },
  { requestType: 'investment_support', label: 'Investment support', responseHours: 72, atRiskHoursBeforeDue: 12 },
  { requestType: 'meeting_request', label: 'Meeting request', responseHours: 48, atRiskHoursBeforeDue: 8 },
  { requestType: 'project_question', label: 'Project question', responseHours: 48, atRiskHoursBeforeDue: 8 },
  { requestType: 'project_update', label: 'Project update request', responseHours: 96, atRiskHoursBeforeDue: 24 },
];

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function formatDateTime(date: Date) {
  return date.toISOString();
}

function buildSeedCases(): RequestCase[] {
  const now = new Date();
  const supportDue = addHours(now, 72);
  const interestDue = addHours(now, 48);
  const meetingDue = addHours(now, 48);
  const questionDue = addHours(now, 48);
  const chairmanDue = addHours(now, 24);
  return [
    {
      id: 'rc-chairman-001',
      type: 'chairman_report',
      confidentiality: 'ChairmanOnly',
      status: 'new',
      priority: 'Critical',
      subject: 'Confidential concern on project response delay',
      projectId: 'p1',
      projectName: 'Ho Chi Minh City Smart Infrastructure Hub',
      investorName: 'Kim Jae-won',
      investorEmail: 'kjw@kip.co.kr',
      investorCompany: 'Korea Infrastructure Partners',
      submittedAt: formatDateTime(addHours(now, -5)),
      dueAt: formatDateTime(chairmanDue),
      createdBy: 'Investor Portal',
    },
    {
      id: 'rc-itpc-001',
      type: 'project_update',
      confidentiality: 'Standard',
      status: 'assigned',
      priority: 'High',
      subject: 'Need land valuation appendix before term-sheet',
      projectId: 'p1',
      projectName: 'Ho Chi Minh City Smart Infrastructure Hub',
      investorName: 'Kim Jae-won',
      investorEmail: 'kjw@kip.co.kr',
      investorCompany: 'Korea Infrastructure Partners',
      submittedAt: formatDateTime(addHours(now, -30)),
      dueAt: formatDateTime(supportDue),
      assignedAgencyId: 'ag9',
      assignedAgencyName: 'Department of Finance',
      createdBy: 'ITPC Portal',
    },
    {
      id: 'rc-interest-001',
      type: 'investment_support',
      confidentiality: 'Standard',
      status: 'new',
      priority: 'Medium',
      subject: 'Investor interest in logistics hub project',
      projectId: 'p2',
      projectName: 'HCMC Logistics Innovation Park',
      investorName: 'Aiko Tanaka',
      investorEmail: 'aiko@tokyogrowth.jp',
      investorCompany: 'Tokyo Growth Partners',
      submittedAt: formatDateTime(addHours(now, -10)),
      dueAt: formatDateTime(interestDue),
      createdBy: 'Investor Portal',
    },
    {
      id: 'rc-meeting-001',
      type: 'meeting_request',
      confidentiality: 'Standard',
      status: 'new',
      priority: 'High',
      subject: 'Request meeting with project owner',
      projectId: 'p3',
      projectName: 'Creative Economy Campus',
      investorName: 'Sarah Miller',
      investorEmail: 'sarah@globalinfra.com',
      investorCompany: 'Global Infrastructure Advisory',
      submittedAt: formatDateTime(addHours(now, -18)),
      dueAt: formatDateTime(meetingDue),
      createdBy: 'Investor Portal',
    },
    {
      id: 'rc-question-001',
      type: 'project_question',
      confidentiality: 'Standard',
      status: 'new',
      priority: 'Medium',
      subject: 'Question about utility connection timeline',
      projectId: 'p1',
      projectName: 'Ho Chi Minh City Smart Infrastructure Hub',
      investorName: 'Daniel Lee',
      investorEmail: 'daniel@apacfund.sg',
      investorCompany: 'APAC Growth Fund',
      submittedAt: formatDateTime(addHours(now, -6)),
      dueAt: formatDateTime(questionDue),
      createdBy: 'Investor Portal',
    },
  ];
}

function buildSeedMessages(): RequestMessage[] {
  const now = new Date();
  return [
    {
      id: 'rm-chairman-001',
      caseId: 'rc-chairman-001',
      senderRole: 'Investor',
      senderName: 'Kim Jae-won',
      senderOrganization: 'Korea Infrastructure Partners',
      receiverRole: 'Chairman',
      receiverOrganization: 'HCMC People Committee',
      body: 'We need confidential leadership visibility because the coordination response has delayed an investment decision.',
      channel: 'Investor Portal',
      createdAt: formatDateTime(addHours(now, -5)),
      attachments: [],
    },
    {
      id: 'rm-itpc-001',
      caseId: 'rc-itpc-001',
      senderRole: 'ITPC',
      senderName: 'ITPC Coordination Desk',
      senderOrganization: 'ITPC',
      receiverRole: 'Agency',
      receiverOrganization: 'Department of Finance',
      body: 'Please confirm the latest land valuation appendix and expected release timing.',
      channel: 'ITPC Portal',
      createdAt: formatDateTime(addHours(now, -29)),
      attachments: [],
    },
    {
      id: 'rm-interest-001',
      caseId: 'rc-interest-001',
      senderRole: 'Investor',
      senderName: 'Aiko Tanaka',
      senderOrganization: 'Tokyo Growth Partners',
      receiverRole: 'ITPC',
      receiverOrganization: 'ITPC',
      body: 'We would like to receive investment guidance for the logistics hub project.',
      channel: 'Investor Portal',
      createdAt: formatDateTime(addHours(now, -10)),
      attachments: [],
    },
    {
      id: 'rm-meeting-001',
      caseId: 'rc-meeting-001',
      senderRole: 'Investor',
      senderName: 'Sarah Miller',
      senderOrganization: 'Global Infrastructure Advisory',
      receiverRole: 'ITPC',
      receiverOrganization: 'ITPC',
      body: 'Please arrange a meeting with the project owner next week.',
      channel: 'Investor Portal',
      createdAt: formatDateTime(addHours(now, -18)),
      attachments: [],
    },
    {
      id: 'rm-question-001',
      caseId: 'rc-question-001',
      senderRole: 'Investor',
      senderName: 'Daniel Lee',
      senderOrganization: 'APAC Growth Fund',
      receiverRole: 'ITPC',
      receiverOrganization: 'ITPC',
      body: 'Could you clarify the expected timeline for utility connection readiness?',
      channel: 'Investor Portal',
      createdAt: formatDateTime(addHours(now, -6)),
      attachments: [],
    },
  ];
}

function buildSeedAssignments(): RequestAssignment[] {
  return [{
    id: 'ra-itpc-001',
    caseId: 'rc-itpc-001',
    assignedAgencyId: 'ag9',
    assignedAgencyName: 'Department of Finance',
    itpcOwner: 'ITPC Coordination Desk',
    assignedAt: formatDateTime(addHours(new Date(), -29)),
  }];
}

export function GovernanceProvider({ children }: { children: React.ReactNode }) {
  const { agencies, addNotification } = useApp();
  const [requestCases, setRequestCases] = useState<RequestCase[]>(() => readStored(REQUEST_CASES_KEY, buildSeedCases()));
  const [requestMessages, setRequestMessages] = useState<RequestMessage[]>(() => readStored(REQUEST_MESSAGES_KEY, buildSeedMessages()));
  const [requestAssignments, setRequestAssignments] = useState<RequestAssignment[]>(() => readStored(REQUEST_ASSIGNMENTS_KEY, buildSeedAssignments()));

  const saveCases = (next: RequestCase[]) => {
    setRequestCases(next);
    writeStored(REQUEST_CASES_KEY, next);
  };

  const saveMessages = (next: RequestMessage[]) => {
    setRequestMessages(next);
    writeStored(REQUEST_MESSAGES_KEY, next);
  };

  const saveAssignments = (next: RequestAssignment[]) => {
    setRequestAssignments(next);
    writeStored(REQUEST_ASSIGNMENTS_KEY, next);
  };

  const createChairmanReport: GovernanceContextType['createChairmanReport'] = (input) => {
    const now = new Date();
    const rule = slaRules.find((item) => item.requestType === 'chairman_report') ?? slaRules[0];
    const caseId = `rc-${Date.now()}`;
    const createdCase: RequestCase = {
      id: caseId,
      type: 'chairman_report',
      confidentiality: 'ChairmanOnly',
      status: 'new',
      priority: 'Critical',
      subject: input.subject,
      projectId: input.projectId,
      projectName: input.projectName,
      investorName: input.investorName,
      investorEmail: input.investorEmail,
      investorCompany: input.investorCompany,
      submittedAt: formatDateTime(now),
      dueAt: formatDateTime(addHours(now, rule.responseHours)),
      createdBy: 'Investor Portal',
    };
    const createdMessage: RequestMessage = {
      id: `rm-${Date.now()}`,
      caseId,
      senderRole: 'Investor',
      senderName: input.investorName,
      senderOrganization: input.investorCompany,
      receiverRole: 'Chairman',
      receiverOrganization: 'HCMC People Committee',
      body: input.message,
      channel: 'Investor Portal',
      createdAt: formatDateTime(now),
      attachments: input.attachments ?? [],
    };
    saveCases([createdCase, ...requestCases]);
    saveMessages([createdMessage, ...requestMessages]);
    addNotification({
      title: 'Chairman report submitted',
      message: `${input.subject} was sent to the Chairman-only inbox.`,
      type: 'warning',
      path: '/executive/direct-report',
    });
    return caseId;
  };

  const routeCaseToAgency: GovernanceContextType['routeCaseToAgency'] = (caseId, agencyId, note) => {
    const agency = agencies.find((item) => item.id === agencyId);
    const now = new Date();
    saveCases(requestCases.map((item) => item.id === caseId ? {
      ...item,
      status: 'assigned',
      assignedAgencyId: agencyId,
      assignedAgencyName: agency?.nameEn ?? agency?.name ?? 'Agency',
    } : item));
    saveAssignments([
      {
        id: `ra-${Date.now()}`,
        caseId,
        assignedAgencyId: agencyId,
        assignedAgencyName: agency?.nameEn ?? agency?.name ?? 'Agency',
        itpcOwner: 'ITPC Coordination Desk',
        assignedAt: formatDateTime(now),
      },
      ...requestAssignments,
    ]);
    if (note.trim()) {
      saveMessages([
        {
          id: `rm-${Date.now()}`,
          caseId,
          senderRole: 'ITPC',
          senderName: 'ITPC Coordination Desk',
          senderOrganization: 'ITPC',
          receiverRole: 'Agency',
          receiverOrganization: agency?.nameEn ?? agency?.name ?? 'Agency',
          body: note.trim(),
          channel: 'ITPC Portal',
          createdAt: formatDateTime(now),
          attachments: [],
        },
        ...requestMessages,
      ]);
    }
    addNotification({
      title: 'Request routed to agency',
      message: `${agency?.shortName ?? agency?.name ?? 'Agency'} received a new response request.`,
      type: 'info',
      path: '/agency/lite',
    });
  };

  const addCaseMessage: GovernanceContextType['addCaseMessage'] = (caseId, message) => {
    const now = formatDateTime(new Date());
    saveMessages([{ ...message, id: `rm-${Date.now()}`, caseId, createdAt: now }, ...requestMessages]);
    saveCases(requestCases.map((item) => {
      if (item.id !== caseId) return item;
      return {
        ...item,
        status: message.senderRole === 'Agency' || message.senderRole === 'ITPC' ? 'responded' : item.status,
        firstResponseAt: item.firstResponseAt ?? now,
        latestResponseAt: now,
      };
    }));
    addNotification({
      title: 'Response recorded',
      message: 'A response message was stored in the governance record.',
      type: 'success',
      path: '/agency/intake',
    });
  };

  const updateCaseStatus: GovernanceContextType['updateCaseStatus'] = (caseId, status) => {
    saveCases(requestCases.map((item) => item.id === caseId ? { ...item, status } : item));
  };

  const getSlaStatus: GovernanceContextType['getSlaStatus'] = (requestCase) => {
    if (requestCase.status === 'closed') return 'Closed';
    if (requestCase.firstResponseAt || requestCase.status === 'responded') return 'Responded';
    const now = new Date();
    const due = new Date(requestCase.dueAt);
    if (now.getTime() > due.getTime()) return 'Overdue';
    const rule = slaRules.find((item) => item.requestType === requestCase.type) ?? slaRules[0];
    const atRisk = addHours(due, -rule.atRiskHoursBeforeDue);
    return now.getTime() >= atRisk.getTime() ? 'At Risk' : 'On Track';
  };

  const getSlaTimeCounter: GovernanceContextType['getSlaTimeCounter'] = (requestCase, language = 'en') => {
    const submitted = new Date(requestCase.submittedAt);
    const due = new Date(requestCase.dueAt);
    const firstResponse = requestCase.firstResponseAt ? new Date(requestCase.firstResponseAt) : null;
    const status = getSlaStatus(requestCase);
    const hourMs = 1000 * 60 * 60;

    if (status === 'Closed') return language === 'vi' ? 'Đã đóng' : 'Closed';
    if (firstResponse || status === 'Responded') {
      const responseTime = firstResponse ?? new Date(requestCase.latestResponseAt ?? requestCase.dueAt);
      const hours = Math.max(0, Math.ceil((responseTime.getTime() - submitted.getTime()) / hourMs));
      return language === 'vi' ? `đã phản hồi sau ${hours} giờ` : `responded after ${hours}h`;
    }

    const diff = due.getTime() - Date.now();
    const hours = Math.max(0, Math.ceil(Math.abs(diff) / hourMs));
    if (language === 'vi') {
      return diff >= 0 ? `còn ${hours} giờ` : `trễ ${hours} giờ`;
    }
    return diff >= 0 ? `${hours}h remaining` : `${hours}h overdue`;
  };

  const value = useMemo<GovernanceContextType>(() => ({
    requestCases,
    requestMessages,
    requestAssignments,
    slaRules,
    createChairmanReport,
    routeCaseToAgency,
    addCaseMessage,
    updateCaseStatus,
    getSlaStatus,
    getSlaTimeCounter,
    getVisibleCasesForAgency: (agencyId) => requestCases.filter((item) => !agencyId || item.assignedAgencyId === agencyId),
    getOperationalCasesForUbnd: () => requestCases.filter((item) => item.confidentiality === 'Standard'),
    getChairmanOnlyCases: () => requestCases.filter((item) => item.confidentiality === 'ChairmanOnly'),
  }), [requestCases, requestMessages, requestAssignments, agencies]);

  return <GovernanceContext.Provider value={value}>{children}</GovernanceContext.Provider>;
}

export function useGovernance() {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used inside GovernanceProvider');
  }
  return context;
}
