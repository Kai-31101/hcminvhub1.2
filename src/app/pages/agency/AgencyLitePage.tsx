import React, { useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, MessageSquareText, Save, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useGovernance } from '../../context/GovernanceContext';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

function slaTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'Responded' || status === 'Closed') return 'success';
  if (status === 'At Risk') return 'warning';
  if (status === 'Overdue') return 'danger';
  return 'info';
}

export default function AgencyLitePage() {
  const { language, activeAgency, activeAgencyId, projects, updateProject } = useApp();
  const { getVisibleCasesForAgency, requestMessages, addCaseMessage, getSlaStatus, getSlaTimeCounter } = useGovernance();
  const t = (value: string) => translateText(value, language);
  const agencyCases = getVisibleCasesForAgency(activeAgencyId);
  const assignedProjects = useMemo(
    () => projects.filter((project) => project.ownerAgencyId === activeAgencyId || agencyCases.some((item) => item.projectId === project.id)),
    [activeAgencyId, agencyCases, projects],
  );
  const [otpStep, setOtpStep] = useState<'ready' | 'sent' | 'verified'>('ready');
  const [selectedCaseId, setSelectedCaseId] = useState(agencyCases[0]?.id ?? '');
  const [response, setResponse] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(assignedProjects[0]?.id ?? '');
  const selectedCase = agencyCases.find((item) => item.id === selectedCaseId) ?? agencyCases[0];
  const selectedProject = assignedProjects.find((item) => item.id === selectedProjectId) ?? assignedProjects[0];
  const [projectDraft, setProjectDraft] = useState({
    name: selectedProject?.name ?? '',
    description: selectedProject?.description ?? '',
    budget: selectedProject?.budget ? String(selectedProject.budget) : '',
  });

  function syncProjectDraft(projectId: string) {
    const project = assignedProjects.find((item) => item.id === projectId);
    setSelectedProjectId(projectId);
    setProjectDraft({
      name: project?.name ?? '',
      description: project?.description ?? '',
      budget: project?.budget ? String(project.budget) : '',
    });
  }

  function handleResponse() {
    if (!selectedCase || !response.trim()) return;
    addCaseMessage(selectedCase.id, {
      senderRole: 'Agency',
      senderName: activeAgency?.contactPerson ?? 'Agency Lite Account',
      senderOrganization: activeAgency?.nameEn ?? activeAgency?.name ?? 'Agency',
      receiverRole: 'ITPC',
      receiverOrganization: 'ITPC',
      body: response.trim(),
      channel: 'Agency Lite Portal',
      attachments: [],
    });
    setResponse('');
  }

  function handleSaveProject() {
    if (!selectedProject) return;
    updateProject(selectedProject.id, {
      name: projectDraft.name.trim() || selectedProject.name,
      description: projectDraft.description.trim() || selectedProject.description,
      budget: Number(projectDraft.budget) || selectedProject.budget,
    });
  }

  const fixedEmail = activeAgency?.email ?? `${activeAgency?.shortName?.toLowerCase() ?? 'agency'}@hcmc.gov.vn`;

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading mb-1">{t('Agency Lite Portal')}</h1>
            <p className="text-sm text-slate-500">{t('One fixed agency email account can update assigned project data and respond to routed requests.')}</p>
          </div>
          <StatusPill tone={otpStep === 'verified' ? 'success' : 'warning'}>
            {otpStep === 'verified' ? t('OTP verified') : t('OTP required')}
          </StatusPill>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Fixed agency account')}</div>
            <div className="mt-2 text-sm font-bold text-slate-900">{language === 'vi' ? activeAgency?.name ?? activeAgency?.nameEn ?? t('Agency') : activeAgency?.nameEn ?? activeAgency?.name ?? t('Agency')}</div>
            <div className="text-sm text-slate-600">{fixedEmail}</div>
          </div>
          <button type="button" onClick={() => setOtpStep('sent')} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            <KeyRound size={16} />
            {t('Send OTP')}
          </button>
          <button type="button" onClick={() => setOtpStep('verified')} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 py-2 text-sm font-semibold text-white">
            <CheckCircle2 size={16} />
            {t('Verify demo OTP')}
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-heading mb-0">{t('Assigned Requests')}</h2>
            <StatusPill tone="info">{agencyCases.length}</StatusPill>
          </div>
          <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
            <div className="space-y-2">
              {agencyCases.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedCaseId(item.id)} className={`w-full rounded-lg border p-3 text-left ${selectedCase?.id === item.id ? 'border-[#ed6203] bg-[#fff7ed]' : 'border-slate-200 bg-white'}`}>
                  <div className="text-sm font-bold text-slate-900">{t(item.subject)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill tone={slaTone(getSlaStatus(item))}>{t(getSlaStatus(item))}</StatusPill>
                    <StatusPill tone="default">{getSlaTimeCounter(item, language)}</StatusPill>
                    <StatusPill tone="default">{t(item.status)}</StatusPill>
                  </div>
                </button>
              ))}
              {!agencyCases.length ? <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{t('No assigned requests for this agency.')}</div> : null}
            </div>
            {selectedCase ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-bold text-slate-900">{t(selectedCase.subject)}</div>
                <div className="mt-1 text-xs text-slate-500">{selectedCase.projectName ? t(selectedCase.projectName) : ''}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={slaTone(getSlaStatus(selectedCase))}>{t(getSlaStatus(selectedCase))}</StatusPill>
                  <StatusPill tone="default">{getSlaTimeCounter(selectedCase, language)}</StatusPill>
                </div>
                <div className="mt-4 space-y-3">
                  {requestMessages.filter((message) => message.caseId === selectedCase.id).map((message) => (
                    <div key={message.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-500">{t(message.senderRole)} • {new Date(message.createdAt).toLocaleString()}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-800">{t(message.body)}</div>
                    </div>
                  ))}
                </div>
                <textarea value={response} onChange={(event) => setResponse(event.target.value)} rows={4} className="app-input mt-4 min-h-[110px]" placeholder={t('Write agency response to ITPC')} />
                <button type="button" onClick={handleResponse} disabled={otpStep !== 'verified'} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#0f3557] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                  <Send size={15} />
                  {t('Send response')}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-heading mb-0">{t('Assigned Project Data')}</h2>
            <StatusPill tone="info">{assignedProjects.length}</StatusPill>
          </div>
          {selectedProject ? (
            <div className="space-y-4">
              <select value={selectedProject.id} onChange={(event) => syncProjectDraft(event.target.value)} className="app-input">
                {assignedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-900">{t('Project name')}</span>
                <input value={projectDraft.name} onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))} className="app-input" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-900">{t('Total investment')}</span>
                <input value={projectDraft.budget} onChange={(event) => setProjectDraft((current) => ({ ...current, budget: event.target.value }))} className="app-input" />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-900">{t('Project description')}</span>
                <textarea value={projectDraft.description} onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))} rows={7} className="app-input min-h-[180px]" />
              </label>
              <button type="button" onClick={handleSaveProject} disabled={otpStep !== 'verified'} className="inline-flex items-center gap-2 rounded-md bg-[#ed6203] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                <Save size={15} />
                {t('Save project update')}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              {t('No assigned projects for this agency.')}
            </div>
          )}
          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <div className="mb-1 flex items-center gap-2 font-bold"><MessageSquareText size={16} />{t('Phase 1 account rule')}</div>
            {t('Only one fixed email account is active per agency. Multi-user roles and permission delegation remain future phase.')}
          </div>
        </section>
      </div>
    </div>
  );
}
