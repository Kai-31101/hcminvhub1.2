import React, { useMemo, useState } from 'react';
import { HardHat, Search, Edit, Save, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { SeeAllButton } from '../../components/SeeAllButton';
import { StatusPill } from '../../components/ui/status-pill';
import { DataRow } from '../../components/ui/data-row';
import { UrgencyBadge } from '../../components/ui/urgency-badge';

const mockToday = new Date('2024-03-20');
const DEFAULT_LIST_COUNT = 6;

const statusTone: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  pending: 'default',
  in_review: 'info',
  approved: 'success',
  rejected: 'danger',
  info_required: 'warning',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  info_required: 'Info Required',
};

function daysUntil(deadline: string) {
  const date = new Date(deadline);
  return Math.round((date.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PermitTrackerPage() {
  const { permits, updatePermit, language } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editComment, setEditComment] = useState('');
  const [showAllPermits, setShowAllPermits] = useState(false);
  const highlightedId = searchParams.get('highlight');
  const t = (value: string) => translateText(value, language);

  const filtered = useMemo(() => permits.filter((permit) => {
    const matchSearch = !search
      || permit.projectName.toLowerCase().includes(search.toLowerCase())
      || permit.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || permit.status === statusFilter;
    return matchSearch && matchStatus;
  }), [permits, search, statusFilter]);
  const visiblePermits = showAllPermits ? filtered : filtered.slice(0, DEFAULT_LIST_COUNT);

  const handleEdit = (permit: typeof permits[0]) => {
    setEditId(permit.id);
    setEditStatus(permit.status);
    setEditComment(permit.comments);
  };

  const handleSave = (id: string) => {
    updatePermit(id, {
      status: editStatus as typeof permits[number]['status'],
      comments: editComment,
    });
    setEditId(null);
  };

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('Permit Tracker')}</h1>
        <p className="section-subheading">{t('Assigned permit workload with deadline urgency and fast status updates.')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total', value: permits.length, tone: 'text-slate-700' },
          { label: 'Pending', value: permits.filter((permit) => permit.status === 'pending').length, tone: 'text-slate-700' },
          { label: 'In Review', value: permits.filter((permit) => permit.status === 'in_review').length, tone: 'text-sky-700' },
          { label: 'Info Required', value: permits.filter((permit) => permit.status === 'info_required').length, tone: 'text-amber-700' },
          { label: 'Approved', value: permits.filter((permit) => permit.status === 'approved').length, tone: 'text-emerald-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <section className="filter-bar flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search by project or permit type...')}
            className="app-input pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input w-auto min-w-44">
          <option value="all">{t('All Statuses')}</option>
          <option value="pending">{t('Pending')}</option>
          <option value="in_review">{t('In Review')}</option>
          <option value="info_required">{t('Info Required')}</option>
          <option value="approved">{t('Approved')}</option>
          <option value="rejected">{t('Rejected')}</option>
        </select>
      </section>

      <div className="space-y-3">
        {visiblePermits.map((permit) => {
          const isEditing = editId === permit.id;
          const remaining = daysUntil(permit.deadline);

          return (
            <div key={permit.id} className={`section-panel p-4 ${permit.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : remaining < 0 && permit.status !== 'approved' && permit.status !== 'rejected' ? 'border-red-200' : ''}`}>
              <DataRow className="border-0 bg-transparent p-0 hover:bg-transparent">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="rounded-md bg-sky-50 p-2 text-sky-700">
                    <HardHat size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{permit.type}</div>
                      <StatusPill tone={statusTone[permit.status]}>{t(statusLabel[permit.status])}</StatusPill>
                      <StatusPill tone={permit.priority === 'high' ? 'danger' : permit.priority === 'medium' ? 'warning' : 'default'}>
                        {t(permit.priority)} {t('priority')}
                      </StatusPill>
                    </div>
                    <div className="text-xs text-slate-500">{permit.projectName} • {permit.applicant}</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                      <span>{t('Submitted')} {permit.submittedAt}</span>
                      <span>{t('Assigned')} {permit.assignedTo}</span>
                      <span className={remaining < 0 ? 'font-semibold text-red-700' : ''}>{t('Deadline')} {permit.deadline}</span>
                    </div>
                    {permit.comments && !isEditing && (
                      <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <MessageSquare size={12} className="mt-0.5 text-slate-400" />
                        {permit.comments}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UrgencyBadge
                    days={Math.max(1, Math.abs(remaining))}
                    label={remaining >= 0 ? `${remaining} days left` : `${Math.abs(remaining)} days overdue`}
                  />
                  <button
                    onClick={() => isEditing ? setEditId(null) : handleEdit(permit)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit size={13} />
                    {t('Update')}
                  </button>
                </div>
              </DataRow>

              {isEditing && (
                <div className="mt-4 grid gap-3 border-t border-border pt-4 lg:grid-cols-[1fr,1.5fr,auto]">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Update Status')}</label>
                    <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="app-input">
                      <option value="pending">{t('Pending')}</option>
                      <option value="in_review">{t('In Review')}</option>
                      <option value="info_required">{t('Info Required')}</option>
                      <option value="approved">{t('Approved')}</option>
                      <option value="rejected">{t('Rejected')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Comments / Notes')}</label>
                    <textarea
                      value={editComment}
                      onChange={(event) => setEditComment(event.target.value)}
                      rows={2}
                      placeholder={t('Add processing notes...')}
                      className="app-input resize-none"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={() => setEditId(null)} className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {t('Cancel')}
                    </button>
                    <button onClick={() => handleSave(permit.id)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                      <Save size={12} />
                      {t('Save Update')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!showAllPermits && filtered.length > DEFAULT_LIST_COUNT && (
          <SeeAllButton label={t('See All')} onClick={() => setShowAllPermits(true)} />
        )}
      </div>
    </div>
  );
}
