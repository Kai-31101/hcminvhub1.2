import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, Save } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { SeeAllButton } from '../../components/SeeAllButton';
import { CompletionMeter } from '../../components/ui/completion-meter';
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
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'info';
  if (status === 'delayed') return 'danger';
  return 'default';
}

export default function MilestoneTrackingPage() {
  const { milestones, updateMilestone } = useApp();
  const [searchParams] = useSearchParams();
  const [editId, setEditId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [showAllQueue, setShowAllQueue] = useState(false);
  const [showAllRollup, setShowAllRollup] = useState(false);
  const highlightedId = searchParams.get('highlight');

  const sortedMilestones = useMemo(
    () => milestones.slice().sort((left, right) => daysUntil(left.dueDate) - daysUntil(right.dueDate)),
    [milestones],
  );

  const delayedMilestones = milestones.filter((milestone) => milestone.status === 'delayed');
  const activeMilestones = milestones.filter((milestone) => milestone.status === 'in_progress');
  const completedMilestones = milestones.filter((milestone) => milestone.status === 'completed');
  const dueSoonMilestones = sortedMilestones.filter(
    (milestone) => milestone.status !== 'completed' && daysUntil(milestone.dueDate) <= 30,
  );

  const groupedByProject = sortedMilestones.reduce<Record<string, typeof milestones>>((accumulator, milestone) => {
    const key = milestone.projectName || 'Unknown Project';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(milestone);
    return accumulator;
  }, {});
  const visibleDueSoonMilestones = showAllAttention ? dueSoonMilestones : dueSoonMilestones.slice(0, 4);
  const visibleSortedMilestones = showAllQueue ? sortedMilestones : sortedMilestones.slice(0, DEFAULT_LIST_COUNT);
  const groupedProjectEntries = Object.entries(groupedByProject);
  const visibleGroupedProjectEntries = showAllRollup ? groupedProjectEntries : groupedProjectEntries.slice(0, DEFAULT_LIST_COUNT);

  function startEdit(id: string, progress: number, status: string) {
    setEditId(id);
    setEditProgress(progress);
    setEditStatus(status);
  }

  function handleSave(id: string) {
    const currentMilestone = milestones.find((milestone) => milestone.id === id);
    updateMilestone(id, {
      progress: editProgress,
      status: editStatus as typeof milestones[number]['status'],
      completedDate:
        editStatus === 'completed'
          ? currentMilestone?.completedDate ?? mockToday.toISOString().split('T')[0]
          : undefined,
    });
    setEditId(null);
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="section-heading">Milestone Tracking</h1>
        <p className="section-subheading">Execution control view for progress updates, due-date risk, and milestone completion quality.</p>
      </div>

      <section className="section-panel border-amber-200 bg-amber-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-amber-950">Requires Attention</h2>
          <StatusPill tone="warning">{dueSoonMilestones.length} due soon</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleDueSoonMilestones.map((milestone) => (
            <DataRow key={milestone.id} className="border-amber-200 bg-white">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{milestone.phase}: {milestone.description}</div>
                <div className="mt-1 text-xs text-slate-500">{milestone.projectName}</div>
              </div>
              <UrgencyBadge
                days={Math.max(1, Math.abs(daysUntil(milestone.dueDate)))}
                label={daysUntil(milestone.dueDate) < 0 ? `${Math.abs(daysUntil(milestone.dueDate))} days overdue` : `${daysUntil(milestone.dueDate)} days left`}
              />
            </DataRow>
          ))}
          {dueSoonMilestones.length === 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              No milestone deadlines need intervention right now.
            </div>
          )}
          {!showAllAttention && dueSoonMilestones.length > 4 && (
            <SeeAllButton label="See All" onClick={() => setShowAllAttention(true)} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Tracked Milestones', value: milestones.length, tone: 'text-sky-700' },
          { label: 'In Progress', value: activeMilestones.length, tone: 'text-amber-700' },
          { label: 'Completed', value: completedMilestones.length, tone: 'text-emerald-700' },
          { label: 'Delayed', value: delayedMilestones.length, tone: 'text-red-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">Milestone Operations Queue</h2>
          <StatusPill tone="info">{sortedMilestones.length} items</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleSortedMilestones.map((milestone) => {
            const isEditing = editId === milestone.id;

            return (
              <div key={milestone.id} className={`rounded-xl border bg-card p-4 ${milestone.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : 'border-border'}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{milestone.phase}: {milestone.description}</div>
                      <StatusPill tone={getStatusTone(milestone.status)}>{milestone.status.replace('_', ' ')}</StatusPill>
                      {milestone.status !== 'completed' && (
                        <UrgencyBadge
                          days={Math.max(1, Math.abs(daysUntil(milestone.dueDate)))}
                          label={daysUntil(milestone.dueDate) < 0 ? `${Math.abs(daysUntil(milestone.dueDate))} days overdue` : `${daysUntil(milestone.dueDate)} days left`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        Due {milestone.dueDate}
                      </span>
                      <span>{milestone.projectName}</span>
                      {milestone.completedDate && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 size={12} />
                          Completed {milestone.completedDate}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 max-w-md">
                      <CompletionMeter value={isEditing ? editProgress : milestone.progress} />
                    </div>
                  </div>

                  {!isEditing && milestone.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => startEdit(milestone.id, milestone.progress, milestone.status)}
                      className="app-button-secondary w-full xl:w-auto"
                    >
                      Update milestone
                    </button>
                  )}

                  {!isEditing && milestone.status === 'completed' && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 size={16} />
                      Closed out
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</span>
                        <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="app-input">
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="delayed">Delayed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Progress {editProgress}%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editProgress}
                          onChange={(event) => setEditProgress(Number(event.target.value))}
                          className="w-full"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setEditId(null)} className="app-button-secondary">
                        Cancel
                      </button>
                      <button type="button" onClick={() => handleSave(milestone.id)} className="app-button">
                        <Save size={14} />
                        Save update
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!showAllQueue && sortedMilestones.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton label="See All" onClick={() => setShowAllQueue(true)} />
          )}
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">Project Rollup</h2>
          <StatusPill tone="default">{Object.keys(groupedByProject).length} projects</StatusPill>
        </div>
        <div className="space-y-3">
          {visibleGroupedProjectEntries.map(([projectName, projectMilestones]) => {
            const averageProgress = Math.round(
              projectMilestones.reduce((sum, milestone) => sum + milestone.progress, 0) / projectMilestones.length,
            );
            const openActions = projectMilestones.filter((milestone) => milestone.status !== 'completed').length;

            return (
              <DataRow key={projectName} className="items-start">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{projectName}</div>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{projectMilestones.length} milestones</span>
                    <span>{openActions} active actions</span>
                  </div>
                </div>
                <div className="w-full max-w-40">
                  <CompletionMeter value={averageProgress} />
                </div>
              </DataRow>
            );
          })}
          {!showAllRollup && groupedProjectEntries.length > DEFAULT_LIST_COUNT && (
            <SeeAllButton label="See All" onClick={() => setShowAllRollup(true)} />
          )}
        </div>
      </section>

      <section className="section-panel p-5">
        <div className="flex items-center gap-3 rounded-lg bg-[linear-gradient(135deg,#0c2d4a_0%,#0c4a6e_100%)] px-4 py-4 text-white">
          <Clock3 size={18} className="text-amber-300" />
          <div>
            <div className="text-sm font-semibold">Execution discipline</div>
            <div className="text-xs text-sky-100">Use this queue to push milestones forward before deadlines become permit, issue, or investor-facing risks.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
