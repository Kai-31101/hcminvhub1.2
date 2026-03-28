import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, CircleDot, FileUp, Landmark, Save, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

type InterestType = 'Express Interest' | 'Request Meeting' | 'Request Info';
type PriorityLevel = 'Normal' | 'High' | 'Urgent';
type InvestmentType = 'Equity' | 'JV' | 'PPP';
type MeetingType = 'Online' | 'Onsite';

interface CompanyInfoState {
  companyName: string;
  country: string;
  website: string;
  companyProfileLink: string;
  companyProfileFileName: string;
  companyType: string;
  representative: string;
  email: string;
  phone: string;
}

interface InvestmentIntentState {
  interestType: InterestType | '';
  intendedInvestmentSize: string;
  investmentType: InvestmentType | '';
  ownershipExpectation: string;
  timelineToInvest: string;
}

interface IntakeState {
  companyInfo: CompanyInfoState;
  investmentIntent: InvestmentIntentState;
  interestReasons: string[];
  interestNote: string;
  mustHaves: string[];
  dealBreakers: string[];
  specificRequirements: string;
  investorQuestion: string;
  meetingPreferredDate: string;
  meetingPreferredTime: string;
  meetingType: MeetingType | '';
  meetingAgenda: string;
  meetingParticipants: string;
  priority: PriorityLevel;
}

interface DraftPayload {
  step: number;
  intake: IntakeState;
  savedAt: string;
}

const steps = [
  { id: 1, title: 'Quick Intent', icon: <CircleDot size={16} /> },
  { id: 2, title: 'Expanded Intake', icon: <Landmark size={16} /> },
  { id: 3, title: 'Submit', icon: <Send size={16} /> },
];

const interestReasonOptions = ['Strategic expansion', 'Market entry', 'Supply chain', 'Technology'];
const mustHaveOptions = ['land cleared', 'legal ready', 'infra ready'];
const dealBreakerOptions = ['unclear legal', 'lack of infra'];
const interestTypeOptions: InterestType[] = ['Express Interest', 'Request Meeting', 'Request Info'];
const investmentTypeOptions: InvestmentType[] = ['Equity', 'JV', 'PPP'];
const priorityOptions: PriorityLevel[] = ['Normal', 'High', 'Urgent'];
const meetingTypeOptions: MeetingType[] = ['Online', 'Onsite'];
const companyTypeOptions = ['Fund', 'Corporate', 'Developer', 'Strategic Investor', 'Sovereign Fund'];

function toggleListValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function buildDefaultIntake(
  companyName: string,
  fallbackCountry: string,
  fallbackWebsite: string,
  email: string,
  phone: string,
  companyType: string,
): IntakeState {
  return {
    companyInfo: {
      companyName,
      country: fallbackCountry,
      website: fallbackWebsite,
      companyProfileLink: '',
      companyProfileFileName: '',
      companyType,
      representative: '',
      email,
      phone,
    },
    investmentIntent: {
      interestType: '',
      intendedInvestmentSize: '',
      investmentType: '',
      ownershipExpectation: '',
      timelineToInvest: '',
    },
    interestReasons: [],
    interestNote: '',
    mustHaves: [],
    dealBreakers: [],
    specificRequirements: '',
    investorQuestion: '',
    meetingPreferredDate: '',
    meetingPreferredTime: '',
    meetingType: '',
    meetingAgenda: '',
    meetingParticipants: '',
    priority: 'Normal',
  };
}

function getEffectivePriority(intake: IntakeState): PriorityLevel {
  if (intake.priority === 'Urgent') return 'Urgent';
  if (intake.investmentIntent.interestType === 'Request Meeting' || intake.investorQuestion.trim()) return 'High';
  return intake.priority;
}

function getSlaItems(t: (value: string) => string, priority: PriorityLevel) {
  return [
    `${t('0-24h')}: ${priority === 'Urgent' ? t('Immediate owner review') : t('Normal response window')}`,
    `${t('24-48h')}: ${t('Reminder to operator and assigned owner')}`,
    `${t('>48h')}: ${t('Escalation to leadership queue')}`,
  ];
}

