import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Calendar, ChevronDown, ChevronRight, Crosshair, Download, Eye, FileText, Info, Landmark, MapPin, MessageSquareText, Minus, Plus, RefreshCcw, Send, Star, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
import { ExplorerActionModal } from '../../components/ExplorerActionModal';
import { ProjectPlanningInfrastructureSection } from '../../components/ProjectPlanningInfrastructureSection';
import { ClearableSelectField } from '../../components/ui/clearable-select-field';
import { Input } from '../../components/ui/input';
import designVietnamMap from '../../assets/design-vietnam-map.png';
import { downloadAttachment } from '../../utils/attachments';
import { translateText } from '../../utils/localization';
import { formatFollowerCount, getProjectFollowerCount } from '../../utils/projectFollowers';

type DetailAction = 'interest' | 'question' | 'meeting';
type MeetingType = '' | 'Online' | 'Onsite';
type DetailTab = 'overview' | 'location-land' | 'investment-details' | 'planning-infrastructure' | 'documents' | 'faq';

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'location-land', label: 'Location & Land' },
  { id: 'investment-details', label: 'Investment Details' },
  { id: 'planning-infrastructure', label: 'Planning & Infrastructure' },
  { id: 'documents', label: 'Documents' },
  { id: 'faq', label: 'FAQ' },
];

type CustomProjectField = {
  label: string;
  value: string;
  group: string;
};

const sectorCustomFieldMockups: Record<string, CustomProjectField[]> = {
  infrastructure: [
    { label: 'Primary infrastructure type', value: 'Smart urban operations center', group: 'Sector' },
    { label: 'Target operating capacity', value: '100MW data center and city IoT network', group: 'Technical' },
    { label: 'Connectivity requirement', value: '5G backbone, fiber ring, public API gateway', group: 'Technical' },
    { label: 'Required agency coordination', value: 'Transport, telecom, construction, digital transformation', group: 'Governance' },
  ],
  energy: [
    { label: 'Generation source', value: 'Solar, battery storage, grid balancing', group: 'Sector' },
    { label: 'Grid connection level', value: '110kV transmission interface', group: 'Technical' },
    { label: 'Estimated annual output', value: '420 GWh', group: 'Technical' },
    { label: 'Environmental permit focus', value: 'Storage safety and land-use compliance', group: 'Governance' },
  ],
  manufacturing: [
    { label: 'Target industry cluster', value: 'Advanced manufacturing and electronics', group: 'Sector' },
    { label: 'Utility requirement', value: 'High-capacity power, water, and logistics access', group: 'Technical' },
    { label: 'Cleanroom readiness', value: 'ISO 7 compatible zone planning', group: 'Technical' },
    { label: 'Workforce profile', value: 'Engineering, assembly, quality control', group: 'Operation' },
  ],
  tourism: [
    { label: 'Destination format', value: 'Riverside convention, hospitality, and leisure complex', group: 'Sector' },
    { label: 'Target keys', value: '900 hotel rooms and serviced apartments', group: 'Operation' },
    { label: 'Public realm requirement', value: 'Riverwalk, pier access, flood-resilient landscape', group: 'Technical' },
    { label: 'Heritage review need', value: 'Riverfront height and public access compliance', group: 'Governance' },
  ],
  default: [
    { label: 'Sector-specific requirement', value: 'Agency-defined project information pending validation', group: 'Sector' },
    { label: 'Technical requirement', value: 'To be confirmed by responsible agency', group: 'Technical' },
    { label: 'Operating model', value: 'To be confirmed during project preparation', group: 'Operation' },
    { label: 'Approval dependency', value: 'To be confirmed by the project owner', group: 'Governance' },
  ],
};

