import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  Landmark,
  MapPin,
  Send,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { ProjectPlanningInfrastructureSection } from '../../components/ProjectPlanningInfrastructureSection';
import { ExplorerActionModal } from '../../components/ExplorerActionModal';
import { StatusPill } from '../../components/ui/status-pill';
import { ClearableSelectField } from '../../components/ui/clearable-select-field';
import { useApp } from '../../context/AppContext';
import { getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
import { downloadAttachment } from '../../utils/attachments';
import {
  getMockFollowedProjects,
  getMockJoinedProjects,
  getOrderedInvestorExecutionProjects,
} from '../../utils/investorExecutionMockScenario';
import { translateText } from '../../utils/localization';
import { formatFollowerCount, getProjectFollowerCount } from '../../utils/projectFollowers';
import { getProjectStageLabel, getProjectStatusTone } from '../../utils/projectStatus';
import designVietnamMap from '../../assets/design-vietnam-map.png';

type DetailAction = 'question' | 'meeting';
type MeetingType = '' | 'Online' | 'Onsite';
type DetailTab = 'overview' | 'location-land' | 'investment-details' | 'planning-infrastructure' | 'documents' | 'activity';

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'location-land', label: 'Location & Land' },
  { id: 'investment-details', label: 'Investment Details' },
  { id: 'planning-infrastructure', label: 'Planning & Infrastructure' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
];

const initialQuestionForm = {
  question: '',
};

const initialMeetingForm = {
  preferredDate: '',
  preferredTime: '',
  meetingType: '' as MeetingType,
  participants: '',
  agenda: '',
  notes: '',
  assignedAgency: '',
};

