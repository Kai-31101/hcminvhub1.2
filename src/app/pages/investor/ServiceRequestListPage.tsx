import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileStack, Search, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { SeeAllButton } from '../../components/SeeAllButton';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { UrgencyBadge } from '../../components/ui/urgency-badge';

const mockToday = new Date('2024-03-20');
const DEFAULT_LIST_COUNT = 6;

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

export default function ServiceRequestListPage() {
  const { serviceRequests, activeInvestorCompany, updateServiceRequest } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAllActionNeeded, setShowAllActionNeeded] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const highlightedId = searchParams.get('highlight');

  const myRequests = serviceRequests.filter((request) => request.applicant === activeInvestorCompany);
  const filteredRequests = useMemo(
    () =>
      myRequests.filter((request) => {
        const matchSearch =
          search.length === 0 ||
          request.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          request.id.toLowerCase().includes(search.toLowerCase()) ||
          request.projectName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || request.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [myRequests, search, statusFilter],
  );

  const actionNeeded = filteredRequests.filter((request) => request.status === 'info_required');
  const visibleActionNeeded = showAllActionNeeded ? actionNeeded : actionNeeded.slice(0, DEFAULT_LIST_COUNT);
  const visibleRequests = showAllRequests ? filteredRequests : filteredRequests.slice(0, DEFAULT_LIST_COUNT);

  function handleUploadMissingDocuments(requestId: string, existingDocuments: string[]) {
    updateServiceRequest(requestId, {
      documents: [...existingDocuments, `Supplement_${existingDocuments.length + 1}.pdf`],
      status: 'submitted',
      slaStatus: 'on_track',
      notes: 'Investor uploaded the requested supplementary documents. Ready for continued review.',
    });
  }

  useEffect(() => {
    if (highlightedId) {
      setExpanded(highlightedId);
    }
  }, [highlightedId]);

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">My Service Requests</h1>
        <p className="section-subheading">Track submitted applications, current SLA risk, and any requests for additional documents.</p>
      </div>

      <section className="section-panel border-amber-200 bg-amber-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-amber-950">Action Needed</h2>
          <StatusPill tone="warning">{actionNeeded.length} requests</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleActionNeeded.map((request) => (
            <DataRow key={request.id} className="border-amber-200 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{request.serviceName}</div>
                <div className="mt-1 text-xs text-slate-500">{request.projectName}</div>
              </div>
              <UrgencyBadge
                days={Math.max(1, Math.abs(daysUntil(request.deadline)))}
                label={daysUntil(request.deadline) < 0 ? `${Math.abs(daysUntil(request.deadline))} days overdue` : `${daysUntil(request.deadline)} days left`}
              />
            </DataRow>
          ))}
          {actionNeeded.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              No service requests currently require additional action from you.
            </div>
          )}
          {!showAllActionNeeded && actionNeeded.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton label="See All" onClick={() => setShowAllActionNeeded(true)} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Requests', value: myRequests.length, tone: 'text-sky-700' },
          { label: 'Approved', value: myRequests.filter((request) => request.status === 'approved').length, tone: 'text-emerald-700' },
          { label: 'In Progress', value: myRequests.filter((request) => request.status === 'submitted' || request.status === 'processing').length, tone: 'text-amber-700' },
          { label: 'Info Required', value: myRequests.filter((request) => request.status === 'info_required').length, tone: 'text-orange-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <section className="section-panel p-5">
        <div className="filter-bar">
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by service, request id, or project" className="app-input pl-9" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input w-full md:w-56">
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="processing">Processing</option>
            <option value="info_required">Info Required</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">Service Request Queue</h2>
          <StatusPill tone="info">{filteredRequests.length} visible</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleRequests.map((request) => {
            const isExpanded = expanded === request.id;

            return (
              <div key={request.id} className={`rounded-xl border bg-card p-4 ${request.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : 'border-border'}`}>
                <button type="button" onClick={() => setExpanded(isExpanded ? null : request.id)} className="block w-full text-left">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{request.serviceName}</div>
                        <StatusPill tone={getStatusTone(request.status)}>{request.status.replace('_', ' ')}</StatusPill>
                        <StatusPill tone={request.slaStatus === 'breached' ? 'danger' : request.slaStatus === 'at_risk' ? 'warning' : 'success'}>
                          SLA {request.slaStatus.replace('_', ' ')}
                        </StatusPill>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{request.id}</span>
                        <span>{request.projectName}</span>
                        <span>Assigned {request.assignedAgency}</span>
                        <span>Submitted {request.submittedAt}</span>
                      </div>
                    </div>
                    <UrgencyBadge
                      days={Math.max(1, Math.abs(daysUntil(request.deadline)))}
                      label={daysUntil(request.deadline) < 0 ? `${Math.abs(daysUntil(request.deadline))} days overdue` : `${daysUntil(request.deadline)} days left`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Submitted Documents</div>
                        {request.documents.map((documentName) => (
                          <DataRow key={documentName}>
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            <div className="flex-1 text-sm text-slate-700">{documentName}</div>
                          </DataRow>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status Notes</div>
                        <div className="rounded-xl border border-border bg-slate-50 px-4 py-4 text-sm text-slate-700">
                          {request.notes || 'No additional notes from the processing agency yet.'}
                        </div>
                      </div>
                    </div>

                    {request.status === 'info_required' && (
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => handleUploadMissingDocuments(request.id, request.documents)} className="app-button">
                          <Upload size={14} />
                          Upload missing documents
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
              No service requests match the current filters.
            </div>
          )}
          {!showAllRequests && filteredRequests.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton label="See All" onClick={() => setShowAllRequests(true)} />
          )}
        </div>
      </section>
    </div>
  );
}