function getCustomProjectFields(projectId: string, sector: string) {
  const normalizedSector = sector.toLowerCase();
  if (projectId === 'p1' || normalizedSector.includes('infrastructure') || normalizedSector.includes('smart')) return sectorCustomFieldMockups.infrastructure;
  if (normalizedSector.includes('energy') || normalizedSector.includes('renewable')) return sectorCustomFieldMockups.energy;
  if (normalizedSector.includes('manufacturing') || normalizedSector.includes('industrial')) return sectorCustomFieldMockups.manufacturing;
  if (normalizedSector.includes('tourism') || normalizedSector.includes('hospitality')) return sectorCustomFieldMockups.tourism;
  return sectorCustomFieldMockups.default;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const {
    language, projects, agencies, projectJobs, getProjectProcessingSummary, activeInvestorCompany,
    setActiveInvestorCompany, createIssue, createOpportunity, createServiceRequest, updateProject, toggleWatchlist, watchlist,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const project = projects.find((item) => item.id === id);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [activeAction, setActiveAction] = useState<DetailAction | null>(null);
  const [actionStep, setActionStep] = useState<'form' | 'success'>('form');
  const [submittedReference, setSubmittedReference] = useState('');
  const [submittedSupportReference, setSubmittedSupportReference] = useState('');
  const [interestError, setInterestError] = useState('');
  const [showCustomDetails, setShowCustomDetails] = useState(false);
  const [interestForm, setInterestForm] = useState({
    companyName: activeInvestorCompany,
    contactName: '',
    email: '',
    phone: '',
    investmentSize: '',
    investmentType: '',
    notes: '',
  });
  const [question, setQuestion] = useState('');
  const [questionForm, setQuestionForm] = useState({ contactName: '', companyName: activeInvestorCompany, email: '', phone: '' });
  const [meeting, setMeeting] = useState({ preferredDate: '', preferredTime: '', meetingType: '' as MeetingType, companyName: activeInvestorCompany, participants: '', participantPosition: '', agenda: '', notes: '', assignedAgency: '' });

  if (!project) {
    return <div className="page-shell"><div className="section-panel p-8 text-center">{t('Project not found')}</div></div>;
  }

  const locationLabel = getAdministrativeLocationLabel(getProjectAdministrativeLocation(project), language);
  const followerCount = getProjectFollowerCount(project);
  const processingSummary = getProjectProcessingSummary(project.id);
  const projectJobItems = projectJobs.filter((item) => item.projectId === project.id);
  const summaryParagraphs = t(project.description).split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const ownerAgency = agencies.find((agency) => agency.id === project.ownerAgencyId) ?? agencies[0];
  const ownerAgencyLabel = language === 'vi'
    ? ownerAgency?.nameVi ?? ownerAgency?.name ?? t('Project owner pending')
    : ownerAgency?.nameEn ?? ownerAgency?.name ?? t('Project owner pending');
  const contactOfficer = ownerAgency?.peopleInCharge?.[0];
  const isFollowing = watchlist.includes(project.id);
  const customProjectFields = getCustomProjectFields(project.id, project.sector);
  const agencyOptions = useMemo(() => Array.from(new Set(['Department of Planning and Investment', ...agencies.map((agency) => agency.name)])), [agencies]);
  const quickResources = [
    ...(project.documents ?? []).slice(0, 2).map((document) => ({ id: document.id, label: document.name, action: () => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt }) })),
    { id: 'resource-master-plan', label: t('Master Plan Layout'), action: () => window.open(project.mapImage ?? project.image, '_blank', 'noopener,noreferrer') },
    { id: 'resource-legal', label: t('Legal Framework Documents'), action: () => window.open('#/investor/execution', '_blank', 'noopener,noreferrer') },
  ].slice(0, 3);
  const faqItems = [
    ...(project.qa ?? []).map((item) => ({
      id: item.id,
      title: item.question,
      description: item.answer || 'The responsible investment desk will provide an official response after the question is reviewed.',
    })),
    {
      id: 'faq-objective',
      title: 'What is the primary objective of this project?',
      description: 'The project creates a coordinated investment platform for strategic urban infrastructure, combining land, transport, commercial services, and public-sector support into one development opportunity.',
    },
    {
      id: 'faq-opportunities',
      title: 'What investment opportunities are available?',
      description: 'Investors can participate through development partnership, capital investment, operating partnership, or supporting service delivery depending on the approved project structure and due-diligence result.',
    },
    {
      id: 'faq-support',
      title: 'What support is available for interested investors?',
      description: 'The investor support desk can coordinate project clarification, meeting requests, document access, and next-step guidance with the responsible agency.',
    },
  ].slice(0, 5);

  function closeModal() {
    setActiveAction(null);
    setActionStep('form');
    setSubmittedReference('');
    setSubmittedSupportReference('');
    setInterestError('');
    setInterestForm({
      companyName: activeInvestorCompany,
      contactName: '',
      email: '',
      phone: '',
      investmentSize: '',
      investmentType: '',
      notes: '',
    });
    setQuestion('');
    setQuestionForm({ contactName: '', companyName: activeInvestorCompany, email: '', phone: '' });
    setMeeting({ preferredDate: '', preferredTime: '', meetingType: '', companyName: activeInvestorCompany, participants: '', participantPosition: '', agenda: '', notes: '', assignedAgency: '' });
  }

  function handleInterestSubmit() {
    if (!interestForm.companyName.trim() || !interestForm.contactName.trim() || !interestForm.email.trim() || !interestForm.phone.trim()) {
      setInterestError(t('Please complete company name, contact name, email, and phone number.'));
      return;
    }
    setInterestError('');
    setActiveInvestorCompany(interestForm.companyName.trim());
    const opportunityId = createOpportunity({
      projectId: project.id,
      projectName: project.name,
      investorName: interestForm.contactName.trim(),
      investorCompany: interestForm.companyName.trim(),
      investorCountry: 'Vietnam',
      investorType: interestForm.investmentType.trim() || 'Corporate',
      amount: interestForm.investmentSize.trim() ? Number(interestForm.investmentSize.replace(/[^0-9.]/g, '')) || project.minInvestment : project.minInvestment,
      stage: 'new',
      notes: interestForm.notes.trim() || 'Investment interest submitted from project detail page.',
      intakeData: {
        investmentStructure: interestForm.investmentType.trim() || 'To be confirmed',
        timeline: 'Requested from project detail page',
        fundSource: 'To be confirmed',
        experience: interestForm.notes.trim() || 'Investor intake from project detail page',
        contactEmail: interestForm.email.trim(),
        contactPhone: interestForm.phone.trim() || 'To be confirmed',
      },
    });
    const supportId = createIssue({
      projectId: project.id,
      projectName: project.name,
      title: `Investor interest intake - ${interestForm.companyName.trim()}`,
      description: interestForm.notes.trim() || 'Investor expressed interest from the project detail page.',
      priority: 'high',
      status: 'open',
      assignedTo: 'Investor Relations Desk',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reportedBy: interestForm.contactName.trim(),
      category: 'Support',
    });
    setSubmittedReference(opportunityId);
    setSubmittedSupportReference(supportId);
    setActionStep('success');
  }

  function handleQuestionSubmit() {
    if (!question.trim() || !questionForm.contactName.trim() || !questionForm.companyName.trim() || !questionForm.email.trim() || !questionForm.phone.trim()) return;
    setActiveInvestorCompany(questionForm.companyName.trim());
    const issueId = createIssue({
      projectId: project.id, projectName: project.name, title: `Investor Q&A thread: ${project.name}`, description: question.trim(),
      priority: 'high', status: 'open', assignedTo: 'Government Operator Desk', reportedBy: questionForm.contactName.trim(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Q&A',
    });
    updateProject(project.id, {
      qa: [...(project.qa ?? []), { id: `qa${Date.now()}`, question: question.trim(), askedBy: questionForm.contactName.trim(), askedAt: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') }],
    });
    setSubmittedReference(issueId);
    setActionStep('success');
  }

  function handleMeetingSubmit() {
    if (!meeting.preferredDate || !meeting.preferredTime || !meeting.assignedAgency || !meeting.companyName.trim() || !meeting.participants.trim() || !meeting.participantPosition.trim() || !meeting.agenda.trim()) return;
    setActiveInvestorCompany(meeting.companyName.trim());
    const requestId = createServiceRequest({
      serviceId: 'meeting-request', serviceName: 'Meeting Request', applicant: meeting.companyName.trim(), projectId: project.id, projectName: project.name,
      assignedAgency: meeting.assignedAgency, documents: [],
      notes: [`Preferred date: ${meeting.preferredDate}`, `Preferred time: ${meeting.preferredTime}`, `Meeting type: ${meeting.meetingType}`, `Company: ${meeting.companyName.trim()}`, `Participant: ${meeting.participants.trim()}`, `Position: ${meeting.participantPosition.trim()}`, `Objectives: ${meeting.agenda.trim()}`, meeting.notes.trim() ? `Additional notes: ${meeting.notes.trim()}` : ''].filter(Boolean).join(' | '),
    });
    setSubmittedReference(requestId);
    setActionStep('success');
  }

  const milestoneRows = (project.milestones?.length ? project.milestones.slice(0, 3) : [
    { id: 'phase-1', phase: 'Phase I', description: 'Land clearance and foundation infrastructure', dueDate: project.timeline || 'Q4 2024', status: 'in_progress' },
    { id: 'phase-2', phase: 'Phase II', description: 'Financial district structural topping out', dueDate: 'Q2 2026', status: 'pending' },
    { id: 'phase-3', phase: 'Phase III', description: 'Digital infrastructure and IoT network integration', dueDate: 'Q1 2027', status: 'pending' },
  ]);

  return (
    <div className="bg-[#f9fafb] px-3 pb-10 pt-4 sm:px-4 md:px-8">
      <div className="mx-auto grid max-w-[1128px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,840px)_264px]">
        <div className="space-y-4">
          <div className="flex h-9 min-w-0 items-center gap-2 overflow-hidden text-[14px] text-[#6b7280]">
            <Link to="/investor/explorer" className="inline-flex shrink-0 items-center gap-1 hover:text-[#ed6203]"><ArrowLeft size={14} />{t('Projects')}</Link>
            <ChevronRight size={14} className="shrink-0" /><span className="min-w-0 truncate text-[#030712]">{t(project.name)}</span>
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <h1 className="break-words text-[22px] font-semibold leading-8 text-[#030712] sm:text-[24px]">{t(project.name)}</h1>
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#1f2937]">
                  <span className="inline-flex items-center gap-1"><MapPin size={16} />{locationLabel}</span>
                  <span className="inline-flex items-center gap-1"><Eye size={16} />{formatFollowerCount(followerCount * 9 + 145)} {t('views')}</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={16} />{t('Updated')} {project.updatedAt || 'May 2, 2024'}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[#f3f4f6] text-[#5b6b79]"><Building2 size={20} /></div>
                <div className="min-w-0"><div className="text-[12px] text-[#6b7280]">{t('Project Owner')}</div><div className="break-words text-[16px] font-medium text-[#0070e0]">{ownerAgencyLabel}</div></div>
              </div>
              <div className="hidden h-6 w-px bg-[#e5e7eb] sm:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[#f3f4f6] text-[#5b6b79]"><Landmark size={20} /></div>
                <div><div className="text-[12px] text-[#6b7280]">{t('Total Investment')}</div><div className="text-[16px] font-medium text-[#ed6203]">${project.budget}M USD</div></div>
              </div>
              </div>
            </div>

            <div className="my-5 h-px w-full bg-[#e5e7eb]" />

            <div className="-mx-4 flex flex-nowrap gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-[14px] leading-5 transition-colors ${activeTab === tab.id ? 'bg-[#fef2eb] font-semibold text-[#ed6203]' : 'text-[#5b6b79] hover:bg-[#f9fafb] hover:text-[#ed6203]'}`}>{t(tab.label)}</button>
          ))}</div></section>

          {activeTab === 'overview' && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]">
              <div className="space-y-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-10">
                  <div className="space-y-6 min-w-0">
                    <div>
                      <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Project Summary')}</h2>
                      <div className="mt-5 space-y-5 text-[15px] leading-[1.65] text-[#584237] sm:text-[16px]">{(summaryParagraphs.length ? summaryParagraphs : [t(project.description)]).slice(0, 2).map((paragraph, index) => <p key={`${project.id}-${index}`}>{paragraph}</p>)}</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-semibold text-[#1f2937]">{t('Key Performance Indicators')}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {[
                          ['Land Area', project.landArea, 'text-[#191c1e]'],
                          ['Construction Period', project.timeline, 'text-[#191c1e]'],
                          ['Est. Yearly Revenue', `$${project.budget ? Math.round(project.budget * 0.2) : 240}M USD`, 'text-[#006398]'],
                          ['Job Creation', `${Math.max(project.jobs, 450).toLocaleString()}+`, 'text-[#191c1e]'],
                        ].map(([label, value, tone]) => <div key={label} className="flex min-h-[71px] items-center rounded-lg border border-[#c8d9ff] bg-white p-3"><div className="min-w-0"><div className="text-[14px] text-[#6b7280]">{t(label)}</div><div className={`mt-1 break-words text-[16px] font-bold ${tone}`}>{t(value)}</div></div></div>)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 min-w-0">
                    <div className="overflow-hidden rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-white"><img src={project.image} alt={t(project.name)} className="h-[180px] w-full object-cover sm:h-[220px]" /><div className="px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[#8c7164]">{t('Artist Impression')}</div></div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <button
                    type="button"
                    onClick={() => setShowCustomDetails((current) => !current)}
                    className="flex h-11 w-full items-center justify-between gap-4 bg-white px-6 text-left hover:bg-[#f9fafb]"
                    aria-expanded={showCustomDetails}
                  >
                    <span className="text-[14px] font-medium leading-5 text-[#1f2937]">{t('View more detail')}</span>
                    <ChevronDown size={20} className={`shrink-0 text-[#5b6b79] transition-transform ${showCustomDetails ? 'rotate-180' : ''}`} />
                  </button>
                  {showCustomDetails ? (
                    <div className="border-t border-[#e5e7eb]">
                      {customProjectFields.map((field) => (
                        <div key={`${field.group}-${field.label}`} className="flex min-h-11 flex-col items-stretch border-b border-[#e5e7eb] last:border-b-0 sm:flex-row">
                          <div className="flex w-full shrink-0 items-center border-b border-[#f3f4f6] bg-[#f3f4f6] px-4 py-3 text-[12px] font-medium leading-4 text-[#1f2937] sm:w-[135px] sm:px-6">
                            {t(field.label)}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center break-words px-4 py-3 text-[14px] font-medium leading-5 text-[#1f2937] sm:px-6">
                            {t(field.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Investment Milestones')}</h2>
                  <div className="-mx-4 mt-5 overflow-x-auto rounded-xl border border-[#f3f4f6] bg-white sm:mx-0">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-[120px_minmax(280px,1fr)_140px_130px] bg-[#f9fafb] text-[12px] font-medium text-[#1f2937]"><div className="px-5 py-3">{t('Phase')}</div><div className="px-5 py-3">{t('Milestone Description')}</div><div className="px-5 py-3">{t('Target Date')}</div><div className="px-5 py-3 text-center">{t('Status')}</div></div>
                      {milestoneRows.map((milestone) => <div key={milestone.id} className="grid min-h-[72px] grid-cols-[120px_minmax(280px,1fr)_140px_130px] border-t border-[#f3f4f6] bg-white text-[14px]"><div className="px-5 py-4 font-semibold leading-5 text-[#1f2937]">{t(milestone.phase)}</div><div className="px-5 py-4 leading-5 text-[#1f2937]">{t(milestone.description)}</div><div className="px-5 py-4 leading-5 text-[#1f2937]">{milestone.dueDate}</div><div className="flex items-center justify-center px-5 py-4"><span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-center text-[12px] font-medium leading-4 ${milestone.status === 'in_progress' || milestone.status === 'completed' ? 'bg-[#e4e7ff] text-[#011149]' : 'border border-[#f3f4f6] bg-[#f8fafc] text-[#1f2937]'}`}>{t(milestone.status === 'in_progress' || milestone.status === 'completed' ? 'In progress' : 'Planned')}</span></div></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location-land' && (
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]">
              <h2 className="text-[18px] font-semibold text-[#1f2937]">{t('Location & Land')}</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {[
                  ['Province', project.province],
                  ['Location', locationLabel],
                  ['Land Area', project.landArea],
                  ['Project Stage', project.stage],
                ].map(([label, value]) => <div key={label} className="rounded-lg border border-[#c8d9ff] bg-white p-4"><div className="text-[14px] text-[#6b7280]">{t(label)}</div><div className="mt-2 text-[16px] font-bold text-[#1f2937]">{t(value)}</div></div>)}
              </div>
              <div className="mt-6 flex flex-wrap items-start gap-6">
                <div className="w-full min-w-0 flex-1 sm:min-w-[343px]">
                  <h3 className="text-[18px] font-semibold leading-7 text-[#1f2937]">{t('Location')}</h3>
                  <div className="relative mt-3 aspect-[392/250] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                    <img src={project.mapImage ?? designVietnamMap} alt={t('Location map')} className="h-full w-full object-cover" />
                    <div className="absolute bottom-3 left-3 flex w-10 flex-col gap-1 drop-shadow-[0_0_2px_rgba(0,0,0,0.25)]">
                      <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-[#1f2937] shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur"><RefreshCcw size={20} /></button>
                      <div className="overflow-hidden rounded-xl bg-white/90 shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur">
                        <button type="button" className="flex h-10 w-10 items-center justify-center text-[#1f2937]"><ZoomIn size={20} /></button>
                        <div className="mx-2 h-px bg-[#e5e7eb]" />
                        <button type="button" className="flex h-10 w-10 items-center justify-center text-[#1f2937]"><ZoomOut size={20} /></button>
                      </div>
                      <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-[#1f2937] shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur"><Crosshair size={20} /></button>
                    </div>
                    <div className="absolute left-1/2 top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#ecfeff] bg-[#0070e0] shadow-[0_0_0_6px_rgba(0,112,224,0.12)]" />
                  </div>
                </div>
                <div className="w-full min-w-0 flex-1 sm:min-w-[343px]">
                  <h3 className="text-[18px] font-semibold leading-7 text-[#1f2937]">{t('Images')}</h3>
                  <div className="mt-3 aspect-[392/250] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                    <img src={project.image} alt={t('Project location')} className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </section>
          )}
          {activeTab === 'investment-details' && <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]"><h2 className="text-[18px] font-semibold text-[#1f2937]">{t('Investment Details')}</h2><div className="mt-4 grid gap-3 lg:grid-cols-3">{[['Total Investment', `$${project.budget}M USD`], ['Minimum Investment', `$${project.minInvestment}M USD`], ['Expected IRR', project.returnRate], ['Construction Period', project.timeline], ['Followers', `${formatFollowerCount(followerCount)} ${t('followers')}`], ['Processing Readiness', `${processingSummary.percentage}%`]].map(([label, value]) => <div key={label} className="rounded-lg border border-[#c8d9ff] bg-white p-4"><div className="text-[14px] text-[#6b7280]">{t(label)}</div><div className="mt-2 text-[16px] font-bold text-[#1f2937]">{t(value)}</div></div>)}</div></section>}
          {activeTab === 'planning-infrastructure' && <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]"><ProjectPlanningInfrastructureSection project={project} projectJobs={projectJobItems} agencies={agencies} processingSummary={processingSummary} t={t} /></div>}
          {activeTab === 'documents' && <section className="rounded-[4px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-8"><h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Documents')}</h2><div className="mt-6 space-y-3">{project.documents.length > 0 ? project.documents.map((document) => <button key={document.id} type="button" onClick={() => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt })} className="flex w-full items-center justify-between gap-3 rounded-[2px] border border-[rgba(224,192,177,0.12)] bg-[#f7f9fb] px-4 py-4 text-left sm:px-5"><div className="min-w-0"><div className="break-words text-[14px] font-medium text-[#191c1e]">{t(document.name)}</div><div className="mt-1 text-[12px] text-[#584237]">{document.type} • {document.size}</div></div><Download size={16} className="shrink-0 text-[#9d4300]" /></button>) : <div className="rounded-[2px] border border-dashed border-[rgba(224,192,177,0.2)] px-4 py-10 text-center text-sm text-slate-500">{t('No documents are available yet.')}</div>}</div></section>}
          {activeTab === 'faq' && <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]"><h2 className="text-[18px] font-semibold text-[#1f2937]">{t('FAQ')}</h2><div className="mt-4 space-y-4">{faqItems.map((item, index) => <details key={item.id} open={index === 0} className="group rounded-lg bg-[#f9fafb] open:bg-white open:shadow-[0_0_24px_rgba(0,0,0,0.08)]"><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 text-[14px] font-medium text-[#030712] sm:px-6 sm:py-5"><Info size={20} className="shrink-0 text-[#5b6b79]" /><span className="min-w-0 flex-1 break-words">{t(item.title)}</span><Plus size={20} className="shrink-0 text-[#5b6b79] group-open:hidden" /><Minus size={20} className="hidden shrink-0 text-[#5b6b79] group-open:block" /></summary><div className="px-4 pb-5 text-[14px] leading-5 text-[#1f2937] sm:px-6 sm:pl-[56px]">{t(item.description)}</div></details>)}</div></section>}
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[linear-gradient(180deg,#ffffff_0%,rgba(228,245,255,0.2)_100%)] p-4 shadow-[0_0_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#fef2eb] text-[#ed6203]"><Landmark size={20} /></div>
              <div className="text-[14px] font-medium text-[#6b7280]">{t('Open for Investor')}</div>
            </div>
            <div className="my-3 h-px bg-[#e5e7eb]" />
            <div className="flex items-center justify-between text-[12px] text-[#1f2937]"><span className="inline-flex items-center gap-1"><Star size={16} />{formatFollowerCount(followerCount)} {t('Followers')}</span><button type="button" onClick={() => toggleWatchlist(project.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#1f2937]" aria-label={t(isFollowing ? 'Following Project' : 'Follow Project')}><Star size={18} className={isFollowing ? 'fill-[#ed6203] text-[#ed6203]' : ''} /></button></div>
            <div className="mt-4 space-y-4">
              <button type="button" onClick={() => { setActiveAction('interest'); setActionStep('form'); }} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 py-2.5 text-[14px] font-medium text-white"><Send size={20} />{t('Express Interest')}</button>
              <button type="button" onClick={() => { setActiveAction('meeting'); setActionStep('form'); }} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#f3f4f6] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1f2937]"><Calendar size={20} />{t('Request Meeting')}</button>
              <button type="button" onClick={() => { setActiveAction('question'); setActionStep('form'); }} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#f3f4f6] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1f2937]"><MessageSquareText size={20} />{t('Ask question')}</button>
            </div>
            {contactOfficer ? <div className="mt-4 border-t border-[#e5e7eb] pt-4"><div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded bg-[#f3f4f6] text-[#5b6b79]"><Building2 size={16} /></div><div><div className="text-[14px] font-medium text-[#030712]">{contactOfficer.name}</div><div className="text-[12px] text-[#6b7280]">{t(contactOfficer.title)}</div></div></div></div> : null}
          </div>
          <div className="min-h-[220px] overflow-hidden rounded-xl border border-[#f3f4f6] bg-white p-4"><div className="text-[14px] text-[#6b7280]">{t('Attachments')}</div><div className="mt-3 space-y-2">{quickResources.map((resource) => <button key={resource.id} type="button" onClick={resource.action} className="flex w-full items-center gap-2 rounded-lg border border-[#f3f4f6] bg-white p-3 text-left text-[14px] font-medium text-[#030712]"><FileText size={22} className="shrink-0 text-[#dc2626]" /><span className="min-w-0 flex-1 truncate">{t(resource.label)}</span><Download size={18} className="shrink-0 text-[#5b6b79]" /></button>)}</div></div>
        </aside>
      </div>

      {activeAction && (
        <ExplorerActionModal onClose={closeModal} panelTitle={activeAction === 'interest' ? t('Investment Interest') : activeAction === 'question' ? t('Investor Question') : t('Meeting Request')} variant={activeAction === 'interest' ? 'investment-interest' : activeAction === 'meeting' ? 'meeting-request' : activeAction === 'question' ? 'investor-question' : 'default'} leftIcon={activeAction === 'interest' ? <Landmark size={54} /> : activeAction === 'question' ? <Send size={54} /> : <Calendar size={54} />} leftTitle={activeAction === 'interest' ? t('Ready to submit your investment interest?') : activeAction === 'question' ? t('Need clarification before moving forward?') : t('Need to coordinate the next decision step?')} leftDescription={activeAction === 'interest' ? t('Share your company profile and project intent. Our team will capture the request and coordinate the next step in the city investment workflow.') : activeAction === 'question' ? t('Send a structured question to the project response queue and keep the due-diligence conversation inside the investor workflow.') : t('Schedule a coordination request with the responsible public-sector team and capture the agenda for the next working session.')}>
          <div className={activeAction === 'interest' || activeAction === 'meeting' || activeAction === 'question' ? 'space-y-3' : 'space-y-6'}>
            {actionStep === 'form' && activeAction === 'interest' && <>
              {interestError ? <div className="rounded-lg border border-[#f3c3a7] bg-[#fff1e7] px-3 py-2 text-[14px] text-[#9d4300]">{interestError}</div> : null}
              <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span><Input value={interestForm.companyName} onChange={(event) => setInterestForm((current) => ({ ...current, companyName: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Enter company name')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Contact Name')}<span className="text-[#dc2626]">*</span></span><Input value={interestForm.contactName} onChange={(event) => setInterestForm((current) => ({ ...current, contactName: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Enter contact name')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Email')}<span className="text-[#dc2626]">*</span></span><Input value={interestForm.email} onChange={(event) => setInterestForm((current) => ({ ...current, email: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Enter email')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Phone Number')}<span className="text-[#dc2626]">*</span></span><div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937]"><button type="button" className="inline-flex shrink-0 items-center gap-1 pr-2 text-[#030712]"><span>VN</span><ChevronDown size={16} className="text-[#6b7280]" /></button><span className="shrink-0 border-l border-[#e5e7eb] px-2 text-[#030712]">+84</span><input value={interestForm.phone} onChange={(event) => setInterestForm((current) => ({ ...current, phone: event.target.value }))} className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder="000-000-000" /></div></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Size')}</span><Input value={interestForm.investmentSize} onChange={(event) => setInterestForm((current) => ({ ...current, investmentSize: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Example: 50')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investment Type')}</span><Input value={interestForm.investmentType} onChange={(event) => setInterestForm((current) => ({ ...current, investmentType: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Example: Corporate')} /></label>
                <div className="space-y-1 md:col-span-2"><div className="text-[14px] font-medium leading-5 text-[#030712]">{t('Associated Project')}</div><div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[14px] font-normal text-[#1f2937]">{t(project.name)}</div></div>
                <label className="space-y-1 md:col-span-2"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Notes')}</span><textarea value={interestForm.notes} onChange={(event) => setInterestForm((current) => ({ ...current, notes: event.target.value }))} rows={5} className="h-[152px] w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Describe your investment interest, target structure, and next steps needed.')} /></label>
              </div>
              <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>
              <div className="flex justify-center pt-1"><button type="button" onClick={handleInterestSubmit} className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702]"><Send size={20} className="shrink-0" />{t('Submit Your Interest')}</button></div>
            </>}
            {actionStep === 'form' && activeAction === 'question' && <>
              <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Contact Person')}<span className="text-[#dc2626]">*</span></span><div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937]"><button type="button" className="inline-flex shrink-0 items-center gap-1 pr-2 text-[#030712]"><span>Mr</span><ChevronDown size={16} className="text-[#6b7280]" /></button><input value={questionForm.contactName} onChange={(event) => setQuestionForm((current) => ({ ...current, contactName: event.target.value }))} className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter full name')} /></div></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span><Input value={questionForm.companyName} onChange={(event) => setQuestionForm((current) => ({ ...current, companyName: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Enter company name')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Email')}<span className="text-[#dc2626]">*</span></span><Input type="email" value={questionForm.email} onChange={(event) => setQuestionForm((current) => ({ ...current, email: event.target.value }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] shadow-none placeholder:text-[#6b7280]" placeholder={t('Enter email address')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Phone Number')}<span className="text-[#dc2626]">*</span></span><div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937]"><button type="button" className="inline-flex shrink-0 items-center gap-1 pr-2 text-[#030712]"><span>VN</span><ChevronDown size={16} className="text-[#6b7280]" /></button><span className="shrink-0 border-l border-[#e5e7eb] px-2 text-[#030712]">+84</span><input value={questionForm.phone} onChange={(event) => setQuestionForm((current) => ({ ...current, phone: event.target.value }))} className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder="000-000-000" /></div></label>
                <div className="space-y-1 md:col-span-2"><div className="text-[14px] font-medium leading-5 text-[#030712]">{t('Associated Project')}</div><div className="flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[14px] font-normal text-[#1f2937]">{t(project.name)}</div></div>
                <label className="space-y-1 md:col-span-2"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Investor Question')}<span className="text-[#dc2626]">*</span></span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} className="h-[152px] w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter a free-text investor question for due diligence or clarification.')} /></label>
              </div>
              <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>
              <div className="flex justify-center pt-1"><button type="button" onClick={handleQuestionSubmit} disabled={!question.trim() || !questionForm.contactName.trim() || !questionForm.companyName.trim() || !questionForm.email.trim() || !questionForm.phone.trim()} className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702] disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={20} className="shrink-0" />{t('Submit Question')}</button></div>
            </>}
            {actionStep === 'form' && activeAction === 'meeting' && <>
              <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Preferred date')}<span className="text-[#dc2626]">*</span></span><div className="relative"><input type="date" value={meeting.preferredDate} onChange={(event) => setMeeting((current) => ({ ...current, preferredDate: event.target.value }))} className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none" /><Calendar size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]" /></div></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Preferred time')}<span className="text-[#dc2626]">*</span></span><input type="time" value={meeting.preferredTime} onChange={(event) => setMeeting((current) => ({ ...current, preferredTime: event.target.value }))} className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none" /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Meeting type')}</span><ClearableSelectField ariaLabel={t('Meeting type')} value={meeting.meetingType} onChange={(value) => setMeeting((current) => ({ ...current, meetingType: value as MeetingType }))} placeholder={t('Select meeting type')} options={[{ value: 'Online', label: t('Online') }, { value: 'Onsite', label: t('Onsite') }]} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none" /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Assigned agency')}<span className="text-[#dc2626]">*</span></span><ClearableSelectField ariaLabel={t('Assigned agency')} value={meeting.assignedAgency} onChange={(value) => setMeeting((current) => ({ ...current, assignedAgency: value }))} placeholder={t('Select agency')} options={agencyOptions.map((agencyName) => ({ value: agencyName, label: t(agencyName) }))} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none" /></label>
                <label className="space-y-1 md:col-span-2"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Company Name')}<span className="text-[#dc2626]">*</span></span><input value={meeting.companyName} onChange={(event) => setMeeting((current) => ({ ...current, companyName: event.target.value }))} className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter company name')} /></label>
                <label className="space-y-1"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Participants')}<span className="text-[#dc2626]">*</span></span><input value={meeting.participants} onChange={(event) => setMeeting((current) => ({ ...current, participants: event.target.value }))} className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter name')} /></label>
                <label className="space-y-1 pt-6"><input value={meeting.participantPosition} onChange={(event) => setMeeting((current) => ({ ...current, participantPosition: event.target.value }))} className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Enter position')} /></label>
                <label className="space-y-1 md:col-span-2"><span className="text-[14px] font-medium leading-5 text-[#030712]">{t('Objectives')}<span className="text-[#dc2626]">*</span></span><textarea value={meeting.agenda} onChange={(event) => setMeeting((current) => ({ ...current, agenda: event.target.value }))} rows={5} className="h-[152px] w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] font-normal text-[#1f2937] outline-none placeholder:text-[#6b7280]" placeholder={t('Summarize the topics, questions, or approvals needed in the meeting.')} /></label>
                <div className="space-y-2 md:col-span-2">
                  <div>
                    <div className="text-[14px] font-medium leading-5 text-[#030712]">{t('Attachment')}</div>
                    <div className="text-[12px] leading-4 text-[#6b7280]">{t('pdf, docx, txt, images formats, up to 5 files/10MB')}</div>
                  </div>
                  <button type="button" className="flex h-[100px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] bg-white text-[12px] leading-4 text-[#6b7280]"><Upload size={20} className="mb-0.5 text-[#6b7280]" />{t('Upload')}</button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[14px] font-medium leading-5 text-[#6b7280]"><span className="relative h-6 w-6 shrink-0"><span className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#e5e7eb] bg-white" /></span><span>{t('By submitting, I agree to the Ho Chi Minh Investment Hub')} <span className="text-[#ed6203] underline">{t('Terms and Conditions')}</span></span></label>
              <div className="flex justify-center pt-1"><button type="button" onClick={handleMeetingSubmit} disabled={!meeting.preferredDate || !meeting.preferredTime || !meeting.assignedAgency || !meeting.companyName.trim() || !meeting.participants.trim() || !meeting.participantPosition.trim() || !meeting.agenda.trim()} className="inline-flex h-10 min-w-[208px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ed6203] px-4 py-2.5 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-[#d95702] disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={20} className="shrink-0" />{t('Submit Request')}</button></div>
            </>}
            {actionStep === 'success' && <div className="space-y-6"><div className="rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6"><div className="text-[28px] font-semibold text-[#1a2755]">{activeAction === 'interest' ? t('Your interest has been submitted') : activeAction === 'question' ? t('Question submitted') : t('Meeting request submitted')}</div><div className="mt-3 text-[16px] leading-7 text-[#617086]">{activeAction === 'interest' ? t('The intake has been recorded and routed to the responsible investment support desk.') : t('This information has been routed to ITPC Communication Portal for follow-up.')}</div>{submittedReference ? <div className={`mt-6 grid gap-4 ${activeAction === 'interest' ? 'md:grid-cols-2' : ''}`}><div className="rounded-none bg-white px-5 py-5"><div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t(activeAction === 'interest' ? 'Opportunity' : 'Reference')}</div><div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedReference}</div></div>{activeAction === 'interest' && submittedSupportReference ? <div className="rounded-none bg-white px-5 py-5"><div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Support request')}</div><div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedSupportReference}</div></div> : null}</div> : null}</div><div className="flex justify-center"><button type="button" onClick={closeModal} className="inline-flex min-w-[240px] items-center justify-center whitespace-nowrap rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white">{t('Close')}</button></div></div>}
          </div>
        </ExplorerActionModal>
      )}
    </div>
  );
}