export default function ExecutionWorkspacePage() {
  const { id } = useParams();
  const {
    language,
    projects,
    watchlist,
    agencies,
    projectJobs,
    getProjectProcessingSummary,
    activeInvestorCompany,
    createIssue,
    createServiceRequest,
    updateProject,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [activeAction, setActiveAction] = useState<DetailAction | null>(null);
  const [actionStep, setActionStep] = useState<'form' | 'success'>('form');
  const [submittedReference, setSubmittedReference] = useState('');
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [meetingForm, setMeetingForm] = useState(initialMeetingForm);

  const orderedProjects = useMemo(() => getOrderedInvestorExecutionProjects(projects, watchlist), [projects, watchlist]);
  const followedProjects = useMemo(() => getMockFollowedProjects(orderedProjects), [orderedProjects]);
  const joinedProjects = useMemo(() => getMockJoinedProjects(followedProjects), [followedProjects]);
  const followedProjectIds = useMemo(() => new Set(followedProjects.map((item) => item.id)), [followedProjects]);
  const joinedProjectIds = useMemo(() => new Set(joinedProjects.map((item) => item.id)), [joinedProjects]);
  const project = followedProjects.find((item) => item.id === id) ?? projects.find((item) => item.id === id);

  if (!project || !followedProjectIds.has(project.id)) {
    return <Navigate to="/investor/execution" replace />;
  }

  const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
  const processingSummary = getProjectProcessingSummary(project.id);
  const locationLabel = getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language);
  const followerCount = getProjectFollowerCount(project);
  const ownerAgency = agencies.find((agency) => agency.id === project.ownerAgencyId) ?? agencies[0];
  const ownerAgencyLabel = language === 'vi'
    ? ownerAgency?.nameVi ?? ownerAgency?.name ?? t('Project owner pending')
    : ownerAgency?.nameEn ?? ownerAgency?.name ?? t('Project owner pending');
  const isJoinedProject = joinedProjectIds.has(project.id);
  const summaryParagraphs = t(project.description).split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const milestoneRows = project.milestones?.length
    ? project.milestones.slice(0, 3)
    : [
        {
          id: `${project.id}-phase-1`,
          phase: 'Phase I',
          description: 'Site preparation and authority coordination package',
          dueDate: project.timeline || 'Q4 2026',
          status: 'in_progress' as const,
          progress: 45,
        },
        {
          id: `${project.id}-phase-2`,
          phase: 'Phase II',
          description: 'Capital structuring and investor onboarding milestone',
          dueDate: 'Q2 2027',
          status: 'pending' as const,
          progress: 0,
        },
        {
          id: `${project.id}-phase-3`,
          phase: 'Phase III',
          description: 'Construction mobilization and delivery readiness',
          dueDate: 'Q4 2027',
          status: 'pending' as const,
          progress: 0,
        },
      ];
  const quickResources = [
    ...(project.documents ?? [])
      .slice(0, 2)
      .map((document) => ({
        id: document.id,
        label: document.name,
        action: () => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt }),
      })),
    {
      id: 'resource-map',
      label: t('Location Map'),
      action: () => window.open(project.mapImage ?? project.image, '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'resource-brief',
      label: t('Project Brief'),
      action: () => window.open(project.image, '_blank', 'noopener,noreferrer'),
    },
  ].slice(0, 3);

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
    if (!questionForm.question.trim()) return;

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
    if (!meetingForm.preferredDate || !meetingForm.preferredTime || !meetingForm.agenda.trim()) return;

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

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_332px]">
        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Project Summary')}</h2>
            <div className="mt-5 space-y-5 text-[16px] leading-[1.65] text-[#584237]">
              {(summaryParagraphs.length ? summaryParagraphs : [t(project.description)]).slice(0, 2).map((paragraph, index) => (
                <p key={`${project.id}-summary-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-[4px] bg-[#f2f4f6] p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[#455f87]">{t('Execution Highlights')}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ['Land Area', project.landArea, 'text-[#191c1e]'],
                ['Construction Period', project.timeline, 'text-[#191c1e]'],
                ['Processing Readiness', `${processingSummary.percentage}%`, 'text-[#006398]'],
                ['Project Jobs', `${projectJobItems.length}`, 'text-[#191c1e]'],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-[2px] bg-white p-4">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div>
                  <div className={`mt-2 text-[18px] font-medium ${tone}`}>{t(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-[#fff8f3] p-6">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9d4300]">{t('Execution Relationship')}</div>
            <div className="mt-3 text-sm leading-7 text-[#6a4634]">
              {isJoinedProject
                ? t('This project belongs to both the followed portfolio and the joined-project execution scope in the investor mock scenario.')
                : t('This project is tracked inside the followed portfolio mock scope and remains available for monitoring before the investor formally joins execution.')}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-white">
            <img src={project.image} alt={t(project.name)} className="h-[220px] w-full object-cover" />
            <div className="px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[#8c7164]">{t('Project Visual')}</div>
          </div>
          <div className="overflow-hidden rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-white">
            <img src={project.mapImage ?? designVietnamMap} alt={t('Location map')} className="h-[138px] w-full object-cover" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Investment Milestones')}</h2>
        <div className="mt-5 overflow-x-auto rounded-[4px] border border-[rgba(224,192,177,0.12)] bg-white">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[120px_minmax(280px,1fr)_140px_130px] bg-[#eceef0] text-[10px] uppercase tracking-[0.08em] text-[#584237]">
              <div className="px-5 py-3">{t('Phase')}</div>
              <div className="px-5 py-3">{t('Milestone Description')}</div>
              <div className="px-5 py-3">{t('Target Date')}</div>
              <div className="px-5 py-3 text-center">{t('Status')}</div>
            </div>
            {milestoneRows.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`grid min-h-[76px] grid-cols-[120px_minmax(280px,1fr)_140px_130px] border-t border-[rgba(224,192,177,0.08)] text-[14px] ${
                  index % 2 === 0 ? 'bg-[#f7f9fb]' : 'bg-[#f2f4f6]'
                }`}
              >
                <div className="px-5 py-4 font-semibold leading-7 text-[#191c1e]">{t(milestone.phase)}</div>
                <div className="px-5 py-4 leading-7 text-[#584237]">{t(milestone.description)}</div>
                <div className="px-5 py-4 leading-7 text-[#191c1e]">{milestone.dueDate}</div>
                <div className="flex items-center justify-center px-5 py-4">
                  <span
                    className={`inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-[14px] px-3 py-2 text-center text-[10px] uppercase leading-none tracking-[0.06em] ${
                      milestone.status === 'in_progress' || milestone.status === 'completed'
                        ? 'bg-[#b5d0fd] text-[#3e5980]'
                        : 'bg-[#e0e3e5] text-[#584237]'
                    }`}
                  >
                    {t(milestone.status === 'in_progress' || milestone.status === 'completed' ? 'In Progress' : 'Planned')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetricGrid = (items: Array<[string, string]>, cols: string) => (
    <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className={`mt-0 grid gap-4 ${cols}`}>
        {items.map(([label, value]) => (
          <div key={label} className="rounded-[2px] bg-[#f7f9fb] p-5">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div>
            <div className="mt-2 text-[20px] font-medium text-[#191c1e]">{t(value)}</div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="page-shell pb-10">
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.05em] text-[#455f87]">
            <Link to="/investor/execution" className="inline-flex items-center gap-1 hover:text-[#9d4300]">
              <ArrowLeft size={14} />
              {t('Execution Workspace')}
            </Link>
            <ChevronRight size={12} />
            <span>{t('Projects')}</span>
            <ChevronRight size={12} />
            <span className="text-[#9d4300]">{t(project.name)}</span>
          </div>

          <section className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-[12px] bg-[#ffdbca] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#341100]">
                {t(getProjectStageLabel(project.status, project.stage))}
              </span>
              <span className="rounded-[12px] bg-[#d5e3ff] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#001c3b]">{t(project.province)}</span>
              <span className="rounded-[12px] bg-[#e0e3e5] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#584237]">{t(project.sector)}</span>
              <span className={`rounded-[12px] px-3 py-1 text-[10px] uppercase tracking-[0.06em] ${isJoinedProject ? 'bg-[#d7f5e8] text-[#195c3c]' : 'bg-[#fff1e7] text-[#9d4300]'}`}>
                {isJoinedProject ? t('Joined Project') : t('Followed Project')}
              </span>
            </div>

            <h1 className="max-w-5xl text-[48px] leading-[1] tracking-[-0.04em] text-[#191c1e]">{t(project.name)}</h1>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#e0e3e5] text-[#455f87]"><Building2 size={18} /></div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Project Owner')}</div>
                  <div className="text-[14px] text-[#191c1e]">{ownerAgencyLabel}</div>
                </div>
              </div>

              <div className="h-8 w-px bg-[rgba(224,192,177,0.3)]" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#e0e3e5] text-[#455f87]"><Landmark size={18} /></div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Total Investment')}</div>
                  <div className="text-[14px] font-medium text-[#9d4300]">${project.budget}M USD</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#455f87]">
                <MapPin size={14} />
                {locationLabel}
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-nowrap gap-8 overflow-x-auto border-b border-[rgba(224,192,177,0.2)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-[18px] pt-[2px] text-[14px] transition-colors ${
                    activeTab === tab.id ? 'border-[#9d4300] text-[#9d4300]' : 'border-transparent text-[#455f87] hover:text-[#9d4300]'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'location-land' && renderMetricGrid([
            ['Province', project.province],
            ['Location', locationLabel],
            ['Land Area', project.landArea],
            ['Project Stage', project.stage],
          ], 'lg:grid-cols-2')}
          {activeTab === 'investment-details' && renderMetricGrid([
            ['Total Investment', `$${project.budget}M USD`],
            ['Minimum Investment', `$${project.minInvestment}M USD`],
            ['Expected IRR', project.returnRate],
            ['Construction Period', project.timeline],
            ['Followers', `${formatFollowerCount(followerCount)} ${t('followers')}`],
            ['Processing Readiness', `${processingSummary.percentage}%`],
          ], 'lg:grid-cols-3')}
          {activeTab === 'planning-infrastructure' && (
            <ProjectPlanningInfrastructureSection
              project={project}
              projectJobs={projectJobItems}
              agencies={agencies}
              processingSummary={processingSummary}
              t={t}
            />
          )}
          {activeTab === 'documents' && (
            <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Documents')}</h2>
              <div className="mt-6 space-y-3">
                {project.documents.length > 0 ? project.documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt })}
                    className="flex w-full items-center justify-between rounded-[2px] border border-[rgba(224,192,177,0.12)] bg-[#f7f9fb] px-5 py-4 text-left"
                  >
                    <div>
                      <div className="text-[14px] font-medium text-[#191c1e]">{t(document.name)}</div>
                      <div className="mt-1 text-[12px] text-[#584237]">{document.type} | {document.size}</div>
                    </div>
                    <Download size={16} className="text-[#9d4300]" />
                  </button>
                )) : (
                  <div className="rounded-[2px] border border-dashed border-[rgba(224,192,177,0.2)] px-4 py-10 text-center text-sm text-slate-500">
                    {t('No documents are available yet.')}
                  </div>
                )}
              </div>
            </section>
          )}
          {activeTab === 'activity' && (
            <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Activity')}</h2>
              <div className="mt-6 space-y-4">
                {project.qa.length > 0 ? project.qa.map((item) => (
                  <div key={item.id} className="rounded-[2px] border border-[rgba(224,192,177,0.12)] bg-[#f7f9fb] p-5">
                    <div className="text-[14px] font-medium text-[#191c1e]">{t(item.question)}</div>
                    <div className="mt-2 text-[12px] text-[#584237]">{item.askedBy} | {item.askedAt}</div>
                    {item.answer ? <div className="mt-3 text-sm leading-7 text-[#455f87]">{t(item.answer)}</div> : null}
                  </div>
                )) : (
                  <div className="rounded-[2px] border border-dashed border-[rgba(224,192,177,0.2)] px-4 py-10 text-center text-sm text-slate-500">
                    {t('No activity has been recorded for this project yet.')}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[4px] border-b-2 border-[rgba(224,192,177,0.2)] bg-white px-8 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Processing Readiness')}</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-[12px] bg-[#eceef0]">
                <div className="h-full bg-[#9d4300]" style={{ width: `${Math.max(processingSummary.percentage, 10)}%` }} />
              </div>
              <div className="text-[14px] font-medium text-[#191c1e]">{processingSummary.percentage}%</div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => openActionModal('meeting')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-4 py-4 text-[14px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"
              >
                <Calendar size={16} />
                {t('Request Meeting')}
              </button>
              <button
                type="button"
                onClick={() => openActionModal('question')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] px-4 py-4 text-[14px] font-semibold text-[#455f87] transition-colors hover:bg-[#fff1e7] hover:text-[#9d4300]"
              >
                <Send size={16} />
                {t('Ask Question')}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['Followers', `${formatFollowerCount(followerCount)} ${t('followers')}`, Building2],
                ['Updated', project.updatedAt ?? project.createdAt ?? '-', CalendarDays],
                ['Documents', `${project.documents.length}`, FileText],
              ].map(([label, value, Icon]) => (
                <div key={label} className="flex items-center gap-3 rounded-[2px] bg-[#e6e8ea] px-4 py-4 text-left text-[13px] font-medium text-[#3e5980]">
                  <Icon size={14} />
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div>
                    <div className="mt-1 text-[13px] text-[#191c1e]">{String(value)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[rgba(224,192,177,0.1)] pt-5">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#8c7164]">{t('Execution Scope')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone={getProjectStatusTone(project.status, project.stage)}>
                  {t(getProjectStageLabel(project.status, project.stage))}
                </StatusPill>
                <StatusPill tone={isJoinedProject ? 'success' : 'warning'}>
                  {isJoinedProject ? t('Joined Project') : t('Followed Project')}
                </StatusPill>
              </div>
            </div>
          </div>

          <div className="rounded-[4px] bg-[#455f87] p-6">
            <div className="text-[12px] uppercase tracking-[0.1em] text-[#ffdbca]">{t('Quick Resources')}</div>
            <div className="mt-4 space-y-3">
              {quickResources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={resource.action}
                  className="flex w-full items-center gap-3 text-left text-[12px] text-white"
                >
                  <Download size={12} />
                  <span className="flex-1">{t(resource.label)}</span>
                  <ChevronRight size={12} />
                </button>
              ))}
            </div>
          </div>
        </aside>
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
                    <ClearableSelectField
                      ariaLabel={t('Meeting type')}
                      value={meetingForm.meetingType}
                      onChange={(value) => setMeetingForm((current) => ({ ...current, meetingType: value as MeetingType }))}
                      placeholder={t('Select meeting type')}
                      options={[
                        { value: 'Online', label: t('Online') },
                        { value: 'Onsite', label: t('Onsite') },
                      ]}
                      className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[14px] font-medium text-[#1a2755]">{t('Assigned agency')}</span>
                    <ClearableSelectField
                      ariaLabel={t('Assigned agency')}
                      value={meetingForm.assignedAgency}
                      onChange={(value) => setMeetingForm((current) => ({ ...current, assignedAgency: value }))}
                      placeholder={t('Select agency')}
                      options={agencyOptions.map((agencyName) => ({ value: agencyName, label: t(agencyName) }))}
                      className="h-14 rounded-[16px] border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none"
                    />
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
