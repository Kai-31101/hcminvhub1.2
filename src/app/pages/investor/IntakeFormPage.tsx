import React, { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Landmark, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

type InvestmentType = 'Equity' | 'JV' | 'PPP';

interface IntakeFormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  investmentSize: string;
  investmentType: InvestmentType;
  notes: string;
}

const BRAND = {
  blue: '#0f3557',
  blueSoft: '#eef4f8',
  blueBorder: '#d9e3ec',
};

const INVESTMENT_SIZE_OPTIONS = ['< $10M', '$10M - $50M', '$50M - $200M', '>$200M'];
const INVESTMENT_TYPE_OPTIONS: InvestmentType[] = ['Equity', 'JV', 'PPP'];

function amountFromInvestmentSize(investmentSize: string) {
  if (investmentSize === '< $10M') return 8;
  if (investmentSize === '$10M - $50M') return 30;
  if (investmentSize === '$50M - $200M') return 120;
  if (investmentSize === '>$200M') return 250;
  return 25;
}

function dueDate(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
}

function buildDefaultForm(
  companyName: string,
  country: string,
  email: string,
  phone: string,
  investorName: string,
  investmentType: string,
): IntakeFormState {
  return {
    companyName,
    contactName: investorName,
    email,
    phone,
    country,
    investmentSize: '$10M - $50M',
    investmentType: INVESTMENT_TYPE_OPTIONS.includes(investmentType as InvestmentType)
      ? (investmentType as InvestmentType)
      : 'JV',
    notes: '',
  };
}

