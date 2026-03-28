import React, { useMemo, useState } from 'react';
import { FileText, Search, Send } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';

const mockToday = new Date('2024-03-20');

function daysUntil(deadline: string) {
  const dueDate = new Date(deadline);
  return Math.round((dueDate.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusTone(status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'processing' || status === 'submitted') return 'info';
  if (status === 'info_required') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'default';
}

function getSlaTone(slaStatus: string): 'success' | 'warning' | 'danger' {
  if (slaStatus === 'breached') return 'danger';
  if (slaStatus === 'at_risk') return 'warning';
  return 'success';
}

export default function ServiceWorkflowPage() {
  const { serviceRequests, updateServiceRequest, language } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const highlightedId = searchParams.get('highlight');
  const requests = serviceRequests;
  const t = (value: string) => translateText(value, language);

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const matchSearch =
          search.length === 0 ||
          request.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          request.applicant.toLowerCase().includes(search.toLowerCase()) ||
          request.projectName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || request.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [requests, search, statusFilter],
  );

  const escalations = filteredRequests
    .filter((request) => request.slaStatus === 'at_risk' || request.slaStatus === 'breached' || request.status === 'info_required')
    .sort((left, right) => daysUntil(left.deadline) - daysUntil(right.deadline));

  function handleSave(id: string) {
    updateServiceRequest(id, {
      status: editStatus as typeof requests[number]['status'],
      notes: editNotes,
      slaStatus: editStatus === 'info_required' ? 'at_risk' : editStatus === 'approved' ? 'on_track' : 'on_track',
    });
    setEditId(null);
  }

  function openEditor(id: string, status: string, notes: string) {
    setEditId(id);
    setEditStatus(status);
    setEditNotes(notes);
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('Service Workflow')}</h1>
        <p className="section-subheading">{t('Agency work queue for investor services, SLA risk handling, and request resolution notes.')}</p>
      </div>

      <section className="section-panel border-red-200 bg-red-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-red-900">{t('Escalation Queue')}</h2>
          <StatusPill tone="danger">{escalations.length} {t('action items')}</StatusPill>
        </div>
        <div className="space-y-3">
          {escalations.slice(0, 4).map((request) => (
            <DataRow key={request.id} className="border-red-200 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{request.serviceName}</div>
                <div className="mt-1 text-xs text-slate-500">{request.applicant} • {request.projectName}</div>
              </div>
              <StatusPill tone={getSlaTone(request.slaStatus)}>{t(request.slaStatus.replace('_', ' '))}</StatusPill>
              <UrgencyBadge
                days={Math.max(1, Math.abs(daysUntil(request.deadline)))}
                label={daysUntil(request.deadline) < 0 ? `${Math.abs(daysUntil(request.deadline))} days overdue` : `${daysUntil(request.deadline)} days left`}
              />
            </DataRow>
          ))}
          {escalations.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t('No service requests currently need escalation.')}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Requests', value: requests.length, tone: 'text-slate-700' },
          { label: 'Submitted', value: requests.filter((request) => request.status === 'submitted').length, tone: 'text-sky-700' },
          { label: 'Processing', value: requests.filter((request) => request.status === 'processing').length, tone: 'text-amber-700' },
          { label: 'Info Required', value: requests.filter((request) => request.status === 'info_required').length, tone: 'text-orange-700' },
          { label: 'Approved', value: requests.filter((request) => request.status === 'approved').length, tone: 'text-emerald-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <section className="section-panel p-5">
        <div className="filter-bar">
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search service, applicant, or project')}
              className="app-input pl-9"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input w-full md:w-56">
            <option value="all">{t('All statuses')}</option>
            <option value="submitted">{t('Submitted')}</option>
            <option value="processing">{t('Processing')}</option>
            <option value="info_required">{t('Info Required')}</option>
            <option value="approved">{t('Approved')}</option>
            <option value="rejected">{t('Rejected')}</option>
          </select>
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{t('Request Processing Queue')}</h2>
          <StatusPill tone="info">{filteredRequests.length} {t('visible')}</StatusPill>
        </div>
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isEditing = editId === request.id;

            return (
              <div key={request.id} className={`rounded-xl border bg-card p-4 ${request.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : 'border-border'}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{request.serviceName}</div>
                      <StatusPill tone={getStatusTone(request.status)}>{t(request.status.replace('_', ' '))}</StatusPill>
                      <StatusPill tone={getSlaTone(request.slaStatus)}>SLA {t(request.slaStatus.replace('_', ' '))}</StatusPill>
                      <UrgencyBadge
                        days={Math.max(1, Math.abs(daysUntil(request.deadline)))}
                        label={daysUntil(request.deadline) < 0 ? `${Math.abs(daysUntil(request.deadline))} days overdue` : `${daysUntil(request.deadline)} days left`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>{request.applicant}</span>
                      <span>{request.projectName}</span>
                      <span>{t('Submitted')} {request.submittedAt}</span>
                      <span>{t('Assigned')} {request.assignedAgency}</span>
                    </div>
                    {request.notes && <div className="mt-3 text-sm text-slate-600">{request.notes}</div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.documents.map((documentName) => (
                        <span key={documentName} className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                          <FileText size={11} />
                          {documentName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isEditing && request.status !== 'approved' && request.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => openEditor(request.id, request.status, request.notes)}
                      className="app-button-secondary w-full xl:w-auto"
                    >
                      {t('Process request')}
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Workflow status')}</span>
                        <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="app-input">
                          <option value="submitted">{t('Submitted')}</option>
                          <option value="processing">{t('Processing')}</option>
                          <option value="info_required">{t('Info Required')}</option>
                          <option value="approved">{t('Approved')}</option>
                          <option value="rejected">{t('Rejected')}</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Processing note')}</span>
                        <textarea
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          rows={4}
                          className="app-input min-h-28"
                          placeholder={t('Add next-step notes, requested documents, or approval context')}
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setEditId(null)} className="app-button-secondary">
                        {t('Cancel')}
                      </button>
                      <button type="button" onClick={() => handleSave(request.id)} className="app-button">
                        <Send size={14} />
                        {t('Save workflow update')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              {t('No service requests match the current filters.')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
