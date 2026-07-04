import React, { useMemo, useState } from 'react';
import { AlertTriangle, Eye, LockKeyhole, MessageSquareText, TimerReset } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RequestCase, useGovernance } from '../../context/GovernanceContext';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';

function slaTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'Responded' || status === 'Closed') return 'success';
  if (status === 'At Risk') return 'warning';
  if (status === 'Overdue') return 'danger';
  return 'info';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

type OversightMode = 'combined' | 'directReport' | 'sla';

export default function UbndOversightPage({ mode = 'combined' }: { mode?: OversightMode }) {
  const { language, agencies } = useApp();
  const { requestCases, requestMessages, getSlaStatus, getSlaTimeCounter, getChairmanOnlyCases, getOperationalCasesForUbnd } = useGovernance();
  const t = (value: string) => translateText(value, language);
  const [selectedCase, setSelectedCase] = useState<RequestCase | null>(
    mode === 'sla' ? getOperationalCasesForUbnd()[0] ?? null : getChairmanOnlyCases()[0] ?? null,
  );
  const [view, setView] = useState<'chairman' | 'operations'>(mode === 'sla' ? 'operations' : 'chairman');
  const chairmanCases = getChairmanOnlyCases();
  const operationalCases = getOperationalCasesForUbnd();
  const agencyPerformance = useMemo(() => agencies.map((agency) => {
    const cases = requestCases.filter((item) => item.assignedAgencyId === agency.id);
    return {
      agency,
      total: cases.length,
      overdue: cases.filter((item) => getSlaStatus(item) === 'Overdue').length,
      responded: cases.filter((item) => getSlaStatus(item) === 'Responded' || getSlaStatus(item) === 'Closed').length,
    };
  }).filter((item) => item.total > 0).sort((a, b) => b.overdue - a.overdue || b.total - a.total), [agencies, getSlaStatus, requestCases]);
  const activeView = mode === 'directReport' ? 'chairman' : mode === 'sla' ? 'operations' : view;
  const displayedCases = activeView === 'chairman' ? chairmanCases : operationalCases;
  const selectedMessages = selectedCase ? requestMessages.filter((item) => item.caseId === selectedCase.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  const stats = [
    { label: 'Total response records', value: requestCases.length, icon: <MessageSquareText size={18} /> },
    { label: 'Chairman-only reports', value: chairmanCases.length, icon: <LockKeyhole size={18} /> },
    { label: 'Overdue responses', value: requestCases.filter((item) => getSlaStatus(item) === 'Overdue').length, icon: <AlertTriangle size={18} /> },
    { label: 'At-risk responses', value: requestCases.filter((item) => getSlaStatus(item) === 'At Risk').length, icon: <TimerReset size={18} /> },
  ];

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading mb-1">
              {t(mode === 'directReport' ? 'Direct Report' : mode === 'sla' ? 'Response SLA and Agency Performance' : 'UBND Response Oversight Center')}
            </h1>
            <p className="text-sm text-slate-500">
              {t(mode === 'directReport' ? 'Chairman-only investor reports.' : mode === 'sla' ? 'Agency response SLA and operational request monitoring.' : 'Leadership view for confidential Chairman reports, agency response SLA, and communication records.')}
            </p>
          </div>
          <StatusPill tone="danger">{t('Chairman access')}</StatusPill>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="kpi-tile">
              <div className="flex items-center justify-between gap-3">
                <div className="text-3xl font-bold text-[#0f3557]">{item.value}</div>
                <div className="text-[#ed6203]">{item.icon}</div>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(item.label)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="section-panel p-4">
          {mode === 'combined' ? <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => { setView('chairman'); setSelectedCase(chairmanCases[0] ?? null); }} className={`rounded-md px-3 py-2 text-xs font-semibold ${view === 'chairman' ? 'bg-[#ed6203] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t('Chairman Inbox')}
            </button>
            <button type="button" onClick={() => { setView('operations'); setSelectedCase(operationalCases[0] ?? null); }} className={`rounded-md px-3 py-2 text-xs font-semibold ${view === 'operations' ? 'bg-[#ed6203] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t('Operational Records')}
            </button>
          </div> : null}
          <div className="space-y-3">
            {displayedCases.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedCase(item)} className={`w-full rounded-xl border p-4 text-left ${selectedCase?.id === item.id ? 'border-[#ed6203] bg-[#fff7ed]' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{t(item.subject)}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{item.investorCompany}</div>
                  </div>
                  {item.confidentiality === 'ChairmanOnly' ? <LockKeyhole size={16} className="text-red-600" /> : <Eye size={16} className="text-sky-700" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={slaTone(getSlaStatus(item))}>{t(getSlaStatus(item))}</StatusPill>
                  <StatusPill tone="default">{getSlaTimeCounter(item, language)}</StatusPill>
                  <StatusPill tone={item.priority === 'Critical' ? 'danger' : 'warning'}>{t(item.priority)}</StatusPill>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="section-panel p-6">
          {selectedCase ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="section-heading mb-1">{t(selectedCase.subject)}</h2>
                  <p className="text-sm text-slate-500">{selectedCase.projectName ? t(selectedCase.projectName) : t('No project context')} • {selectedCase.investorCompany}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={slaTone(getSlaStatus(selectedCase))}>{t(getSlaStatus(selectedCase))}</StatusPill>
                  <StatusPill tone="default">{getSlaTimeCounter(selectedCase, language)}</StatusPill>
                  <StatusPill tone={selectedCase.confidentiality === 'ChairmanOnly' ? 'danger' : 'info'}>{t(selectedCase.confidentiality)}</StatusPill>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Submitted')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{formatDate(selectedCase.submittedAt)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Due')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{formatDate(selectedCase.dueAt)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Assigned agency')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{selectedCase.assignedAgencyName ? t(selectedCase.assignedAgencyName) : t('Not assigned')}</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="text-sm font-bold text-slate-900">{t('Communication record')}</div>
                {selectedMessages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{t(message.senderRole)} → {t(message.receiverRole)} • {t(message.channel)}</span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-800">{t(message.body)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">{t('No records available.')}</div>
          )}
        </section>
      </div>

      {mode !== 'directReport' ? <section className="section-panel p-6">
        <h2 className="section-heading mb-4">{t('Agency Response Performance')}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {agencyPerformance.map(({ agency, total, overdue, responded }) => (
            <div key={agency.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-bold text-slate-900">{agency.nameEn ?? agency.name}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 p-3"><div className="text-lg font-bold">{total}</div><div>{t('Total')}</div></div>
                <div className="rounded-lg bg-red-50 p-3 text-red-700"><div className="text-lg font-bold">{overdue}</div><div>{t('Overdue')}</div></div>
                <div className="rounded-lg bg-green-50 p-3 text-green-700"><div className="text-lg font-bold">{responded}</div><div>{t('Responded')}</div></div>
              </div>
            </div>
          ))}
          {!agencyPerformance.length ? <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{t('No assigned agency response records yet.')}</div> : null}
        </div>
      </section> : null}
    </div>
  );
}
