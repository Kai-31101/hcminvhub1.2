import React, { useMemo, useState } from 'react';
import { AlertTriangle, Building2, LockKeyhole, MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RequestCase, useGovernance } from '../../context/GovernanceContext';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

export type ItpcLiteTab = 'interest' | 'meeting' | 'question' | 'support';

const itpcLiteTabs: Array<{ id: ItpcLiteTab; label: string; requestTypes: RequestCase['type'][] }> = [
  { id: 'interest', label: 'Interest', requestTypes: ['investment_support'] },
  { id: 'meeting', label: 'Request Meeting', requestTypes: ['meeting_request'] },
  { id: 'question', label: 'Question', requestTypes: ['project_question'] },
  { id: 'support', label: 'Support', requestTypes: ['project_update'] },
];

function slaTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'Responded' || status === 'Closed') return 'success';
  if (status === 'At Risk') return 'warning';
  if (status === 'Overdue') return 'danger';
  if (status === 'On Track') return 'info';
  return 'default';
}

export default function ItpcIntakePage({ mode = 'full', liteTab = 'interest' }: { mode?: 'full' | 'lite'; liteTab?: ItpcLiteTab }) {
  const { language, agencies } = useApp();
  const { requestCases, requestMessages, routeCaseToAgency, addCaseMessage, updateCaseStatus, getSlaStatus, getSlaTimeCounter } = useGovernance();
  const t = (value: string) => translateText(value, language);
  const [selectedCaseId, setSelectedCaseId] = useState(requestCases[0]?.id ?? '');
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? '');
  const [routeNote, setRouteNote] = useState('');
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<'all' | 'standard' | 'chairman'>('all');
  const selectedLiteTab = itpcLiteTabs.find((item) => item.id === liteTab) ?? itpcLiteTabs[0];
  const visibleCases = useMemo(
    () => requestCases.filter((item) => mode !== 'lite' || item.confidentiality === 'Standard'),
    [mode, requestCases],
  );
  const tabbedCases = useMemo(
    () => mode === 'lite'
      ? visibleCases.filter((item) => selectedLiteTab.requestTypes.includes(item.type))
      : visibleCases,
    [mode, selectedLiteTab.requestTypes, visibleCases],
  );
  const filteredCases = useMemo(() => tabbedCases.filter((item) => {
    if (filter === 'standard') return item.confidentiality === 'Standard';
    if (filter === 'chairman') return item.confidentiality === 'ChairmanOnly';
    return true;
  }), [filter, tabbedCases]);
  const selectedCase = tabbedCases.find((item) => item.id === selectedCaseId) ?? filteredCases[0];
  const visibleMessages = selectedCase ? requestMessages.filter((item) => item.caseId === selectedCase.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  const isChairmanOnly = selectedCase?.confidentiality === 'ChairmanOnly';

  function handleRoute() {
    if (!selectedCase || !agencyId) return;
    routeCaseToAgency(selectedCase.id, agencyId, routeNote || 'Please review and respond through Agency Lite Portal.');
    setRouteNote('');
  }

  function handleReply() {
    if (!selectedCase || !reply.trim()) return;
    addCaseMessage(selectedCase.id, {
      senderRole: 'ITPC',
      senderName: 'ITPC Coordination Desk',
      senderOrganization: 'ITPC',
      receiverRole: selectedCase.assignedAgencyId ? 'Agency' : 'Investor',
      receiverOrganization: selectedCase.assignedAgencyName ?? selectedCase.investorCompany,
      body: reply.trim(),
      channel: 'ITPC Portal',
      attachments: [],
    });
    setReply('');
  }

  const stats = [
    { label: 'Total cases', value: tabbedCases.length },
    { label: 'Overdue', value: tabbedCases.filter((item) => getSlaStatus(item) === 'Overdue').length },
    { label: 'At risk', value: tabbedCases.filter((item) => getSlaStatus(item) === 'At Risk').length },
    ...(mode === 'full'
      ? [{ label: 'Chairman-only', value: visibleCases.filter((item) => item.confidentiality === 'ChairmanOnly').length }]
      : [{ label: 'Assigned agencies', value: new Set(tabbedCases.map((item) => item.assignedAgencyId).filter(Boolean)).size }]),
  ];
  const pageTitle = mode === 'lite' ? 'ITPC Portal Lite' : 'ITPC Intake and Routing Portal';
  const pageDescription = mode === 'lite'
    ? 'A focused intake workspace for receiving requests, routing cases, monitoring SLA, and recording ITPC responses.'
    : 'Receive investor requests, route to agencies, monitor SLA, and preserve communication records.';

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading mb-1">{t(pageTitle)}</h1>
            <p className="text-sm text-slate-500">{t(pageDescription)}</p>
          </div>
          <StatusPill tone="info">{t('Phase 1')}</StatusPill>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="kpi-tile">
              <div className="text-3xl font-bold text-[#0f3557]">{item.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(item.label)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="section-panel p-4">
          {mode !== 'lite' && (
            <div className="mb-3 flex gap-2">
              {(['all', 'standard', 'chairman'] as const).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${filter === item ? 'bg-[#ed6203] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {t(item === 'all' ? 'All' : item === 'standard' ? 'Standard' : 'Chairman-only')}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {filteredCases.map((item) => {
              const active = item.id === selectedCase?.id;
              return (
                <button key={item.id} type="button" onClick={() => setSelectedCaseId(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${active ? 'border-[#ed6203] bg-[#fff7ed]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">{t(item.subject)}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{item.projectName ? t(item.projectName) : t('No project context')}</div>
                    </div>
                    {item.confidentiality === 'ChairmanOnly' ? <LockKeyhole size={16} className="text-red-600" /> : <MessageSquareText size={16} className="text-sky-700" />}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill tone={slaTone(getSlaStatus(item))}>{t(getSlaStatus(item))}</StatusPill>
                    <StatusPill tone="default">{getSlaTimeCounter(item, language)}</StatusPill>
                    <StatusPill tone={item.priority === 'Critical' ? 'danger' : 'warning'}>{t(item.priority)}</StatusPill>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCase ? (
          <section className="section-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="section-heading mb-1">{t(selectedCase.subject)}</h2>
                <p className="text-sm text-slate-500">{selectedCase.investorCompany} • {selectedCase.projectName ? t(selectedCase.projectName) : t('No project')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={slaTone(getSlaStatus(selectedCase))}>{t(getSlaStatus(selectedCase))}</StatusPill>
                <StatusPill tone="default">{getSlaTimeCounter(selectedCase, language)}</StatusPill>
                <StatusPill tone={isChairmanOnly ? 'danger' : 'info'}>{t(selectedCase.confidentiality)}</StatusPill>
              </div>
            </div>

            {isChairmanOnly ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                  <LockKeyhole size={18} />
                  {t('Chairman-only content')}
                </div>
                <p className="mt-2 text-sm leading-6 text-red-900">
                  {t('ITPC can see that a confidential report exists for SLA monitoring, but cannot open its message detail in phase 1.')}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Investor')}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedCase.investorName}</div>
                    <div className="text-sm text-slate-600">{selectedCase.investorEmail}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assignment')}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedCase.assignedAgencyName ? t(selectedCase.assignedAgencyName) : t('Not assigned')}</div>
                    <div className="text-sm text-slate-600">{t('Due')}: {new Date(selectedCase.dueAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Building2 size={16} />
                    {t('Route to agency')}
                  </div>
                  <div className="grid gap-3 md:grid-cols-[240px_1fr_auto]">
                    <select value={agencyId} onChange={(event) => setAgencyId(event.target.value)} className="app-input">
                      {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.nameEn ?? agency.name}</option>)}
                    </select>
                    <input value={routeNote} onChange={(event) => setRouteNote(event.target.value)} className="app-input" placeholder={t('Routing note')} />
                    <button type="button" onClick={handleRoute} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 py-2 text-sm font-semibold text-white">
                      <Send size={15} />
                      {t('Route')}
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="text-sm font-bold text-slate-900">{t('Communication record')}</div>
                  {visibleMessages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>{t(message.senderRole)} • {t(message.senderOrganization)}</span>
                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-800">{t(message.body)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 p-4">
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} className="app-input min-h-[110px]" placeholder={t('Write ITPC response or clarification note')} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={handleReply} className="inline-flex items-center gap-2 rounded-md bg-[#0f3557] px-4 py-2 text-sm font-semibold text-white">
                      <MessageSquareText size={15} />
                      {t('Record response')}
                    </button>
                    <button type="button" onClick={() => updateCaseStatus(selectedCase.id, 'closed')} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      <ShieldCheck size={15} />
                      {t('Close case')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="section-panel flex items-center justify-center p-12 text-center text-slate-500">
            <AlertTriangle size={20} className="mr-2" />
            {t('No cases available')}
          </section>
        )}
      </div>
    </div>
  );
}