function selectClassName() {
  return 'h-11 w-full rounded-xl border border-[#cfdbe5] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0f3557]';
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
    addNotification,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const isVi = language === 'vi';
  const project = projects.find((item) => item.id === projectId);

  const latestKnownProfile = useMemo(() => {
    const related = opportunities
      .filter((item) => item.investorCompany === activeInvestorCompany)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return related[0];
  }, [activeInvestorCompany, opportunities]);

  const [form, setForm] = useState<IntakeFormState>(() =>
    buildDefaultForm(
      activeInvestorCompany || latestKnownProfile?.investorCompany || '',
      latestKnownProfile?.investorCountry || 'Vietnam',
      latestKnownProfile?.intakeData.contactEmail || '',
      latestKnownProfile?.intakeData.contactPhone || '',
      latestKnownProfile?.investorName || '',
      latestKnownProfile?.intakeData.investmentStructure || '',
    ),
  );
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedOpportunityId, setSubmittedOpportunityId] = useState('');
  const [submittedIssueId, setSubmittedIssueId] = useState('');

  function updateField<K extends keyof IntakeFormState>(key: K, value: IntakeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) return;

    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
      setError(
        isVi
          ? 'Vui lòng điền tên doanh nghiệp, người liên hệ và email.'
          : 'Please complete company name, contact name, and email.',
      );
      return;
    }

    setError('');
    setActiveInvestorCompany(form.companyName.trim());

    const opportunityId = createOpportunity({
      projectId: project.id,
      projectName: project.name,
      investorName: form.contactName.trim(),
      investorCompany: form.companyName.trim(),
      investorCountry: form.country.trim() || 'Vietnam',
      investorType: 'Corporate',
      amount: amountFromInvestmentSize(form.investmentSize),
      stage: 'new',
      notes: form.notes.trim() || 'Submitted from simplified investor intake form.',
      intakeData: {
        investmentStructure: form.investmentType,
        timeline: 'Submitted from project quick intake',
        fundSource: 'To be confirmed',
        experience: form.notes.trim() || 'Project-specific expression of interest',
        contactEmail: form.email.trim(),
        contactPhone: form.phone.trim() || 'Not provided',
      },
    });

    const issueId = createIssue({
      projectId: project.id,
      projectName: project.name,
      title: `Project intake submission - ${form.companyName.trim()}`,
      description: form.notes.trim() || 'Investor submitted project intake from the project detail flow.',
      priority: 'high',
      status: 'open',
      assignedTo: 'ITPC Communication Portal',
      reportedBy: form.contactName.trim(),
      dueDate: dueDate(2),
      category: 'Support',
    });

    addNotification({
      title: 'Assigned project message',
      message: `${form.companyName.trim()} submitted interest for ${project.name}.`,
      type: 'info',
      path: `/gov/projects/${project.id}`,
    });
    addNotification({
      title: 'New project updated',
      message: `Investor intake submitted for ${project.name}.`,
      type: 'warning',
      path: `/agency/projects`,
    });

    setSubmittedOpportunityId(opportunityId);
    setSubmittedIssueId(issueId);
    setSubmitted(true);
  }

  if (!project) {
    return (
      <div className="page-shell">
        <div className="section-panel p-8 text-center">{t('Project not found')}</div>
      </div>
    );
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
            {t('This information will be sent to ITPC Communication Portal')}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                {t('Opportunity')}
              </div>
              <div className="mt-2 text-base font-semibold text-sky-950">{submittedOpportunityId}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                {t('Support request')}
              </div>
              <div className="mt-2 text-base font-semibold text-amber-950">{submittedIssueId}</div>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-slate-50 p-5 text-left">
            <div className="mb-3 text-sm font-semibold text-slate-900">{t('Next steps')}</div>
            <div className="space-y-3">
              {[
                isVi
                  ? 'Thông tin quan tâm đã được ghi nhận cho dự án này.'
                  : 'Your project interest has been recorded for this project.',
                isVi
                  ? 'ITPC sẽ tiếp nhận và điều phối bước tiếp theo trong quy trình.'
                  : 'ITPC will receive the intake and coordinate the next step.',
                isVi
                  ? 'Nhóm phụ trách có thể liên hệ lại qua email hoặc số điện thoại đã cung cấp.'
                  : 'The responsible team may follow up through the email or phone provided.',
              ].map((item, index) => (
                <DataRow key={item} className="bg-white">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm text-slate-700">{item}</div>
                </DataRow>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/investor/project/${project.id}`}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('Back to project')}
            </Link>
            <Link
              to="/investor/execution"
              className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              {t('Go to execution workspace')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link
          to={`/investor/project/${projectId}`}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-sky-700"
        >
          <ArrowLeft size={14} />
          {t(project.name)}
        </Link>
      </div>

      <section
        className="section-panel overflow-hidden border p-6"
        style={{
          borderColor: BRAND.blueBorder,
          background:
            'linear-gradient(135deg, rgba(248,251,255,0.96) 0%, rgba(238,246,255,0.9) 42%, rgba(255,255,255,1) 100%)',
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ backgroundColor: BRAND.blueSoft, borderColor: BRAND.blueBorder, color: BRAND.blue }}
            >
              <Landmark size={14} />
              {isVi ? 'Gửi quan tâm nhanh' : 'Quick project intake'}
            </div>
            <h1 className="mt-4 text-3xl font-semibold" style={{ color: BRAND.blue }}>
              {t('Express Interest')}
            </h1>
            <p className="mt-3 max-w-[520px] text-sm leading-7 text-slate-600">
              {isVi
                ? 'Biểu mẫu một bước để gửi nhu cầu quan tâm cho dự án này. ITPC sẽ tiếp nhận thông tin, điều phối đầu mối phụ trách và theo dõi bước tiếp theo.'
                : 'A single-step form to submit your interest in this project. ITPC will capture the request, route it to the responsible desk, and coordinate the next step.'}
            </p>

            <div className="mt-5 rounded-2xl border bg-white px-5 py-5" style={{ borderColor: BRAND.blueBorder }}>
              <div className="space-y-4">
                {[
                  isVi ? 'Tiếp nhận nhu cầu nhà đầu tư' : 'Capture investor demand',
                  isVi ? 'Điều phối đến đầu mối phụ trách' : 'Route to the responsible support desk',
                  isVi
                    ? 'Phối hợp bước tiếp theo trong quy trình cấp thành phố'
                    : 'Coordinate the next step inside the city workflow',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      style={{ color: BRAND.blue }}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border bg-white p-5" style={{ borderColor: BRAND.blueBorder }}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill tone="info">{t(project.sector)}</StatusPill>
                <StatusPill tone="default">{t(project.location)}</StatusPill>
              </div>
              <div className="text-base font-semibold text-slate-900">{t(project.name)}</div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <DataRow>
                  <span>{t('Minimum Investment')}</span>
                  <span>${project.minInvestment}M</span>
                </DataRow>
                <DataRow>
                  <span>{t('Timeline')}</span>
                  <span>{t(project.timeline)}</span>
                </DataRow>
              </div>
            </div>
          </div>

          <div
            className="rounded-[28px] border bg-white p-6 shadow-[0_12px_36px_rgba(15,53,87,0.05)]"
            style={{ borderColor: BRAND.blueBorder }}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.blue }}>
                {isVi ? 'Biểu mẫu tiếp nhận' : 'Intake form'}
              </div>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: BRAND.blue }}>
                {isVi ? 'Gửi quan tâm dự án' : 'Submit project interest'}
              </h2>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Company name')}
                </span>
                <Input
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Contact name')}
                </span>
                <Input
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.contactName}
                  onChange={(event) => updateField('contactName', event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </span>
                <Input
                  type="email"
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Phone')}
                </span>
                <Input
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Country')}
                </span>
                <Input
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Investment type')}
                </span>
                <select
                  className={selectClassName()}
                  value={form.investmentType}
                  onChange={(event) => updateField('investmentType', event.target.value as InvestmentType)}
                >
                  {INVESTMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Intended investment size')}
                </span>
                <select
                  className={selectClassName()}
                  value={form.investmentSize}
                  onChange={(event) => updateField('investmentSize', event.target.value)}
                >
                  {INVESTMENT_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('Notes')}
                </span>
                <Textarea
                  className="border-[#cfdbe5] bg-white shadow-[inset_0_0_0_1px_rgba(15,53,87,0.05)]"
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder={
                    isVi
                      ? 'Mô tả nhu cầu đầu tư, phạm vi quan tâm hoặc các lưu ý cần hỗ trợ.'
                      : 'Describe your investment intent, scope of interest, or support needed.'
                  }
                />
              </label>

              <div className="md:col-span-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => navigate(`/investor/project/${project.id}`)}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" className="rounded-full px-6 text-white" style={{ backgroundColor: BRAND.blue }}>
                  <Send size={14} className="mr-2" />
                  {t('Submit intake')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
