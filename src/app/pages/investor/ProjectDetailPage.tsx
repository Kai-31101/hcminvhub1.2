import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Calendar, ChevronRight, Download, Landmark, MapPin, MessageSquareText, Send, Star } from 'lucide-react';
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
type DetailTab = 'overview' | 'location-land' | 'investment-details' | 'planning-infrastructure' | 'documents' | 'activity';

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'location-land', label: 'Location & Land' },
  { id: 'investment-details', label: 'Investment Details' },
  { id: 'planning-infrastructure', label: 'Planning & Infrastructure' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
];

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
  const [meeting, setMeeting] = useState({ preferredDate: '', preferredTime: '', meetingType: '' as MeetingType, participants: '', agenda: '', notes: '', assignedAgency: '' });

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
  const agencyOptions = useMemo(() => Array.from(new Set(['Department of Planning and Investment', ...agencies.map((agency) => agency.name)])), [agencies]);
  const quickResources = [
    ...(project.documents ?? []).slice(0, 2).map((document) => ({ id: document.id, label: document.name, action: () => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt }) })),
    { id: 'resource-master-plan', label: t('Master Plan Layout'), action: () => window.open(project.mapImage ?? project.image, '_blank', 'noopener,noreferrer') },
    { id: 'resource-legal', label: t('Legal Framework Documents'), action: () => window.open('#/investor/execution', '_blank', 'noopener,noreferrer') },
  ].slice(0, 3);

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
    setMeeting({ preferredDate: '', preferredTime: '', meetingType: '', participants: '', agenda: '', notes: '', assignedAgency: '' });
  }

  function handleInterestSubmit() {
    if (!interestForm.companyName.trim() || !interestForm.contactName.trim() || !interestForm.email.trim()) {
      setInterestError(t('Please complete company name, contact name, and email.'));
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
    if (!question.trim()) return;
    const issueId = createIssue({
      projectId: project.id, projectName: project.name, title: `Investor Q&A thread: ${project.name}`, description: question.trim(),
      priority: 'high', status: 'open', assignedTo: 'Government Operator Desk', reportedBy: activeInvestorCompany,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Q&A',
    });
    updateProject(project.id, {
      qa: [...(project.qa ?? []), { id: `qa${Date.now()}`, question: question.trim(), askedBy: activeInvestorCompany, askedAt: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') }],
    });
    setSubmittedReference(issueId);
    setActionStep('success');
  }

  function handleMeetingSubmit() {
    if (!meeting.preferredDate || !meeting.preferredTime || !meeting.agenda.trim()) return;
    const requestId = createServiceRequest({
      serviceId: 'meeting-request', serviceName: 'Meeting Request', applicant: activeInvestorCompany, projectId: project.id, projectName: project.name,
      assignedAgency: meeting.assignedAgency, documents: [],
      notes: [`Preferred date: ${meeting.preferredDate}`, `Preferred time: ${meeting.preferredTime}`, `Meeting type: ${meeting.meetingType}`, `Participants: ${meeting.participants || '-'}`, `Agenda: ${meeting.agenda.trim()}`, meeting.notes.trim() ? `Additional notes: ${meeting.notes.trim()}` : ''].filter(Boolean).join(' | '),
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
    <div className="page-shell pb-10">
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.05em] text-[#455f87]">
            <Link to="/investor/explorer" className="inline-flex items-center gap-1 hover:text-[#9d4300]"><ArrowLeft size={14} />{t('Home')}</Link>
            <ChevronRight size={12} /><span>{t('Projects')}</span><ChevronRight size={12} /><span className="text-[#9d4300]">{t(project.name)}</span>
          </div>

          <section className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-[12px] bg-[#ffdbca] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#341100]">{t('Action Required')}</span>
              <span className="rounded-[12px] bg-[#d5e3ff] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#001c3b]">{t('Public-Private Partnership')}</span>
              <span className="rounded-[12px] bg-[#e0e3e5] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#584237]">{t(project.sector)}</span>
            </div>
            <h1 className="max-w-5xl text-[48px] leading-[1] tracking-[-0.04em] text-[#191c1e]">{t(project.name)}</h1>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#e0e3e5] text-[#455f87]"><Building2 size={18} /></div>
                <div><div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Project Owner')}</div><div className="text-[14px] text-[#191c1e]">{ownerAgencyLabel}</div></div>
              </div>
              <div className="h-8 w-px bg-[rgba(224,192,177,0.3)]" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#e0e3e5] text-[#455f87]"><Landmark size={18} /></div>
                <div><div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Total Investment')}</div><div className="text-[14px] font-medium text-[#9d4300]">${project.budget}M USD</div></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#455f87]"><MapPin size={14} />{locationLabel}</div>
            </div>
          </section>

          <section><div className="flex flex-nowrap gap-8 overflow-x-auto border-b border-[rgba(224,192,177,0.2)]">{tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`border-b-2 pb-[18px] pt-[2px] text-[14px] transition-colors ${activeTab === tab.id ? 'border-[#9d4300] text-[#9d4300]' : 'border-transparent text-[#455f87] hover:text-[#9d4300]'}`}>{t(tab.label)}</button>
          ))}</div></section>

          {activeTab === 'overview' && (
            <div className="space-y-10">
              <div className="space-y-8">
                <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_332px]">
                  <div className="space-y-6 min-w-0">
                    <div>
                      <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Project Summary')}</h2>
                      <div className="mt-5 space-y-5 text-[16px] leading-[1.65] text-[#584237]">{(summaryParagraphs.length ? summaryParagraphs : [t(project.description)]).slice(0, 2).map((paragraph, index) => <p key={`${project.id}-${index}`}>{paragraph}</p>)}</div>
                    </div>
                    <div className="rounded-[4px] bg-[#f2f4f6] p-6">
                      <div className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[#455f87]">{t('Key Performance Indicators')}</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {[
                          ['Land Area', project.landArea, 'text-[#191c1e]'],
                          ['Construction Period', project.timeline, 'text-[#191c1e]'],
                          ['Est. Yearly Revenue', `$${project.budget ? Math.round(project.budget * 0.2) : 240}M USD`, 'text-[#006398]'],
                          ['Job Creation', `${Math.max(project.jobs * 250, 12000).toLocaleString()}+`, 'text-[#191c1e]'],
                        ].map(([label, value, tone]) => <div key={label} className="rounded-[2px] bg-white p-4"><div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div><div className={`mt-2 text-[18px] font-medium ${tone}`}>{t(value)}</div></div>)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 min-w-0">
                    <div className="overflow-hidden rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-white"><img src={project.image} alt={t(project.name)} className="h-[220px] w-full object-cover" /><div className="px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[#8c7164]">{t('Artist Impression')}</div></div>
                    <div className="overflow-hidden rounded-[4px] border border-[rgba(224,192,177,0.14)] bg-white"><img src={project.mapImage ?? designVietnamMap} alt={t('Location map')} className="h-[138px] w-full object-cover" /></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#191c1e]">{t('Investment Milestones')}</h2>
                  <div className="mt-5 overflow-x-auto rounded-[4px] border border-[rgba(224,192,177,0.12)] bg-white">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-[120px_minmax(280px,1fr)_140px_130px] bg-[#eceef0] text-[10px] uppercase tracking-[0.08em] text-[#584237]"><div className="px-5 py-3">{t('Phase')}</div><div className="px-5 py-3">{t('Milestone Description')}</div><div className="px-5 py-3">{t('Target Date')}</div><div className="px-5 py-3 text-center">{t('Status')}</div></div>
                      {milestoneRows.map((milestone, index) => <div key={milestone.id} className={`grid min-h-[76px] grid-cols-[120px_minmax(280px,1fr)_140px_130px] border-t border-[rgba(224,192,177,0.08)] text-[14px] ${index % 2 === 0 ? 'bg-[#f7f9fb]' : 'bg-[#f2f4f6]'}`}><div className="px-5 py-4 font-semibold leading-7 text-[#191c1e]">{t(milestone.phase)}</div><div className="px-5 py-4 leading-7 text-[#584237]">{t(milestone.description)}</div><div className="px-5 py-4 leading-7 text-[#191c1e]">{milestone.dueDate}</div><div className="flex items-center justify-center px-5 py-4"><span className={`inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-[14px] px-3 py-2 text-center text-[10px] uppercase leading-none tracking-[0.06em] ${milestone.status === 'in_progress' || milestone.status === 'completed' ? 'bg-[#b5d0fd] text-[#3e5980]' : 'bg-[#e0e3e5] text-[#584237]'}`}>{t(milestone.status === 'in_progress' || milestone.status === 'completed' ? 'In Progress' : 'Planned')}</span></div></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location-land' && <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"><h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Location & Land')}</h2><div className="mt-6 grid gap-4 lg:grid-cols-2">{[['Province', project.province], ['Location', locationLabel], ['Land Area', project.landArea], ['Project Stage', project.stage]].map(([label, value]) => <div key={label} className="rounded-[2px] bg-[#f7f9fb] p-5"><div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div><div className="mt-2 text-[20px] font-medium text-[#191c1e]">{t(value)}</div></div>)}</div></section>}
          {activeTab === 'investment-details' && <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"><h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Investment Details')}</h2><div className="mt-6 grid gap-4 lg:grid-cols-3">{[['Total Investment', `$${project.budget}M USD`], ['Minimum Investment', `$${project.minInvestment}M USD`], ['Expected IRR', project.returnRate], ['Construction Period', project.timeline], ['Followers', `${formatFollowerCount(followerCount)} ${t('followers')}`], ['Processing Readiness', `${processingSummary.percentage}%`]].map(([label, value]) => <div key={label} className="rounded-[2px] bg-[#f7f9fb] p-5"><div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t(label)}</div><div className="mt-2 text-[20px] font-medium text-[#191c1e]">{t(value)}</div></div>)}</div></section>}
          {activeTab === 'planning-infrastructure' && <ProjectPlanningInfrastructureSection project={project} projectJobs={projectJobItems} agencies={agencies} processingSummary={processingSummary} t={t} />}
          {activeTab === 'documents' && <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"><h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Documents')}</h2><div className="mt-6 space-y-3">{project.documents.length > 0 ? project.documents.map((document) => <button key={document.id} type="button" onClick={() => downloadAttachment({ fileName: document.name, fileUrl: document.fileUrl, lastUploadDate: document.uploadedAt })} className="flex w-full items-center justify-between rounded-[2px] border border-[rgba(224,192,177,0.12)] bg-[#f7f9fb] px-5 py-4 text-left"><div><div className="text-[14px] font-medium text-[#191c1e]">{t(document.name)}</div><div className="mt-1 text-[12px] text-[#584237]">{document.type} • {document.size}</div></div><Download size={16} className="text-[#9d4300]" /></button>) : <div className="rounded-[2px] border border-dashed border-[rgba(224,192,177,0.2)] px-4 py-10 text-center text-sm text-slate-500">{t('No documents are available yet.')}</div>}</div></section>}
          {activeTab === 'activity' && <section className="rounded-[4px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"><h2 className="text-[20px] font-semibold text-[#191c1e]">{t('Activity')}</h2><div className="mt-6 space-y-4">{project.qa.length > 0 ? project.qa.map((item) => <div key={item.id} className="rounded-[2px] border border-[rgba(224,192,177,0.12)] bg-[#f7f9fb] p-5"><div className="text-[14px] font-medium text-[#191c1e]">{t(item.question)}</div><div className="mt-2 text-[12px] text-[#584237]">{item.askedBy} • {item.askedAt}</div>{item.answer ? <div className="mt-3 text-sm leading-7 text-[#455f87]">{t(item.answer)}</div> : null}</div>) : <div className="rounded-[2px] border border-dashed border-[rgba(224,192,177,0.2)] px-4 py-10 text-center text-sm text-slate-500">{t('No activity has been recorded for this project yet.')}</div>}</div></section>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[4px] border-b-2 border-[rgba(224,192,177,0.2)] bg-white px-8 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#455f87]">{t('Interest Level')}</div>
            <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-[12px] bg-[#eceef0]"><div className="h-full w-4/5 bg-[#9d4300]" /></div><div className="text-[14px] font-medium text-[#191c1e]">{t('High')}</div></div>
            <button type="button" onClick={() => { setActiveAction('interest'); setActionStep('form'); }} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[2px] bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-4 py-4 text-[14px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"><Send size={14} />{t('Express Interest')}</button>
            <div className="mt-5 space-y-3">
              <button type="button" onClick={() => toggleWatchlist(project.id)} className="flex w-full items-center gap-3 rounded-[2px] bg-[#e6e8ea] px-4 py-4 text-left text-[13px] font-medium text-[#3e5980]"><Star size={14} />{t(isFollowing ? 'Following Project' : 'Follow Project')}</button>
              <button type="button" onClick={() => { setActiveAction('meeting'); setActionStep('form'); }} className="flex w-full items-center gap-3 rounded-[2px] bg-[#e6e8ea] px-4 py-4 text-left text-[13px] font-medium text-[#3e5980]"><Calendar size={14} />{t('Request Meeting')}</button>
              <button type="button" onClick={() => { setActiveAction('question'); setActionStep('form'); }} className="flex w-full items-center gap-3 rounded-[2px] bg-[#e6e8ea] px-4 py-4 text-left text-[13px] font-medium text-[#3e5980]"><MessageSquareText size={14} />{t('Ask Question')}</button>
            </div>
            {contactOfficer ? <div className="mt-6 border-t border-[rgba(224,192,177,0.1)] pt-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(224,192,177,0.2)] bg-[#f2f4f6] text-[#455f87]"><Building2 size={16} /></div><div><div className="text-[12px] font-medium text-[#191c1e]">{contactOfficer.name}</div><div className="text-[10px] text-[#584237]">{t(contactOfficer.title)}</div></div></div></div> : null}
          </div>
          <div className="rounded-[4px] bg-[#455f87] p-6"><div className="text-[12px] uppercase tracking-[0.1em] text-[#ffdbca]">{t('Quick Resources')}</div><div className="mt-4 space-y-3">{quickResources.map((resource) => <button key={resource.id} type="button" onClick={resource.action} className="flex w-full items-center gap-3 text-left text-[12px] text-white"><Download size={12} /><span className="flex-1">{t(resource.label)}</span><ChevronRight size={12} /></button>)}</div></div>
        </aside>
      </div>

      {activeAction && (
        <ExplorerActionModal onClose={closeModal} panelTitle={activeAction === 'interest' ? t('Investment Interest') : activeAction === 'question' ? t('Investor Question') : t('Meeting Request')} leftIcon={activeAction === 'interest' ? <Landmark size={54} /> : activeAction === 'question' ? <Send size={54} /> : <Calendar size={54} />} leftTitle={activeAction === 'interest' ? t('Ready to submit your investment interest?') : activeAction === 'question' ? t('Need clarification before moving forward?') : t('Need to coordinate the next decision step?')} leftDescription={activeAction === 'interest' ? t('Share your company profile and project intent. Our team will capture the request and coordinate the next step in the city investment workflow.') : activeAction === 'question' ? t('Send a structured question to the project response queue and keep the due-diligence conversation inside the investor workflow.') : t('Schedule a coordination request with the responsible public-sector team and capture the agenda for the next working session.')}>
          <div className="space-y-6">
            {actionStep === 'form' && activeAction === 'interest' && <>
              {interestError ? <div className="border border-[#f3c3a7] bg-[#fff1e7] px-4 py-3 text-[14px] text-[#9d4300]">{interestError}</div> : null}
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Company Name')} <span className="text-[#f97316]">(*)</span></span><Input value={interestForm.companyName} onChange={(event) => setInterestForm((current) => ({ ...current, companyName: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Enter company name')} /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Contact Name')} <span className="text-[#f97316]">(*)</span></span><Input value={interestForm.contactName} onChange={(event) => setInterestForm((current) => ({ ...current, contactName: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Enter contact name')} /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Email')} <span className="text-[#f97316]">(*)</span></span><Input value={interestForm.email} onChange={(event) => setInterestForm((current) => ({ ...current, email: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Enter email')} /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Phone')}</span><Input value={interestForm.phone} onChange={(event) => setInterestForm((current) => ({ ...current, phone: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Enter phone number')} /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Investment Size')}</span><Input value={interestForm.investmentSize} onChange={(event) => setInterestForm((current) => ({ ...current, investmentSize: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Example: 50')} /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Investment Type')}</span><Input value={interestForm.investmentType} onChange={(event) => setInterestForm((current) => ({ ...current, investmentType: event.target.value }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] shadow-none" placeholder={t('Example: Corporate')} /></label>
                <div className="rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5 md:col-span-2"><div className="text-[14px] font-medium text-[#1a2755]">{t('Associated Project')}</div><div className="mt-2 text-[18px] font-semibold text-[#191c1e]">{t(project.name)}</div></div>
                <label className="space-y-2 md:col-span-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Notes')}</span><textarea value={interestForm.notes} onChange={(event) => setInterestForm((current) => ({ ...current, notes: event.target.value }))} rows={5} className="min-h-[170px] w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]" placeholder={t('Describe your investment interest, target structure, and next steps needed.')} /></label>
              </div>
              <div className="flex justify-center pt-2"><button type="button" onClick={handleInterestSubmit} className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)]"><Send size={20} />{t('Submit Your Interest')}</button></div>
            </>}
            {actionStep === 'form' && activeAction === 'question' && <>
              <div className="rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-5"><div className="text-[14px] font-medium text-[#1a2755]">{t('Associated Project')}</div><div className="mt-2 text-[18px] font-semibold text-[#191c1e]">{t(project.name)}</div></div>
              <label className="block space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Investor Question')} <span className="text-[#f97316]">(*)</span></span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={6} className="min-h-[190px] w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]" placeholder={t('Enter a free-text investor question for due diligence or clarification.')} /></label>
              <div className="flex justify-center pt-2"><button type="button" onClick={handleQuestionSubmit} disabled={!question.trim()} className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"><Send size={20} />{t('Submit question')}</button></div>
            </>}
            {actionStep === 'form' && activeAction === 'meeting' && <>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Preferred date')} <span className="text-[#f97316]">(*)</span></span><input type="date" value={meeting.preferredDate} onChange={(event) => setMeeting((current) => ({ ...current, preferredDate: event.target.value }))} className="h-14 w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none" /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Preferred time')} <span className="text-[#f97316]">(*)</span></span><input type="time" value={meeting.preferredTime} onChange={(event) => setMeeting((current) => ({ ...current, preferredTime: event.target.value }))} className="h-14 w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none" /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Meeting type')}</span><ClearableSelectField ariaLabel={t('Meeting type')} value={meeting.meetingType} onChange={(value) => setMeeting((current) => ({ ...current, meetingType: value as MeetingType }))} placeholder={t('Select meeting type')} options={[{ value: 'Online', label: t('Online') }, { value: 'Onsite', label: t('Onsite') }]} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none" /></label>
                <label className="space-y-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Assigned agency')}</span><ClearableSelectField ariaLabel={t('Assigned agency')} value={meeting.assignedAgency} onChange={(value) => setMeeting((current) => ({ ...current, assignedAgency: value }))} placeholder={t('Select agency')} options={agencyOptions.map((agencyName) => ({ value: agencyName, label: t(agencyName) }))} className="h-14 rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none" /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Participants')}</span><input value={meeting.participants} onChange={(event) => setMeeting((current) => ({ ...current, participants: event.target.value }))} className="h-14 w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]" placeholder={t('Example: CIO, project counsel, technical advisor')} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Agenda')} <span className="text-[#f97316]">(*)</span></span><textarea value={meeting.agenda} onChange={(event) => setMeeting((current) => ({ ...current, agenda: event.target.value }))} rows={5} className="min-h-[170px] w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]" placeholder={t('Summarize the topics, questions, or approvals needed in the meeting.')} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-[14px] font-medium text-[#1a2755]">{t('Additional Notes')}</span><textarea value={meeting.notes} onChange={(event) => setMeeting((current) => ({ ...current, notes: event.target.value }))} rows={4} className="min-h-[140px] w-full rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-5 py-4 text-[16px] text-[#1f2937] outline-none placeholder:text-[#8b97a8]" placeholder={t('Add context for the coordination team, logistics, or supporting context.')} /></label>
              </div>
              <div className="flex justify-center pt-2"><button type="button" onClick={handleMeetingSubmit} disabled={!meeting.preferredDate || !meeting.preferredTime || !meeting.agenda.trim()} className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-5 text-[20px] font-semibold text-white shadow-[0_10px_18px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"><Calendar size={20} />{t('Submit request')}</button></div>
            </>}
            {actionStep === 'success' && <div className="space-y-6"><div className="rounded-none border border-[#dfe5ec] bg-[#f7f9fb] px-6 py-6"><div className="text-[28px] font-semibold text-[#1a2755]">{activeAction === 'interest' ? t('Your interest has been submitted') : activeAction === 'question' ? t('Question submitted') : t('Meeting request submitted')}</div><div className="mt-3 text-[16px] leading-7 text-[#617086]">{activeAction === 'interest' ? t('The intake has been recorded and routed to the responsible investment support desk.') : t('This information has been routed to ITPC Communication Portal for follow-up.')}</div>{submittedReference ? <div className={`mt-6 grid gap-4 ${activeAction === 'interest' ? 'md:grid-cols-2' : ''}`}><div className="rounded-none bg-white px-5 py-5"><div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t(activeAction === 'interest' ? 'Opportunity' : 'Reference')}</div><div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedReference}</div></div>{activeAction === 'interest' && submittedSupportReference ? <div className="rounded-none bg-white px-5 py-5"><div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8c7164]">{t('Support request')}</div><div className="mt-2 text-[22px] font-semibold text-[#191c1e]">{submittedSupportReference}</div></div> : null}</div> : null}</div><div className="flex justify-center"><button type="button" onClick={closeModal} className="inline-flex min-w-[240px] items-center justify-center rounded-none bg-[linear-gradient(10deg,#9d4300_0%,#f97316_100%)] px-8 py-4 text-[18px] font-semibold text-white">{t('Close')}</button></div></div>}
          </div>
        </ExplorerActionModal>
      )}
    </div>
  );
}