function parseAmountValue(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function IntakeFormPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    language,
    projects,
    opportunities,
    activeInvestorCompany,
    setActiveInvestorCompany,
    createOpportunity,
    createIssue,
    createServiceRequest,
    addNotification,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const project = projects.find((item) => item.id === projectId);

  const latestKnownProfile = useMemo(() => {
    const related = opportunities
      .filter((item) => item.investorCompany === activeInvestorCompany)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return related[0];
  }, [activeInvestorCompany, opportunities]);

  const draftKey = useMemo(() => `hcminvhub-intake-draft-${projectId ?? 'unknown'}`, [projectId]);

  const initialIntake = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as DraftPayload;
          return parsed.intake;
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      }
    }

    return buildDefaultIntake(
      activeInvestorCompany || latestKnownProfile?.investorCompany || '',
      latestKnownProfile?.investorCountry || 'Vietnam',
      '',
      latestKnownProfile?.intakeData.contactEmail || '',
      latestKnownProfile?.intakeData.contactPhone || '',
      latestKnownProfile?.investorType || 'Corporate',
    );
  }, [activeInvestorCompany, draftKey, latestKnownProfile]);

  const initialStep = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return 1;
    try {
      const parsed = JSON.parse(saved) as DraftPayload;
      return Math.min(3, Math.max(1, parsed.step || 1));
    } catch {
      return 1;
    }
  }, [draftKey]);

  const [step, setStep] = useState(initialStep);
  const [intake, setIntake] = useState<IntakeState>(initialIntake);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOpportunityId, setSubmittedOpportunityId] = useState('');
  const [meetingTicketId, setMeetingTicketId] = useState('');
  const [questionTicketId, setQuestionTicketId] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState('');

  const effectivePriority = getEffectivePriority(intake);
  const slaItems = getSlaItems(t, effectivePriority);
  const selectedInterestType = intake.investmentIntent.interestType;
  const requiresMeetingBlock = selectedInterestType === 'Request Meeting';
  const canAdvanceFromStepOne = Boolean(selectedInterestType && intake.investmentIntent.intendedInvestmentSize.trim());
  const canReview = Boolean(
    intake.companyInfo.companyName.trim() &&
      intake.companyInfo.country.trim() &&
      selectedInterestType &&
      intake.investmentIntent.intendedInvestmentSize.trim() &&
      intake.investmentIntent.investmentType &&
      intake.investmentIntent.timelineToInvest.trim() &&
      (!requiresMeetingBlock ||
        (intake.meetingPreferredDate && intake.meetingPreferredTime && intake.meetingType && intake.meetingAgenda.trim())),
  );
  const workflowObjects = [
    { label: 'Create Opportunity', active: true, tone: 'info' as const, note: 'The intake becomes a tracked opportunity in the government pipeline.' },
    { label: 'Create Q&A Thread', active: Boolean(intake.investorQuestion.trim()), tone: 'warning' as const, note: 'A question entry is routed for response if the investor includes one.' },
    { label: 'Create Meeting Ticket', active: requiresMeetingBlock, tone: 'success' as const, note: 'A meeting workflow ticket is created when the investor requests a meeting.' },
  ];
  const enrichmentSignals = [
    { label: 'Appetite', value: intake.interestReasons.join(', ') || 'To be extracted' },
    { label: 'Sectors', value: project ? project.sector : 'To be extracted' },
    { label: 'Ticket size', value: intake.investmentIntent.intendedInvestmentSize || 'To be extracted' },
  ];

  useEffect(() => {
    if (submitted || typeof window === 'undefined') return;
    const payload: DraftPayload = {
      step,
      intake,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(draftKey, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }, [draftKey, intake, step, submitted]);

  function updateCompanyInfo<K extends keyof CompanyInfoState>(key: K, value: CompanyInfoState[K]) {
    setIntake((current) => ({
      ...current,
      companyInfo: { ...current.companyInfo, [key]: value },
    }));
  }

  function updateInvestmentIntent<K extends keyof InvestmentIntentState>(key: K, value: InvestmentIntentState[K]) {
    setIntake((current) => ({
      ...current,
      investmentIntent: { ...current.investmentIntent, [key]: value },
    }));
  }

  function handleCompanyProfileFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateCompanyInfo('companyProfileFileName', file.name);
  }

  function handleFastImport() {
    const inferredCompany = activeInvestorCompany || latestKnownProfile?.investorCompany || 'Investor Company';
    setWorkflowError('');
    setIntake((current) => ({
      ...current,
      companyInfo: {
        ...current.companyInfo,
        companyName: current.companyInfo.companyName || inferredCompany,
        country: current.companyInfo.country || latestKnownProfile?.investorCountry || 'Singapore',
        website: current.companyInfo.website || 'https://investor-company.example',
        companyProfileLink: current.companyInfo.companyProfileLink || 'https://investor-company.example/profile.pdf',
        companyType: current.companyInfo.companyType || latestKnownProfile?.investorType || 'Fund',
        representative: current.companyInfo.representative || latestKnownProfile?.investorName || 'Investment Director',
        email: current.companyInfo.email || latestKnownProfile?.intakeData.contactEmail || 'contact@investor-company.example',
        phone: current.companyInfo.phone || latestKnownProfile?.intakeData.contactPhone || '+65 6000 0000',
      },
    }));
  }

  function handleSaveDraft() {
    const payload: DraftPayload = {
      step,
      intake,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(draftKey, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }

  function validateStep(targetStep: number) {
    if (targetStep === 2) {
      return canAdvanceFromStepOne;
    }
    if (targetStep === 3) {
      return canReview;
    }
    return true;
  }

  function goNextStep() {
    const nextStep = step + 1;
    if (!validateStep(nextStep)) {
      setWorkflowError(
        nextStep === 2
          ? t('Select an interest type and intended investment size before continuing.')
          : t('Complete the required company, intent, and meeting fields before moving to review.'),
      );
      return;
    }
    setWorkflowError('');
    setStep(nextStep);
  }

  function handleSubmitAttempt() {
    if (!validateStep(3)) {
      setStep(2);
      setWorkflowError(t('Complete the required company, intent, and meeting fields before submission.'));
      return;
    }
    setWorkflowError('');
    handleSubmitIntake();
  }

  function buildOpportunityNotes() {
    return [
      `Interest type: ${intake.investmentIntent.interestType || '-'}`,
      `Priority: ${effectivePriority}`,
      `Investment type: ${intake.investmentIntent.investmentType || '-'}`,
      `Ownership expectation: ${intake.investmentIntent.ownershipExpectation || '-'}`,
      `Timeline to invest: ${intake.investmentIntent.timelineToInvest || '-'}`,
      `Interest reasons: ${intake.interestReasons.join(', ') || '-'}`,
      `Must-have: ${intake.mustHaves.join(', ') || '-'}`,
      `Deal breakers: ${intake.dealBreakers.join(', ') || '-'}`,
      `Specific requirements: ${intake.specificRequirements || '-'}`,
      `Specific note: ${intake.interestNote || '-'}`,
    ].join(' | ');
  }

  function handleSubmitIntake() {
    const companyName = intake.companyInfo.companyName.trim() || activeInvestorCompany || 'New Investor Submission';
    const investorName = intake.companyInfo.representative.trim() || 'Investor Representative';
    const amount = parseAmountValue(intake.investmentIntent.intendedInvestmentSize) || project?.minInvestment || 0;

    if (!project) return;

    setActiveInvestorCompany(companyName);

    const opportunityId = createOpportunity({
      projectId: project.id,
      projectName: project.name,
      investorName,
      investorCompany: companyName,
      investorCountry: intake.companyInfo.country.trim() || 'Vietnam',
      investorType: intake.companyInfo.companyType.trim() || 'Corporate',
      amount,
      stage: 'new',
      notes: buildOpportunityNotes(),
      intakeData: {
        investmentStructure: intake.investmentIntent.investmentType || 'To be confirmed',
        timeline: intake.investmentIntent.timelineToInvest || 'To be confirmed',
        fundSource: intake.interestReasons.join(', ') || 'To be confirmed',
        experience: intake.interestNote.trim() || 'Not provided yet',
        contactEmail: intake.companyInfo.email.trim() || 'Not provided',
        contactPhone: intake.companyInfo.phone.trim() || 'Not provided',
      },
    });

    let createdQuestionId = '';
    if (intake.investorQuestion.trim()) {
      createdQuestionId = createIssue({
        projectId: project.id,
        projectName: project.name,
        title: `Investor Q&A thread: ${companyName}`,
        description: intake.investorQuestion.trim(),
        priority: effectivePriority === 'Urgent' ? 'critical' : 'high',
        status: 'open',
        assignedTo: 'Government Operator Desk',
        reportedBy: companyName,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Q&A',
      });
    }

    let createdMeetingId = '';
    if (intake.investmentIntent.interestType === 'Request Meeting') {
      createdMeetingId = createServiceRequest({
        serviceId: 'meeting-request',
        serviceName: 'Meeting Request',
        applicant: companyName,
        projectId: project.id,
        projectName: project.name,
        assignedAgency: 'Department of Planning & Investment',
        documents: [intake.companyInfo.companyProfileFileName, intake.companyInfo.companyProfileLink].filter(Boolean),
        notes: [
          `Preferred date: ${intake.meetingPreferredDate || '-'}`,
          `Preferred time: ${intake.meetingPreferredTime || '-'}`,
          `Meeting type: ${intake.meetingType || '-'}`,
          `Agenda: ${intake.meetingAgenda || '-'}`,
          `Participants: ${intake.meetingParticipants || '-'}`,
          `Priority: ${effectivePriority}`,
          'SLA: meeting requests are handled as HIGH priority.',
        ].join(' | '),
      });
    }

    addNotification({
      title: 'Data owner alert',
      message: `There are investors interested in project ${project.name}`,
      type: effectivePriority === 'Urgent' ? 'error' : 'warning',
      path: `/gov/projects/${project.id}`,
    });
    addNotification({
      title: 'New opportunity created',
      message: `New opportunity created for ${project.name}`,
      type: 'info',
      path: `/gov/opportunities/${opportunityId}`,
    });
    if (createdMeetingId) {
      addNotification({
        title: 'Meeting request pending',
        message: `Meeting request pending for ${project.name}`,
        type: 'warning',
        path: `/agency/service-workflow?highlight=${createdMeetingId}`,
      });
    }
    if (createdQuestionId) {
      addNotification({
        title: 'Question requires response',
        message: `A new investor question was submitted for ${project.name}`,
        type: 'warning',
        path: `/agency/issues?highlight=${createdQuestionId}`,
      });
    }

    window.localStorage.removeItem(draftKey);
    setSubmittedOpportunityId(opportunityId);
    setQuestionTicketId(createdQuestionId);
    setMeetingTicketId(createdMeetingId);
    setSubmitted(true);
  }

  if (!project) {
    return <div className="page-shell"><div className="section-panel p-8 text-center">{t('Project not found')}</div></div>;
  }

  if (submitted) {
    return (
      <div className="page-shell">
        <div className="section-panel mx-auto max-w-4xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="section-heading mb-2">{t('Your interest has been submitted')}</h1>
          <p className="section-subheading">
            {t('The intake was converted into tracked government workflow objects so the team can respond without asking you to repeat information.')}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">{t('Opportunity')}</div>
              <div className="mt-2 text-base font-semibold text-sky-950">{submittedOpportunityId}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{t('Q&A Thread')}</div>
              <div className="mt-2 text-base font-semibold text-amber-950">{questionTicketId || '-'}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{t('Meeting Ticket')}</div>
              <div className="mt-2 text-base font-semibold text-emerald-950">{meetingTicketId || '-'}</div>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-slate-50 p-5 text-left">
            <div className="mb-3 text-sm font-semibold text-slate-900">{t('Next steps')}</div>
            <div className="space-y-3">
              {[
                'Government receives a new opportunity immediately.',
                'Data owners are alerted when investor interest reaches the project.',
                'Meeting requests and investor questions are treated as high priority.',
                'If no action happens within 24-48 hours, reminders and escalation follow the intake SLA.',
              ].map((item, index) => (
                <DataRow key={item} className="bg-white">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">{index + 1}</div>
                  <div className="flex-1 text-sm text-slate-700">{t(item)}</div>
                </DataRow>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/investor/explorer"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('Back to explorer')}
            </Link>
            <Link
              to="/investor/opportunities"
              className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              {t('View my opportunities')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to={`/investor/project/${projectId}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700">
          <ArrowLeft size={14} />
          {t(project.name)}
        </Link>
        <ChevronRight size={12} />
        <span>{t('Submit intake')}</span>
      </div>

      <section className="section-panel overflow-hidden border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_52%,#ffffff_100%)] p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div>
            <h1 className="section-heading mb-1">{t('Investor Intake Form')}</h1>
            <p className="section-subheading">
              {t('Progressive intake that captures investor intent quickly, expands only when needed, and immediately creates the right workflow objects after submission.')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleFastImport}
                className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50"
              >
                <FileUp size={14} />
                {t('Fast upload / import')}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Save size={14} />
                {t('Save draft')}
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {t('Auto-fill can reuse previous company data so the investor does not need to start from scratch.')}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white/90 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusPill tone="info">{t(project.sector)}</StatusPill>
              <StatusPill tone="default">{t(project.location)}</StatusPill>
              <StatusPill tone={effectivePriority === 'Urgent' ? 'danger' : effectivePriority === 'High' ? 'warning' : 'info'}>
                {t(effectivePriority)}
              </StatusPill>
            </div>
            <div className="text-sm font-semibold text-slate-900">{t(project.name)}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Minimum Investment')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">${project.minInvestment}M</div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Timeline')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{t(project.timeline)}</div>
              </div>
            </div>
            {draftSavedAt ? (
              <div className="mt-3 text-xs text-slate-500">
                {t('Draft saved')}: {new Date(draftSavedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.id}
              className={[
                'rounded-xl border px-4 py-4 transition-colors',
                step === item.id ? 'border-sky-300 bg-sky-50' : step > item.id ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-card',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                {step > item.id ? <CheckCircle2 size={16} className="text-emerald-700" /> : item.icon}
                {t(item.title)}
              </div>
              <div className="text-xs text-slate-500">
                {step > item.id ? t('Completed') : step === item.id ? t('Current step') : t('Upcoming step')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <section className="section-panel p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="section-heading mb-1">{t('Quick intent')}</h2>
                <p className="section-subheading">{t('Step 1 only asks for the core signal so the investor can start quickly and expand later.')}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Interest Type')}</div>
                  <div className="grid gap-3">
                    {interestTypeOptions.map((option) => {
                      const active = intake.investmentIntent.interestType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateInvestmentIntent('interestType', option)}
                          className={[
                            'rounded-xl border px-4 py-3 text-left transition-colors',
                            active ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50',
                          ].join(' ')}
                        >
                          <div className="text-sm font-semibold">{t(option)}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {option === 'Express Interest'
                              ? t('Create an initial opportunity without extra coordination.')
                              : option === 'Request Meeting'
                                ? t('Meeting requests are treated as high priority.')
                                : t('Use this when the investor primarily needs more information.')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Intended investment size')}</span>
                    <input
                      value={intake.investmentIntent.intendedInvestmentSize}
                      onChange={(event) => updateInvestmentIntent('intendedInvestmentSize', event.target.value)}
                      className="app-input"
                      placeholder={t('Example: 50,000,000 or 50M')}
                    />
                  </label>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-semibold">{t('Progressive form')}</div>
                    <div className="mt-1 text-amber-800">{t('You only need these fields to unlock the expanded intake. Everything else can be filled in the next step or saved as a draft.')}</div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{t('Auto-priority rule')}</div>
                    <div className="mt-1">
                      {requiresMeetingBlock || intake.investorQuestion.trim()
                        ? t('Meeting requests and investor questions are automatically handled as high priority.')
                        : t('Normal requests remain on the standard 0-24h intake response window unless urgency is raised.')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Company info')}</div>
                  <div className="mt-2 text-sm text-slate-700">{intake.companyInfo.companyName || t('Will be added in the expanded step.')}</div>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Draft support')}</div>
                  <div className="mt-2 text-sm text-slate-700">{t('Drafts are saved locally so the investor can return later.')}</div>
                </div>
                <div className="rounded-xl border border-border bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Current priority')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{t(effectivePriority)}</div>
                </div>
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="section-heading mb-1">{t('Expanded intake')}</h2>
                <p className="section-subheading">{t('Capture company profile, investment intent, conditions, questions, and meeting details in one structured submission.')}</p>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{t('Section 1 - Company Info')}</div>
                    <div className="mt-1 text-sm text-slate-500">{t('Auto-fill, upload a company profile, or paste a profile link.')}</div>
                  </div>
                  <button type="button" onClick={handleFastImport} className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100">
                    <FileUp size={14} />
                    {t('Fast upload / import')}
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Company name')}</span>
                    <input value={intake.companyInfo.companyName} onChange={(event) => updateCompanyInfo('companyName', event.target.value)} className="app-input" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Country')}</span>
                    <input value={intake.companyInfo.country} onChange={(event) => updateCompanyInfo('country', event.target.value)} className="app-input" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Website')}</span>
                    <input value={intake.companyInfo.website} onChange={(event) => updateCompanyInfo('website', event.target.value)} className="app-input" placeholder="https://example.com" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Company type')}</span>
                    <select value={intake.companyInfo.companyType} onChange={(event) => updateCompanyInfo('companyType', event.target.value)} className="app-input">
                      <option value="">{t('Select company type')}</option>
                      {companyTypeOptions.map((option) => (
                        <option key={option} value={option}>{t(option)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Company profile link')}</span>
                    <input value={intake.companyInfo.companyProfileLink} onChange={(event) => updateCompanyInfo('companyProfileLink', event.target.value)} className="app-input" placeholder="https://example.com/profile.pdf" />
                  </label>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Company profile upload')}</span>
                    <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      <FileUp size={14} />
                      {intake.companyInfo.companyProfileFileName || t('Upload PDF')}
                      <input type="file" accept=".pdf" className="hidden" onChange={handleCompanyProfileFileChange} />
                    </label>
                  </div>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Representative')}</span>
                    <input value={intake.companyInfo.representative} onChange={(event) => updateCompanyInfo('representative', event.target.value)} className="app-input" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Email')}</span>
                    <input value={intake.companyInfo.email} onChange={(event) => updateCompanyInfo('email', event.target.value)} className="app-input" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Phone')}</span>
                    <input value={intake.companyInfo.phone} onChange={(event) => updateCompanyInfo('phone', event.target.value)} className="app-input" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 2 - Interest Type')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('Choose the primary investor action that should be triggered by this intake.')}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {interestTypeOptions.map((option) => {
                    const active = selectedInterestType === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateInvestmentIntent('interestType', option)}
                        className={[
                          'rounded-xl border px-4 py-4 text-left transition-colors',
                          active ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                        ].join(' ')}
                      >
                        <div className="text-sm font-semibold">{t(option)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {option === 'Express Interest'
                            ? t('Register strategic interest and create an opportunity.')
                            : option === 'Request Meeting'
                              ? t('Create both the opportunity and a meeting workflow ticket.')
                              : t('Create the opportunity and let the investor ask for more information.')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 3 - Investment Intent')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('This is the most important section because it defines investment appetite and expected deal structure.')}</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Intended investment size')}</span>
                    <input value={intake.investmentIntent.intendedInvestmentSize} onChange={(event) => updateInvestmentIntent('intendedInvestmentSize', event.target.value)} className="app-input" placeholder={t('Example: 50,000,000 or 50M')} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Investment type')}</span>
                    <select value={intake.investmentIntent.investmentType} onChange={(event) => updateInvestmentIntent('investmentType', event.target.value as InvestmentType | '')} className="app-input">
                      <option value="">{t('Select investment type')}</option>
                      {investmentTypeOptions.map((option) => (
                        <option key={option} value={option}>{t(option)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Ownership expectation (%)')}</span>
                    <input value={intake.investmentIntent.ownershipExpectation} onChange={(event) => updateInvestmentIntent('ownershipExpectation', event.target.value)} className="app-input" placeholder={t('Example: 49%')} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Timeline to invest')}</span>
                    <input value={intake.investmentIntent.timelineToInvest} onChange={(event) => updateInvestmentIntent('timelineToInvest', event.target.value)} className="app-input" placeholder={t('Example: 6-9 months after approval')} />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 4 - Interest Hint')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('Investor interest reasons are valuable because they enrich appetite, sectors, and ticket-size signals for later classification.')}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {interestReasonOptions.map((option) => {
                    const active = intake.interestReasons.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setIntake((current) => ({ ...current, interestReasons: toggleListValue(current.interestReasons, option) }))}
                        className={[
                          'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                          active ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {t(option)}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Specific interest note')}</span>
                  <textarea value={intake.interestNote} onChange={(event) => setIntake((current) => ({ ...current, interestNote: event.target.value }))} rows={4} className="app-input min-h-28" placeholder={t('Add strategic context, market rationale, technology angle, or supply-chain logic.')} />
                </label>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 5 - Requirements & Conditions')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('Capture must-have conditions, deal breakers, and any specific requirements before follow-up begins.')}</div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-emerald-900">{t('Must-have')}</div>
                    <div className="flex flex-wrap gap-2">
                      {mustHaveOptions.map((option) => {
                        const active = intake.mustHaves.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setIntake((current) => ({ ...current, mustHaves: toggleListValue(current.mustHaves, option) }))}
                            className={[
                              'rounded-full border px-3 py-2 text-sm font-semibold transition-colors',
                              active ? 'border-emerald-300 bg-white text-emerald-900' : 'border-emerald-200 bg-emerald-100/70 text-emerald-800 hover:bg-white',
                            ].join(' ')}
                          >
                            {t(option)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-rose-900">{t('Deal breakers')}</div>
                    <div className="flex flex-wrap gap-2">
                      {dealBreakerOptions.map((option) => {
                        const active = intake.dealBreakers.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setIntake((current) => ({ ...current, dealBreakers: toggleListValue(current.dealBreakers, option) }))}
                            className={[
                              'rounded-full border px-3 py-2 text-sm font-semibold transition-colors',
                              active ? 'border-rose-300 bg-white text-rose-900' : 'border-rose-200 bg-rose-100/70 text-rose-800 hover:bg-white',
                            ].join(' ')}
                          >
                            {t(option)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Specific requirements')}</span>
                  <textarea value={intake.specificRequirements} onChange={(event) => setIntake((current) => ({ ...current, specificRequirements: event.target.value }))} rows={4} className="app-input min-h-28" placeholder={t('Add deal conditions, dependencies, legal requirements, or execution prerequisites.')} />
                </label>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 6 - Questions')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('If the investor asks a question, the post-processing flow will create a Q&A thread automatically.')}</div>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Investor question')}</span>
                  <textarea value={intake.investorQuestion} onChange={(event) => setIntake((current) => ({ ...current, investorQuestion: event.target.value }))} rows={4} className="app-input min-h-28" placeholder={t('Enter a free-text investor question for due diligence or clarification.')} />
                </label>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{t('Section 7 - Meeting Request')}</div>
                    <div className="mt-1 text-sm text-slate-500">{t('Meeting details become mandatory only when the investor selects Request Meeting.')}</div>
                  </div>
                  <StatusPill tone={requiresMeetingBlock ? 'warning' : 'default'}>
                    {requiresMeetingBlock ? t('Required') : t('Optional')}
                  </StatusPill>
                </div>
                {requiresMeetingBlock ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Preferred date')}</span>
                      <input type="date" value={intake.meetingPreferredDate} onChange={(event) => setIntake((current) => ({ ...current, meetingPreferredDate: event.target.value }))} className="app-input" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Preferred time')}</span>
                      <input type="time" value={intake.meetingPreferredTime} onChange={(event) => setIntake((current) => ({ ...current, meetingPreferredTime: event.target.value }))} className="app-input" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Meeting type')}</span>
                      <select value={intake.meetingType} onChange={(event) => setIntake((current) => ({ ...current, meetingType: event.target.value as MeetingType | '' }))} className="app-input">
                        <option value="">{t('Select meeting type')}</option>
                        {meetingTypeOptions.map((option) => (
                          <option key={option} value={option}>{t(option)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Participants')}</span>
                      <input value={intake.meetingParticipants} onChange={(event) => setIntake((current) => ({ ...current, meetingParticipants: event.target.value }))} className="app-input" placeholder={t('Example: CIO, project counsel, technical advisor')} />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Agenda')}</span>
                      <textarea value={intake.meetingAgenda} onChange={(event) => setIntake((current) => ({ ...current, meetingAgenda: event.target.value }))} rows={4} className="app-input min-h-28" placeholder={t('Outline the meeting agenda and the decisions needed from the session.')} />
                    </label>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {t('Select Request Meeting above if the investor wants the system to create a meeting coordination ticket.')}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-base font-semibold text-slate-900">{t('Section 8 - Priority / Urgency')}</div>
                <div className="mt-1 text-sm text-slate-500">{t('Meeting requests and investor questions are automatically elevated to high priority, but urgent requests can still be raised manually.')}</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {priorityOptions.map((option) => {
                    const active = intake.priority === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setIntake((current) => ({ ...current, priority: option }))}
                        className={[
                          'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                          active ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {t(option)}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-6">
              <div>
                <h2 className="section-heading mb-1">{t('Review & submit')}</h2>
                <p className="section-subheading">{t('Check what will be created, enriched, and notified before the intake is submitted.')}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">{t('Company snapshot')}</div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <DataRow><span>{t('Company name')}</span><span>{intake.companyInfo.companyName || '-'}</span></DataRow>
                    <DataRow><span>{t('Country')}</span><span>{intake.companyInfo.country || '-'}</span></DataRow>
                    <DataRow><span>{t('Company type')}</span><span>{t(intake.companyInfo.companyType || '-')}</span></DataRow>
                    <DataRow><span>{t('Representative')}</span><span>{intake.companyInfo.representative || '-'}</span></DataRow>
                    <DataRow><span>{t('Company profile')}</span><span>{intake.companyInfo.companyProfileFileName || intake.companyInfo.companyProfileLink || '-'}</span></DataRow>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">{t('Investment snapshot')}</div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <DataRow><span>{t('Interest Type')}</span><span>{t(selectedInterestType || '-')}</span></DataRow>
                    <DataRow><span>{t('Intended investment size')}</span><span>{intake.investmentIntent.intendedInvestmentSize || '-'}</span></DataRow>
                    <DataRow><span>{t('Investment type')}</span><span>{t(intake.investmentIntent.investmentType || '-')}</span></DataRow>
                    <DataRow><span>{t('Ownership expectation (%)')}</span><span>{intake.investmentIntent.ownershipExpectation || '-'}</span></DataRow>
                    <DataRow><span>{t('Timeline to invest')}</span><span>{intake.investmentIntent.timelineToInvest || '-'}</span></DataRow>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">{t('Requirements & conditions')}</div>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div><span className="font-semibold text-slate-900">{t('Must-have')}:</span> {intake.mustHaves.length > 0 ? intake.mustHaves.map((item) => t(item)).join(', ') : '-'}</div>
                    <div><span className="font-semibold text-slate-900">{t('Deal breakers')}:</span> {intake.dealBreakers.length > 0 ? intake.dealBreakers.map((item) => t(item)).join(', ') : '-'}</div>
                    <div><span className="font-semibold text-slate-900">{t('Specific requirements')}:</span> {intake.specificRequirements || '-'}</div>
                    <div><span className="font-semibold text-slate-900">{t('Specific interest note')}:</span> {intake.interestNote || '-'}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 text-sm font-semibold text-slate-900">{t('Question & meeting')}</div>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div><span className="font-semibold text-slate-900">{t('Investor question')}:</span> {intake.investorQuestion || '-'}</div>
                    <div><span className="font-semibold text-slate-900">{t('Meeting request')}:</span> {requiresMeetingBlock ? t('Yes') : t('No')}</div>
                    {requiresMeetingBlock ? (
                      <>
                        <div><span className="font-semibold text-slate-900">{t('Preferred date')}:</span> {intake.meetingPreferredDate || '-'}</div>
                        <div><span className="font-semibold text-slate-900">{t('Preferred time')}:</span> {intake.meetingPreferredTime || '-'}</div>
                        <div><span className="font-semibold text-slate-900">{t('Meeting type')}:</span> {t(intake.meetingType || '-')}</div>
                        <div><span className="font-semibold text-slate-900">{t('Agenda')}:</span> {intake.meetingAgenda || '-'}</div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{t('Post-processing')}</div>
                    <div className="mt-1 text-sm text-slate-500">{t('The system creates workflow objects, enriches the investor profile, and notifies the right teams immediately.')}</div>
                  </div>
                  <StatusPill tone={effectivePriority === 'Urgent' ? 'danger' : effectivePriority === 'High' ? 'warning' : 'info'}>{t(effectivePriority)}</StatusPill>
                </div>
                <div className="space-y-3">
                  {workflowObjects.map((item) => (
                    <DataRow key={item.label} className={item.active ? 'bg-white' : 'bg-white/60 opacity-70'}>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{t(item.label)}</div>
                        <div className="mt-1 text-xs text-slate-500">{t(item.note)}</div>
                      </div>
                      <StatusPill tone={item.active ? item.tone : 'default'}>{item.active ? t('Active') : t('Not triggered')}</StatusPill>
                    </DataRow>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 text-base font-semibold text-slate-900">{t('Data enrichment')}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {enrichmentSignals.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(item.label)}</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{t(item.value)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 text-base font-semibold text-slate-900">{t('Notifications')}</div>
                <div className="space-y-3">
                  {[
                    { title: 'To data owners', note: `There are investors interested in project ${project.name}` },
                    { title: 'To government', note: 'New opportunity created' },
                    { title: 'To agency', note: requiresMeetingBlock ? 'Meeting request pending' : 'Monitor new intake for follow-up if required' },
                  ].map((item) => (
                    <DataRow key={item.title}>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{t(item.title)}</div>
                        <div className="mt-1 text-xs text-slate-500">{t(item.note)}</div>
                      </div>
                    </DataRow>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {workflowError ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {workflowError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => navigate(`/investor/project/${project.id}`)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('Cancel')}
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t('Previous')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Save size={14} />
                {t('Save draft')}
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNextStep}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-800"
                >
                  {t('Next step')}
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAttempt}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Send size={14} />
                  {t('Submit intake')}
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Intake value')}</h2>
              <StatusPill tone="info">{t('Why it matters')}</StatusPill>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <DataRow className="bg-slate-50">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{t('For the Government')}</div>
                  <div className="mt-1 text-xs text-slate-500">{t('No need to ask again. Deal classification starts immediately from the submitted intent and conditions.')}</div>
                </div>
              </DataRow>
              <DataRow className="bg-slate-50">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{t('For the Investor')}</div>
                  <div className="mt-1 text-xs text-slate-500">{t('The intake feels fast, avoids a black-box experience, and gives a clear next-step path.')}</div>
                </div>
              </DataRow>
              <DataRow className="bg-slate-50">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{t('For the System')}</div>
                  <div className="mt-1 text-xs text-slate-500">{t('Structured intake improves data quality, investor profiling, and conversion readiness.')}</div>
                </div>
              </DataRow>
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('Post-processing')}</h2>
              <StatusPill tone="warning">{t('Auto workflow')}</StatusPill>
            </div>
            <div className="space-y-3">
              {workflowObjects.map((item) => (
                <DataRow key={item.label}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{t(item.label)}</div>
                    <div className="mt-1 text-xs text-slate-500">{t(item.note)}</div>
                  </div>
                  <StatusPill tone={item.active ? item.tone : 'default'}>{item.active ? t('Active') : t('Not triggered')}</StatusPill>
                </DataRow>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t('SLA & Escalation')}</h2>
              <StatusPill tone={effectivePriority === 'Urgent' ? 'danger' : effectivePriority === 'High' ? 'warning' : 'info'}>
                {t(effectivePriority)}
              </StatusPill>
            </div>
            <div className="space-y-3">
              {slaItems.map((item) => (
                <DataRow key={item}>
                  <div className="text-sm text-slate-700">{item}</div>
                </DataRow>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">{t('High-priority triggers')}</div>
              <div className="mt-1">{t('Meeting requests and investor questions are always treated as high priority and can escalate after 48 hours without action.')}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
