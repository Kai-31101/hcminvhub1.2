import React, { useMemo, useState } from 'react';
import { AlertTriangle, Search, Edit, Save } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { SeeAllButton } from '../../components/SeeAllButton';
import { StatusPill } from '../../components/ui/status-pill';
import { DataRow } from '../../components/ui/data-row';
const DEFAULT_LIST_COUNT = 6;

const priorityTone: Record<string, 'danger' | 'warning' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'warning',
  low: 'default',
};

const statusTone: Record<string, 'danger' | 'info' | 'success' | 'default'> = {
  open: 'danger',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};

export default function IssueManagementPage() {
  const { issues, updateIssue, language } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showAllIssues, setShowAllIssues] = useState(false);
  const highlightedId = searchParams.get('highlight');
  const t = (value: string) => translateText(value, language);

  const filtered = useMemo(() => issues.filter((issue) => {
    const matchSearch = !search
      || issue.title.toLowerCase().includes(search.toLowerCase())
      || issue.projectName.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    const matchStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  }), [issues, search, priorityFilter, statusFilter]);
  const visibleIssues = showAllIssues ? filtered : filtered.slice(0, DEFAULT_LIST_COUNT);

  const handleSave = (id: string) => {
    updateIssue(id, {
      status: editStatus as typeof issues[number]['status'],
      description: editNote.trim() ? `${issues.find((item) => item.id === id)?.description}\n\nResolution note: ${editNote.trim()}` : issues.find((item) => item.id === id)?.description,
    });
    setEditId(null);
  };

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">{t('Issue Management')}</h1>
        <p className="section-subheading">{t('Prioritize, assign, and resolve execution issues with visible severity and ownership.')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Open', value: issues.filter((issue) => issue.status === 'open').length, tone: 'text-red-700' },
          { label: 'In Progress', value: issues.filter((issue) => issue.status === 'in_progress').length, tone: 'text-sky-700' },
          { label: 'Resolved', value: issues.filter((issue) => issue.status === 'resolved').length, tone: 'text-emerald-700' },
          { label: 'Critical', value: issues.filter((issue) => issue.priority === 'critical').length, tone: 'text-red-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <section className="filter-bar flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search issues...')}
            className="app-input pl-9"
          />
        </div>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="app-input w-auto min-w-44">
          <option value="all">{t('All Priorities')}</option>
          <option value="critical">{t('Critical')}</option>
          <option value="high">{t('High')}</option>
          <option value="medium">{t('Medium')}</option>
          <option value="low">{t('Low')}</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="app-input w-auto min-w-44">
          <option value="all">{t('All Statuses')}</option>
          <option value="open">{t('Open')}</option>
          <option value="in_progress">{t('In Progress')}</option>
          <option value="resolved">{t('Resolved')}</option>
          <option value="closed">{t('Closed')}</option>
        </select>
      </section>

      <div className="space-y-3">
        {visibleIssues.map((issue) => {
          const isEditing = editId === issue.id;

          return (
            <div key={issue.id} className={`section-panel p-4 ${issue.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : issue.priority === 'critical' ? 'border-red-200' : ''}`}>
              <DataRow className="border-0 bg-transparent p-0 hover:bg-transparent">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className={`rounded-md p-2 ${issue.priority === 'critical' ? 'bg-red-50 text-red-700' : issue.priority === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{issue.title}</div>
                      <StatusPill tone={priorityTone[issue.priority]}>{t(issue.priority)}</StatusPill>
                      <StatusPill tone={statusTone[issue.status]}>{t(issue.status.replace('_', ' '))}</StatusPill>
                    </div>
                    <div className="text-xs text-slate-500">{issue.projectName} • {issue.category}</div>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{issue.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>{t('Assigned')} {issue.assignedTo}</span>
                      <span>{t('Reported')} {issue.reportedAt}</span>
                      <span>{t('Updated')} {issue.updatedAt}</span>
                    </div>
                  </div>
                </div>
                {issue.status !== 'resolved' && issue.status !== 'closed' && (
                  <button
                    onClick={() => { setEditId(issue.id); setEditStatus(issue.status); setEditNote(''); }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit size={13} />
                    {t('Update')}
                  </button>
                )}
              </DataRow>

              {isEditing && (
                <div className="mt-4 grid gap-3 border-t border-border pt-4 lg:grid-cols-[1fr,1.5fr,auto]">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Update Status')}</label>
                    <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="app-input">
                      <option value="open">{t('Open')}</option>
                      <option value="in_progress">{t('In Progress')}</option>
                      <option value="resolved">{t('Resolved')}</option>
                      <option value="closed">{t('Closed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('Resolution Notes')}</label>
                    <textarea
                      value={editNote}
                      onChange={(event) => setEditNote(event.target.value)}
                      rows={2}
                      placeholder={t('Describe actions taken...')}
                      className="app-input resize-none"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={() => setEditId(null)} className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {t('Cancel')}
                    </button>
                    <button onClick={() => handleSave(issue.id)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                      <Save size={12} />
                      {t('Save')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!showAllIssues && filtered.length > DEFAULT_LIST_COUNT && (
          <SeeAllButton label={t('See All')} onClick={() => setShowAllIssues(true)} />
        )}
      </div>
    </div>
  );
}
