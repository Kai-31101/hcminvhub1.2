import React, { useMemo, useState } from 'react';
import { ArrowLeft, Landmark, LockKeyhole, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { useGovernance } from '../../context/GovernanceContext';
import { translateText } from '../../utils/localization';

export default function ChairmanReportPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { language, projects, activeInvestorCompany } = useApp();
  const { createChairmanReport } = useGovernance();
  const t = (value: string) => translateText(value, language);
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    investorName: '',
    investorEmail: '',
    investorCompany: activeInvestorCompany,
    attachments: '',
  });
  const [error, setError] = useState('');
  const [createdCaseId, setCreatedCaseId] = useState('');

  function handleSubmit() {
    if (!form.subject.trim() || !form.message.trim() || !form.investorName.trim() || !form.investorEmail.trim() || !form.investorCompany.trim()) {
      setError(t('Please complete subject, message, name, email, and company.'));
      return;
    }
    const id = createChairmanReport({
      projectId: project?.id,
      projectName: project?.name,
      subject: form.subject.trim(),
      message: form.message.trim(),
      investorName: form.investorName.trim(),
      investorEmail: form.investorEmail.trim(),
      investorCompany: form.investorCompany.trim(),
      attachments: form.attachments.split(',').map((item) => item.trim()).filter(Boolean),
    });
    setCreatedCaseId(id);
    setError('');
  }

  if (createdCaseId) {
    return (
      <div className="page-shell">
        <section className="section-panel mx-auto max-w-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1e7] text-[#ed6203]">
            <LockKeyhole size={26} />
          </div>
          <h1 className="section-heading">{t('Confidential report submitted')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {t('Your message was sent to the Chairman-only confidential inbox. Other portals can only see aggregate oversight information and cannot open the report detail.')}
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
            {t('Reference')}: {createdCaseId}
          </div>
          <button
            type="button"
            onClick={() => navigate(project ? `/investor/project/${project.id}` : '/investor/explorer')}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#ed6203] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t('Back to project')}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <Link to={project ? `/investor/project/${project.id}` : '/investor/explorer'} className="inline-flex items-center gap-2 text-sm font-semibold text-[#455f87] hover:text-[#ed6203]">
        <ArrowLeft size={16} />
        {t('Back')}
      </Link>

      <section className="section-panel overflow-hidden">
        <div className="bg-[#071423] px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[#fdba74]">
              <Landmark size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('Report to Chairman of HCMC People Committee')}</h1>
              <p className="mt-1 text-sm text-white/70">{t('Chairman-only confidential channel')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {error ? <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">{error}</div> : null}
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-900">{t('Subject')} *</span>
              <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="app-input" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-900">{t('Confidential message')} *</span>
              <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={8} className="app-input min-h-[180px]" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-900">{t('Full name')} *</span>
                <input value={form.investorName} onChange={(event) => setForm((current) => ({ ...current, investorName: event.target.value }))} className="app-input" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-900">{t('Email')} *</span>
                <input value={form.investorEmail} onChange={(event) => setForm((current) => ({ ...current, investorEmail: event.target.value }))} className="app-input" />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-slate-900">{t('Company')} *</span>
                <input value={form.investorCompany} onChange={(event) => setForm((current) => ({ ...current, investorCompany: event.target.value }))} className="app-input" />
              </label>
              <label className="block space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-slate-900">{t('Attachment names')}</span>
                <input value={form.attachments} onChange={(event) => setForm((current) => ({ ...current, attachments: event.target.value }))} className="app-input" placeholder={t('Optional, comma separated file names')} />
              </label>
            </div>
            <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-md bg-[#ed6203] px-5 py-2.5 text-sm font-semibold text-white">
              <Send size={16} />
              {t('Submit confidential report')}
            </button>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <LockKeyhole size={18} className="text-[#ed6203]" />
              {t('Confidentiality rule')}
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <p>{t('Only the Chairman account can open the full content of this report.')}</p>
              <p>{t('ITPC, Admin, and Agency users cannot view the report detail in phase 1.')}</p>
              <p>{t('UBND dashboard may show aggregate counts and SLA status for leadership monitoring.')}</p>
              {project ? <p><span className="font-semibold text-slate-900">{t('Project')}:</span> {t(project.name)}</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
